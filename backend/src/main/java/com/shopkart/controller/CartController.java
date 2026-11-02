package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.dto.AddToCartRequest;
import com.shopkart.dto.CartSummaryDto;
import com.shopkart.dto.UpdateCartRequest;
import com.shopkart.security.UserPrincipal;
import com.shopkart.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller managing shopping cart items, quantities, and pricing calculations.
 * <p>
 * Requires an authenticated user principal (JWT). Calculates multi-tier totals, discounts,
 * and delivery fees across active cart items.
 * </p>
 */
@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    /**
     * Retrieves the shopping cart summary for the authenticated user, including itemized
     * listings, total price, discounts, and delivery fee calculations.
     *
     * @param principal authenticated user principal
     * @return response entity containing {@link CartSummaryDto}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<CartSummaryDto>> getCart(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(cartService.getCartSummary(principal.getId())));
    }

    /**
     * Adds a product to the authenticated user's shopping cart. If already present, increments quantity.
     *
     * @param principal authenticated user principal
     * @param req valid {@link AddToCartRequest} containing product ID and quantity
     * @return response entity containing the refreshed {@link CartSummaryDto}
     */
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartSummaryDto>> addToCart(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AddToCartRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Added to cart", cartService.addToCart(principal.getId(), req)));
    }

    /**
     * Updates the quantity of a specific item in the authenticated user's cart.
     *
     * @param id cart item primary key ID
     * @param principal authenticated user principal
     * @param req valid {@link UpdateCartRequest} specifying the new positive quantity
     * @return response entity containing the refreshed {@link CartSummaryDto}
     */
    @PutMapping("/items/{id}")
    public ResponseEntity<ApiResponse<CartSummaryDto>> updateQuantity(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateCartRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(cartService.updateQuantity(principal.getId(), id, req.getQuantity())));
    }

    /**
     * Removes an item completely from the authenticated user's shopping cart.
     *
     * @param id cart item primary key ID to remove
     * @param principal authenticated user principal
     * @return response entity containing updated {@link CartSummaryDto}
     */
    @DeleteMapping("/items/{id}")
    public ResponseEntity<ApiResponse<CartSummaryDto>> removeItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok("Removed from cart", cartService.removeFromCart(principal.getId(), id)));
    }

    /**
     * Clears all items from the authenticated user's shopping cart.
     *
     * @param principal authenticated user principal
     * @return response entity confirming cart was cleared
     */
    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<Void>> clearCart(@AuthenticationPrincipal UserPrincipal principal) {
        cartService.clearCart(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Cart cleared", null));
    }
}
