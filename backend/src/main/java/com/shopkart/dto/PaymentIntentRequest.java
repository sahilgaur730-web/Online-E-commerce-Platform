package com.shopkart.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class PaymentIntentRequest {

    @NotNull(message = "Order ID is required")
    private Long orderId;

    private String paymentMethod; // UPI, CARD, NET_BANKING

    public PaymentIntentRequest() {
    }

    public PaymentIntentRequest(Long orderId) {
        this.orderId = orderId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
