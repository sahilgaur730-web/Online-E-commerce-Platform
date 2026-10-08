package com.shopkart.dto;

import com.shopkart.model.PaymentStatus;
import java.math.BigDecimal;

public class PaymentResponse {
    private String transactionId;
    private Long orderId;
    private String orderNumber;
    private BigDecimal amount;
    private PaymentStatus status;
    private String clientSecret; // For gateway client initialization

    public PaymentResponse() {
    }

    public PaymentResponse(String transactionId, Long orderId, String orderNumber, BigDecimal amount, PaymentStatus status, String clientSecret) {
        this.transactionId = transactionId;
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.amount = amount;
        this.status = status;
        this.clientSecret = clientSecret;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }
}
