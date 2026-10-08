package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.dto.ProductDto;
import com.shopkart.security.UserPrincipal;
import com.shopkart.service.WishlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductDto>>> getWishlist(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(wishlistService.getUserWishlist(principal.getId())));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleWishlist(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserPrincipal principal) {
        wishlistService.toggleWishlist(principal.getId(), productId);
        boolean inWishlist = wishlistService.isInWishlist(principal.getId(), productId);
        return ResponseEntity.ok(ApiResponse.ok(inWishlist ? "Added to wishlist" : "Removed from wishlist", Map.of("inWishlist", inWishlist)));
    }

    @GetMapping("/check/{productId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkWishlist(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean inWishlist = wishlistService.isInWishlist(principal.getId(), productId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("inWishlist", inWishlist)));
    }
}
