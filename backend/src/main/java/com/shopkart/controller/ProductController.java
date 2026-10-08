package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.dto.ProductDto;
import com.shopkart.service.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductDto>>> searchProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false, defaultValue = "popularity") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "16") int size) {

        Page<ProductDto> result = productService.searchProducts(
                keyword, categoryId, brand, minPrice, maxPrice, minRating, sortBy, sortDir, page, size
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDto>> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductById(id)));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getFeaturedProducts() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getFeaturedProducts()));
    }

    @GetMapping("/deals")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getDealsOfTheDay() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getDealsOfTheDay()));
    }

    @GetMapping("/top-offers")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getTopOffers() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getTopOffers()));
    }

    @GetMapping("/brands")
    public ResponseEntity<ApiResponse<List<String>>> getBrandsByCategory(@RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getBrandsByCategory(categoryId)));
    }
}
