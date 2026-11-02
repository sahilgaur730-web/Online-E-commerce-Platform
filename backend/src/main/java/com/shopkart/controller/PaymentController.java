package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.dto.PaymentIntentRequest;
import com.shopkart.dto.PaymentResponse;
import com.shopkart.dto.PaymentVerificationRequest;
import com.shopkart.security.UserPrincipal;
import com.shopkart.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for payment orchestration, intent generation, verification, and webhook ingestion.
 * <p>
 * Handles integration with payment gateway sandbox (Razorpay), enforces idempotency keys on payment
 * verification to prevent duplicate charges, and processes signed gateway webhooks.
 * </p>
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Initializes a payment intent and gateway order ID for an unfulfilled order.
     * Requires an authenticated user who owns the order.
     *
     * @param principal authenticated buyer
     * @param req valid {@link PaymentIntentRequest} containing target order ID
     * @return response entity containing {@link PaymentResponse} with gateway credentials and order amount
     */
    @PostMapping("/create-intent")
    public ResponseEntity<ApiResponse<PaymentResponse>> createIntent(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PaymentIntentRequest req) {
        PaymentResponse response = paymentService.createPaymentIntent(principal.getId(), req);
        return ResponseEntity.ok(ApiResponse.ok("Payment intent created", response));
    }

    /**
     * Verifies payment completion signature and transitions order to PAID.
     * <p>
     * Supports idempotency protection via {@code Idempotency-Key} or {@code X-Idempotency-Key} header
     * or request body field, preventing duplicate state transitions or duplicate transaction records.
     * </p>
     *
     * @param principal authenticated buyer
     * @param idempotencyKeyHeader optional standard HTTP idempotency header
     * @param xIdempotencyKeyHeader optional vendor HTTP idempotency header
     * @param req valid {@link PaymentVerificationRequest} with orderId, transactionId, signature, and status
     * @return response entity containing {@link PaymentResponse} with confirmation
     */
    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyPayment(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKeyHeader,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String xIdempotencyKeyHeader,
            @Valid @RequestBody PaymentVerificationRequest req) {
        String key = (idempotencyKeyHeader != null && !idempotencyKeyHeader.isBlank())
                ? idempotencyKeyHeader.trim()
                : (xIdempotencyKeyHeader != null && !xIdempotencyKeyHeader.isBlank())
                    ? xIdempotencyKeyHeader.trim()
                    : null;
        if (key != null && (req.getIdempotencyKey() == null || req.getIdempotencyKey().isBlank())) {
            req.setIdempotencyKey(key);
        }
        PaymentResponse response = paymentService.verifyPayment(principal.getId(), req);
        return ResponseEntity.ok(ApiResponse.ok("Payment processed", response));
    }

    /**
     * Ingests asynchronous webhook events dispatched by the payment gateway.
     * Public endpoint verifying HMAC-SHA256 signature in the {@code X-Razorpay-Signature} header.
     *
     * @param payload raw JSON webhook payload
     * @param signature cryptographic HMAC-SHA256 signature from gateway
     * @return response entity confirming successful webhook processing
     */
    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse<String>> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        paymentService.processWebhook(payload, signature);
        return ResponseEntity.ok(ApiResponse.ok("Webhook received and processed", "OK"));
    }
}
