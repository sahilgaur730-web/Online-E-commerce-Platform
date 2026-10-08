package com.shopkart.dto;

import com.shopkart.model.PaymentStatus;
import java.io.Serializable;
import java.math.BigDecimal;

public class PaymentResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private String transactionId;
    private Long orderId;
    private String orderNumber;
    private BigDecimal amount;
    private PaymentStatus status;
    private String clientSecret; // For gateway client initialization
    private String keyId; // Razorpay test key ID
    private String gatewayOrderId; // Razorpay order id (order_xxx)
    private String currency = "INR";

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

    public PaymentResponse(String transactionId, Long orderId, String orderNumber, BigDecimal amount, PaymentStatus status, String clientSecret, String keyId, String gatewayOrderId) {
        this.transactionId = transactionId;
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.amount = amount;
        this.status = status;
        this.clientSecret = clientSecret;
        this.keyId = keyId;
        this.gatewayOrderId = gatewayOrderId;
        this.currency = "INR";
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

    public String getKeyId() {
        return keyId;
    }

    public void setKeyId(String keyId) {
        this.keyId = keyId;
    }

    public String getGatewayOrderId() {
        return gatewayOrderId;
    }

    public void setGatewayOrderId(String gatewayOrderId) {
        this.gatewayOrderId = gatewayOrderId;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
