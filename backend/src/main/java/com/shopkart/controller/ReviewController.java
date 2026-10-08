package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.dto.ReviewCreateRequest;
import com.shopkart.dto.ReviewDto;
import com.shopkart.security.UserPrincipal;
import com.shopkart.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReviewDto>>> getReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getProductReviews(productId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewDto>> addReview(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReviewCreateRequest req) {
        ReviewDto created = reviewService.addReview(productId, principal.getId(), req);
        return ResponseEntity.ok(ApiResponse.ok("Review submitted successfully", created));
    }
}
