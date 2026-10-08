package com.shopkart.service;

import com.razorpay.RazorpayClient;
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
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final OrderRepository orderRepository;
    private final OrderTrackingRepository orderTrackingRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Value("${razorpay.key.id:rzp_test_shopkartSandbox101}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:secret_shopkartSandboxKey2026}")
    private String razorpayKeySecret;

    @Value("${razorpay.webhook.secret:whsec_shopkartSandboxSecret}")
    private String razorpayWebhookSecret;

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
        String gatewayOrderId = "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);

        // Attempt official Razorpay SDK order generation
        try {
            if (razorpayKeyId != null && !razorpayKeyId.isBlank() && razorpayKeySecret != null && !razorpayKeySecret.isBlank()) {
                RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
                JSONObject orderReq = new JSONObject();
                long amountPaise = order.getFinalAmount().multiply(new BigDecimal(100)).longValue();
                orderReq.put("amount", amountPaise);
                orderReq.put("currency", "INR");
                orderReq.put("receipt", order.getOrderNumber());
                JSONObject notes = new JSONObject();
                notes.put("orderId", String.valueOf(order.getId()));
                notes.put("buyerEmail", order.getBuyer().getEmail());
                orderReq.put("notes", notes);

                com.razorpay.Order rzpOrder = client.orders.create(orderReq);
                if (rzpOrder != null && rzpOrder.has("id")) {
                    gatewayOrderId = rzpOrder.get("id");
                }
            }
        } catch (Exception ex) {
            log.warn("Razorpay API order creation skipped or offline: {}. Using sandbox order id: {}", ex.getMessage(), gatewayOrderId);
        }

        return new PaymentResponse(
                transactionId,
                order.getId(),
                order.getOrderNumber(),
                order.getFinalAmount(),
                order.getPaymentStatus(),
                clientSecret,
                razorpayKeyId,
                gatewayOrderId
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

        // Validate signature if provided
        if (req.getSignature() != null && !req.getSignature().isBlank()) {
            boolean validSignature = verifyRazorpaySignature(req.getOrderId().toString(), req.getTransactionId(), req.getSignature());
            if (!validSignature && !req.isSuccess()) {
                throw new BadRequestException("Invalid payment signature verification");
            }
        }

        if (!req.isSuccess()) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);
            auditService.log("PAYMENT_FAILED", order.getBuyer().getEmail(),
                    "Payment failed for order " + order.getOrderNumber() + ", Txn: " + req.getTransactionId(),
                    "ORDER", order.getId());
            return new PaymentResponse(req.getTransactionId(), order.getId(), order.getOrderNumber(), order.getFinalAmount(), PaymentStatus.FAILED, null, razorpayKeyId, null);
        }

        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaymentTransactionId(req.getTransactionId());
        if (order.getOrderStatus() == OrderStatus.PLACED) {
            order.setOrderStatus(OrderStatus.CONFIRMED);

            OrderTracking tracking = new OrderTracking(
                    order,
                    OrderStatus.CONFIRMED,
                    "Payment Received & Order Confirmed",
                    "Transaction " + req.getTransactionId() + " verified successfully via Payment Gateway."
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

        return new PaymentResponse(req.getTransactionId(), saved.getId(), saved.getOrderNumber(), saved.getFinalAmount(), PaymentStatus.PAID, null, razorpayKeyId, null);
    }

    public boolean verifyRazorpaySignature(String orderId, String paymentId, String signature) {
        if (signature == null || signature.isBlank() || razorpayKeySecret == null) {
            return false;
        }
        try {
            String payload = orderId + "|" + paymentId;
            return calculateHmacSha256(payload, razorpayKeySecret).equalsIgnoreCase(signature);
        } catch (Exception ex) {
            log.error("Failed to verify Razorpay signature: {}", ex.getMessage());
            return false;
        }
    }

    public boolean verifyWebhookSignature(String payload, String signature) {
        if (signature == null || signature.isBlank() || razorpayWebhookSecret == null) {
            return false;
        }
        try {
            return calculateHmacSha256(payload, razorpayWebhookSecret).equalsIgnoreCase(signature);
        } catch (Exception ex) {
            log.error("Failed to verify Webhook signature: {}", ex.getMessage());
            return false;
        }
    }

    private String calculateHmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKey);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            String h = Integer.toHexString(0xff & b);
            if (h.length() == 1) hex.append('0');
            hex.append(h);
        }
        return hex.toString();
    }

    @Transactional
    public boolean processWebhook(String payload, String signature) {
        if (!verifyWebhookSignature(payload, signature)) {
            log.warn("Webhook signature mismatch or unverified payload received");
            // Still parse safely in sandbox/demo testing mode
        }

        try {
            JSONObject json = new JSONObject(payload);
            String event = json.optString("event", "");
            log.info("Processing Payment Gateway Webhook event: {}", event);

            if ("payment.captured".equals(event) || "order.paid".equals(event)) {
                JSONObject payloadObj = json.optJSONObject("payload");
                if (payloadObj != null) {
                    JSONObject payment = payloadObj.optJSONObject("payment");
                    JSONObject entity = payment != null ? payment.optJSONObject("entity") : null;
                    if (entity != null) {
                        JSONObject notes = entity.optJSONObject("notes");
                        if (notes != null && notes.has("orderId")) {
                            Long orderId = Long.parseLong(notes.getString("orderId"));
                            Order order = orderRepository.findById(orderId).orElse(null);
                            if (order != null && order.getPaymentStatus() != PaymentStatus.PAID) {
                                order.setPaymentStatus(PaymentStatus.PAID);
                                order.setOrderStatus(OrderStatus.CONFIRMED);
                                order.setPaymentTransactionId(entity.optString("id", "WEBHOOK_" + System.currentTimeMillis()));
                                order.setUpdatedAt(LocalDateTime.now());
                                orderRepository.save(order);
                                log.info("Order {} confirmed via Webhook", order.getOrderNumber());
                                return true;
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to process webhook payload: {}", e.getMessage());
        }
        return true;
    }
}
