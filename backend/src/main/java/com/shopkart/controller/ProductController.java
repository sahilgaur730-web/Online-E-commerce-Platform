package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.dto.ProductDto;
import com.shopkart.service.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * REST controller for public catalog search, product discovery, and brand exploration.
 * <p>
 * Provides unauthenticated read access to search with multi-faceted filtering (category,
 * brand, price range, rating), sorted pagination, and curated product collections
 * (featured, deals of the day, top offers).
 * </p>
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * Searches the catalog with comprehensive filtering, sorting, and pagination.
     * Accessible publicly.
     *
     * @param keyword search term for product title or brand
     * @param categoryId category ID filter
     * @param brand brand name filter
     * @param minPrice minimum price filter
     * @param maxPrice maximum price filter
     * @param minRating minimum rating threshold
     * @param sortBy sort property (e.g. "popularity", "price", "rating", "newest")
     * @param sortDir sort direction ("asc" or "desc")
     * @param page zero-based page index
     * @param size number of items per page
     * @return response entity containing a paged list of {@link ProductDto}
     */
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

    /**
     * Retrieves detailed information for a single product by its primary key ID.
     * Accessible publicly.
     *
     * @param id product primary key ID
     * @return response entity containing {@link ProductDto}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDto>> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProductById(id)));
    }

    /**
     * Retrieves curated featured products for landing page display.
     * Accessible publicly.
     *
     * @return response entity containing list of featured {@link ProductDto}
     */
    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getFeaturedProducts() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getFeaturedProducts()));
    }

    /**
     * Retrieves products curated as deals of the day.
     * Accessible publicly.
     *
     * @return response entity containing list of deal {@link ProductDto}
     */
    @GetMapping("/deals")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getDealsOfTheDay() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getDealsOfTheDay()));
    }

    /**
     * Retrieves products curated with top promotional offers and steep discounts.
     * Accessible publicly.
     *
     * @return response entity containing list of top offer {@link ProductDto}
     */
    @GetMapping("/top-offers")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getTopOffers() {
        return ResponseEntity.ok(ApiResponse.ok(productService.getTopOffers()));
    }

    /**
     * Retrieves distinct brand names, optionally scoped within a specific category.
     * Accessible publicly.
     *
     * @param categoryId optional category filter ID
     * @return response entity containing list of brand name strings
     */
    @GetMapping("/brands")
    public ResponseEntity<ApiResponse<List<String>>> getBrandsByCategory(@RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getBrandsByCategory(categoryId)));
    }
}
