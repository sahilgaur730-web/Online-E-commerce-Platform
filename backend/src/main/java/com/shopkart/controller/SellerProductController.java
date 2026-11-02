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

/**
 * REST controller for vendor catalog management, product listings, updates, and stock controls.
 * <p>
 * Accessible to authenticated sellers and platform administrators. Enforces ownership
 * boundaries ensuring sellers can only modify or delete products listed under their store.
 * </p>
 */
@RestController
@RequestMapping("/api/seller/products")
public class SellerProductController {

    private final ProductService productService;

    public SellerProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * Retrieves all products listed by the authenticated seller.
     *
     * @param principal authenticated seller principal
     * @return response entity containing a list of {@link ProductDto}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductDto>>> getMyProducts(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductsBySeller(principal.getId())));
    }

    /**
     * Creates a new product listing in the catalog assigned to the authenticated seller.
     *
     * @param principal authenticated seller principal
     * @param req valid {@link ProductCreateRequest} with title, brand, price, stock, category, images
     * @return response entity containing the created {@link ProductDto}
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProductDto>> createProduct(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ProductCreateRequest req) {
        ProductDto created = productService.createProduct(req, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Product created successfully", created));
    }

    /**
     * Updates an existing product listing. Enforces seller ownership unless requester is admin.
     *
     * @param id product primary key ID
     * @param principal authenticated user principal
     * @param req valid {@link ProductCreateRequest} with updated details
     * @return response entity containing updated {@link ProductDto}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDto>> updateProduct(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ProductCreateRequest req) {
        boolean isAdmin = principal.getRole() == Role.ADMIN;
        ProductDto updated = productService.updateProduct(id, req, principal.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.ok("Product updated successfully", updated));
    }

    /**
     * Deletes a product listing from the catalog with ownership verification.
     *
     * @param id product primary key ID
     * @param principal authenticated user principal
     * @return response entity confirming deletion
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean isAdmin = principal.getRole() == Role.ADMIN;
        productService.deleteProduct(id, principal.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.ok("Product deleted successfully", null));
    }

    /**
     * Updates available inventory stock quantity for a seller's product.
     *
     * @param id product primary key ID
     * @param body map containing "stock" integer
     * @param principal authenticated user principal
     * @return response entity containing updated {@link ProductDto}
     */
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
