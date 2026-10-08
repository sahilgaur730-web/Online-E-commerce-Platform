package com.shopkart.service;

import com.shopkart.common.BadRequestException;
import com.shopkart.common.ResourceNotFoundException;
import com.shopkart.dto.PaymentIntentRequest;
import com.shopkart.dto.PaymentResponse;
import com.shopkart.dto.PaymentVerificationRequest;
import com.shopkart.model.Order;
import com.shopkart.model.OrderStatus;
import com.shopkart.model.OrderTracking;
import com.shopkart.model.PaymentStatus;
import com.shopkart.repository.OrderRepository;
import com.shopkart.repository.OrderTrackingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PaymentService {

    private final OrderRepository orderRepository;
    private final OrderTrackingRepository orderTrackingRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public PaymentService(
            OrderRepository orderRepository,
            OrderTrackingRepository orderTrackingRepository,
            NotificationService notificationService,
            AuditService auditService) {
        this.orderRepository = orderRepository;
        this.orderTrackingRepository = orderTrackingRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    public PaymentResponse createPaymentIntent(Long userId, PaymentIntentRequest req) {
        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getBuyer().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to order");
        }

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot pay for cancelled order");
        }

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Order is already paid");
        }

        if (order.getPaymentStatus() == PaymentStatus.REFUNDED) {
            throw new BadRequestException("Order payment has already been refunded");
        }

        String transactionId = "TXN_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
        String clientSecret = "sk_intent_" + UUID.randomUUID().toString();

        return new PaymentResponse(
                transactionId,
                order.getId(),
                order.getOrderNumber(),
                order.getFinalAmount(),
                order.getPaymentStatus(),
                clientSecret
        );
    }

    @Transactional
    public PaymentResponse verifyPayment(Long userId, PaymentVerificationRequest req) {
        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getBuyer().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to order");
        }

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot pay for cancelled order");
        }

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Order is already paid");
        }

        if (order.getPaymentStatus() == PaymentStatus.REFUNDED) {
            throw new BadRequestException("Order payment has already been refunded");
        }

        if (!req.isSuccess()) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);
            auditService.log("PAYMENT_FAILED", order.getBuyer().getEmail(),
                    "Payment failed for order " + order.getOrderNumber() + ", Txn: " + req.getTransactionId(),
                    "ORDER", order.getId());
            return new PaymentResponse(req.getTransactionId(), order.getId(), order.getOrderNumber(), order.getFinalAmount(), PaymentStatus.FAILED, null);
        }

        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaymentTransactionId(req.getTransactionId());
        if (order.getOrderStatus() == OrderStatus.PLACED) {
            order.setOrderStatus(OrderStatus.CONFIRMED);

            OrderTracking tracking = new OrderTracking(
                    order,
                    OrderStatus.CONFIRMED,
                    "Payment Received & Order Confirmed",
                    "Transaction " + req.getTransactionId() + " verified successfully."
            );
            orderTrackingRepository.save(tracking);
        }
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        notificationService.notifyUser(
                order.getBuyer(),
                "Payment Confirmed",
                "Your payment of ₹" + order.getFinalAmount() + " for order " + order.getOrderNumber() + " is successful.",
                "ORDER"
        );
        auditService.log("PAYMENT_SUCCESS", order.getBuyer().getEmail(),
                "Payment successful for order " + order.getOrderNumber() + ", Txn: " + req.getTransactionId(),
                "ORDER", saved.getId());

        return new PaymentResponse(req.getTransactionId(), saved.getId(), saved.getOrderNumber(), saved.getFinalAmount(), PaymentStatus.PAID, null);
    }
}
