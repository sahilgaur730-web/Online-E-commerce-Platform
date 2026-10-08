package com.shopkart.dto;

import jakarta.validation.constraints.Min;

public class UpdateCartRequest {

    @Min(value = 0, message = "Quantity cannot be negative")
    private int quantity;

    public UpdateCartRequest() {
    }

    public UpdateCartRequest(int quantity) {
        this.quantity = quantity;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}
