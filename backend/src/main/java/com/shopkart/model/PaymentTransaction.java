package com.shopkart.model;

import java.math.BigDecimal;

/**
 * Backward-compatible alias for {@link com.shopkart.entity.PaymentTransaction}.
 */
public class PaymentTransaction extends com.shopkart.entity.PaymentTransaction {

    public PaymentTransaction() {
        super();
    }

    public PaymentTransaction(Long orderId, String idempotencyKey, String paymentMethod,
                              BigDecimal amount, String currency, String gatewayTransactionId,
                              String gatewayPaymentId, String gatewaySignature, PaymentStatus status) {
        super(orderId, idempotencyKey, paymentMethod, amount, currency, gatewayTransactionId,
              gatewayPaymentId, gatewaySignature, status);
    }
}
