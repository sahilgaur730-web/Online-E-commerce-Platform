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

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-intent")
    public ResponseEntity<ApiResponse<PaymentResponse>> createIntent(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PaymentIntentRequest req) {
        PaymentResponse response = paymentService.createPaymentIntent(principal.getId(), req);
        return ResponseEntity.ok(ApiResponse.ok("Payment intent created", response));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyPayment(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PaymentVerificationRequest req) {
        PaymentResponse response = paymentService.verifyPayment(principal.getId(), req);
        return ResponseEntity.ok(ApiResponse.ok("Payment processed", response));
    }
}
