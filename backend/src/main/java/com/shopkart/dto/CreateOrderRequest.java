package com.shopkart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateOrderRequest {

    @NotNull(message = "Address ID is required")
    private Long addressId;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod; // UPI, CARD, NET_BANKING, COD

    public CreateOrderRequest() {
    }

    public CreateOrderRequest(Long addressId, String paymentMethod) {
        this.addressId = addressId;
        this.paymentMethod = paymentMethod;
    }

    public Long getAddressId() {
        return addressId;
    }

    public void setAddressId(Long addressId) {
        this.addressId = addressId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
