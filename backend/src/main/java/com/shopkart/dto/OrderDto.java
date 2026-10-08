package com.shopkart.dto;

import com.shopkart.model.OrderStatus;
import com.shopkart.model.PaymentStatus;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class OrderDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String orderNumber;
    private Long buyerId;
    private String buyerName;
    private String buyerEmail;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal deliveryFee;
    private BigDecimal finalAmount;
    private String paymentMethod;
    private PaymentStatus paymentStatus;
    private String paymentTransactionId;
    private OrderStatus orderStatus;
    private String shippingAddressSnapshot;
    private String trackingNumber;
    private String cancellationReason;
    private LocalDateTime createdAt;
    private List<OrderItemDto> items = new ArrayList<>();
    private List<OrderTrackingDto> trackingEvents = new ArrayList<>();
    private List<SubOrderDto> subOrders = new ArrayList<>();

    public OrderDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public Long getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public String getBuyerEmail() {
        return buyerEmail;
    }

    public void setBuyerEmail(String buyerEmail) {
        this.buyerEmail = buyerEmail;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(BigDecimal deliveryFee) {
        this.deliveryFee = deliveryFee;
    }

    public BigDecimal getFinalAmount() {
        return finalAmount;
    }

    public void setFinalAmount(BigDecimal finalAmount) {
        this.finalAmount = finalAmount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getPaymentTransactionId() {
        return paymentTransactionId;
    }

    public void setPaymentTransactionId(String paymentTransactionId) {
        this.paymentTransactionId = paymentTransactionId;
    }

    public OrderStatus getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(OrderStatus orderStatus) {
        this.orderStatus = orderStatus;
    }

    public String getShippingAddressSnapshot() {
        return shippingAddressSnapshot;
    }

    public void setShippingAddressSnapshot(String shippingAddressSnapshot) {
        this.shippingAddressSnapshot = shippingAddressSnapshot;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<OrderItemDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDto> items) {
        this.items = items;
    }

    public List<OrderTrackingDto> getTrackingEvents() {
        return trackingEvents;
    }

    public void setTrackingEvents(List<OrderTrackingDto> trackingEvents) {
        this.trackingEvents = trackingEvents;
    }

    public List<SubOrderDto> getSubOrders() {
        return subOrders;
    }

    public void setSubOrders(List<SubOrderDto> subOrders) {
        this.subOrders = subOrders;
    }
}
