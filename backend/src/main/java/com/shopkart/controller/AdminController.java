package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.dto.DashboardStatsDto;
import com.shopkart.dto.UserProfileDto;
import com.shopkart.model.AuditLog;
import com.shopkart.model.Product;
import com.shopkart.model.Role;
import com.shopkart.security.UserPrincipal;
import com.shopkart.service.AuditService;
import com.shopkart.service.DashboardService;
import com.shopkart.service.InventoryService;
import com.shopkart.service.UserService;
import com.shopkart.dto.SalesReportDTO;
import com.shopkart.repository.jdbc.SalesAnalyticsJdbcDao;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final DashboardService dashboardService;
    private final UserService userService;
    private final AuditService auditService;
    private final InventoryService inventoryService;
    private final com.shopkart.service.ProductService productService;
    private final SalesAnalyticsJdbcDao salesAnalyticsJdbcDao;

    public AdminController(
            DashboardService dashboardService,
            UserService userService,
            AuditService auditService,
            InventoryService inventoryService,
            com.shopkart.service.ProductService productService,
            SalesAnalyticsJdbcDao salesAnalyticsJdbcDao) {
        this.dashboardService = dashboardService;
        this.userService = userService;
        this.auditService = auditService;
        this.inventoryService = inventoryService;
        this.productService = productService;
        this.salesAnalyticsJdbcDao = salesAnalyticsJdbcDao;
    }

    public ResponseEntity<ApiResponse<SalesReportDTO>> getJdbcSalesSummary() {
        return getJdbcSalesSummary(5);
    }

    @GetMapping("/reports/jdbc-sales-summary")
    public ResponseEntity<ApiResponse<SalesReportDTO>> getJdbcSalesSummary(
            @RequestParam(required = false, defaultValue = "5") int topLimit) {
        SalesReportDTO report = salesAnalyticsJdbcDao.generateSalesReport(topLimit);
        return ResponseEntity.ok(ApiResponse.success(report, "JDBC Sales analytics generated successfully"));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getAdminDashboard()));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserProfileDto>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getAllUsers()));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        Role role = Role.valueOf(body.get("role").toUpperCase());
        UserProfileDto updated = userService.updateUserRole(id, role, principal.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("User role updated", updated));
    }

    @PutMapping("/users/{id}/toggle-active")
    public ResponseEntity<ApiResponse<UserProfileDto>> toggleUserActive(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserProfileDto updated = userService.toggleUserActive(id, principal.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("User active status updated", updated));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs() {
        return ResponseEntity.ok(ApiResponse.ok(auditService.getRecentLogs()));
    }

    @GetMapping("/inventory/low-stock")
    public ResponseEntity<ApiResponse<List<Product>>> getLowStockProducts(@RequestParam(defaultValue = "10") int threshold) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getLowStockProducts(threshold)));
    }

    @PutMapping("/inventory/{productId}/stock")
    public ResponseEntity<ApiResponse<Product>> updateStock(
            @PathVariable Long productId,
            @RequestBody Map<String, Integer> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        int newStock = body.getOrDefault("stock", 0);
        Product updated = inventoryService.updateStockManually(productId, newStock, principal.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Stock updated successfully", updated));
    }

    @GetMapping("/catalog")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<com.shopkart.dto.ProductDto>>> getCatalog(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false, defaultValue = "popularity") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(productService.searchProducts(
                keyword, categoryId, brand, minPrice, maxPrice, minRating, sortBy, sortDir, page, size)));
    }

    @PutMapping("/catalog/{productId}/flags")
    public ResponseEntity<ApiResponse<com.shopkart.dto.ProductDto>> updateProductFlags(
            @PathVariable Long productId,
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        Boolean featured = body.get("featured");
        Boolean dealOfTheDay = body.get("dealOfTheDay");
        Boolean topOffer = body.get("topOffer");
        com.shopkart.dto.ProductDto updated = productService.updateProductFlags(
                productId, featured, dealOfTheDay, topOffer, principal.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Product flags updated successfully", updated));
    }

    @DeleteMapping("/catalog/{productId}")
    public ResponseEntity<ApiResponse<Void>> deleteCatalogProduct(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserPrincipal principal) {
        productService.deleteProduct(productId, principal.getId(), true);
        return ResponseEntity.ok(ApiResponse.ok("Product removed from catalog", null));
    }
}
