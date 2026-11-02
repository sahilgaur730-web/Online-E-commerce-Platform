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

/**
 * REST controller managing customer product ratings and reviews.
 * <p>
 * Provides public read access to product reviews, and authenticated submission of reviews
 * with verified purchase auditing and self-review protection.
 * </p>
 */
@RestController
@RequestMapping("/api/products/{productId}/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /**
     * Retrieves all approved customer reviews for a given product.
     * Accessible publicly without authentication.
     *
     * @param productId product primary key ID
     * @return response entity containing list of {@link ReviewDto}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ReviewDto>>> getReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getProductReviews(productId)));
    }

    /**
     * Submits a customer review and star rating for a product.
     * Requires authentication. Prevents sellers from reviewing their own products,
     * rejects duplicate reviews from the same user, and tags verified purchases.
     *
     * @param productId product primary key ID
     * @param principal authenticated buyer principal
     * @param req valid {@link ReviewCreateRequest} containing rating (1-5), title, and comment
     * @return response entity containing created {@link ReviewDto}
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ReviewDto>> addReview(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReviewCreateRequest req) {
        ReviewDto created = reviewService.addReview(productId, principal.getId(), req);
        return ResponseEntity.ok(ApiResponse.ok("Review submitted successfully", created));
    }
}
