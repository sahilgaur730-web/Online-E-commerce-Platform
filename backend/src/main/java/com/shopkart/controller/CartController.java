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

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CartSummaryDto>> getCart(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(cartService.getCartSummary(principal.getId())));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartSummaryDto>> addToCart(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AddToCartRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Added to cart", cartService.addToCart(principal.getId(), req)));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<ApiResponse<CartSummaryDto>> updateQuantity(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateCartRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(cartService.updateQuantity(principal.getId(), id, req.getQuantity())));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<ApiResponse<CartSummaryDto>> removeItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok("Removed from cart", cartService.removeFromCart(principal.getId(), id)));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<Void>> clearCart(@AuthenticationPrincipal UserPrincipal principal) {
        cartService.clearCart(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Cart cleared", null));
    }
}
