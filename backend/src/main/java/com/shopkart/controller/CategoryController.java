package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.model.Category;
import com.shopkart.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getAllCategories()));
    }

    @GetMapping("/top")
    public ResponseEntity<ApiResponse<List<Category>>> getTopLevelCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getTopLevelCategories()));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<Category>> getCategoryBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getCategoryBySlug(slug)));
    }
}
