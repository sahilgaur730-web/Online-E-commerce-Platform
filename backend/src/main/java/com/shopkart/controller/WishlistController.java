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

/**
 * REST controller managing customer saved items and wishlist toggling.
 * <p>
 * Requires an authenticated user principal (JWT). Allows buyers to view their saved wishlist,
 * toggle items on and off, and check whether a specific product is currently saved.
 * </p>
 */
@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    /**
     * Retrieves all products currently saved in the authenticated user's wishlist.
     *
     * @param principal authenticated buyer principal
     * @return response entity containing a list of {@link ProductDto}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductDto>>> getWishlist(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(wishlistService.getUserWishlist(principal.getId())));
    }

    /**
     * Toggles a product into or out of the authenticated user's wishlist.
     *
     * @param productId product primary key ID to toggle
     * @param principal authenticated buyer principal
     * @return response entity containing a map with "inWishlist" boolean flag
     */
    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleWishlist(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserPrincipal principal) {
        wishlistService.toggleWishlist(principal.getId(), productId);
        boolean inWishlist = wishlistService.isInWishlist(principal.getId(), productId);
        return ResponseEntity.ok(ApiResponse.ok(inWishlist ? "Added to wishlist" : "Removed from wishlist", Map.of("inWishlist", inWishlist)));
    }

    /**
     * Checks whether a specific product is currently present in the authenticated user's wishlist.
     *
     * @param productId product primary key ID to query
     * @param principal authenticated buyer principal
     * @return response entity containing a map with "inWishlist" boolean flag
     */
    @GetMapping("/check/{productId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkWishlist(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean inWishlist = wishlistService.isInWishlist(principal.getId(), productId);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("inWishlist", inWishlist)));
    }
}
