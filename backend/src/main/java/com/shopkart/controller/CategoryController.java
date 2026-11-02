package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.model.Category;
import com.shopkart.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for catalog category exploration and navigation.
 * <p>
 * Provides public read access to top-level and hierarchical product categories.
 * </p>
 */
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    /**
     * Retrieves all categories defined in the catalog system.
     *
     * @return response entity containing a list of all {@link Category} entities
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getAllCategories()));
    }

    /**
     * Retrieves root/top-level categories that do not have a parent category assigned.
     *
     * @return response entity containing a list of top-level {@link Category} entities
     */
    @GetMapping("/top")
    public ResponseEntity<ApiResponse<List<Category>>> getTopLevelCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getTopLevelCategories()));
    }

    /**
     * Looks up a specific category by its unique URL slug.
     *
     * @param slug unique category slug string (e.g. "electronics", "fashion")
     * @return response entity containing matching {@link Category} entity
     */
    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<Category>> getCategoryBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getCategoryBySlug(slug)));
    }
}
