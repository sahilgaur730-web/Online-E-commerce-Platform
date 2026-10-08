package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.dto.ProductCreateRequest;
import com.shopkart.dto.ProductDto;
import com.shopkart.model.Role;
import com.shopkart.security.UserPrincipal;
import com.shopkart.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seller/products")
public class SellerProductController {

    private final ProductService productService;

    public SellerProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductDto>>> getMyProducts(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductsBySeller(principal.getId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductDto>> createProduct(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ProductCreateRequest req) {
        ProductDto created = productService.createProduct(req, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Product created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDto>> updateProduct(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ProductCreateRequest req) {
        boolean isAdmin = principal.getRole() == Role.ADMIN;
        ProductDto updated = productService.updateProduct(id, req, principal.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.ok("Product updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean isAdmin = principal.getRole() == Role.ADMIN;
        productService.deleteProduct(id, principal.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.ok("Product deleted successfully", null));
    }

    @PutMapping("/{id}/stock")
    public ResponseEntity<ApiResponse<ProductDto>> updateStock(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        int newStock = body != null && body.containsKey("stock") ? body.get("stock") : 0;
        boolean isAdmin = principal.getRole() == Role.ADMIN;
        ProductDto updated = productService.updateProductStock(id, newStock, principal.getId(), principal.getEmail(), isAdmin);
        return ResponseEntity.ok(ApiResponse.ok("Stock updated successfully", updated));
    }
}
