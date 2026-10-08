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

    public AdminController(
            DashboardService dashboardService,
            UserService userService,
            AuditService auditService,
            InventoryService inventoryService) {
        this.dashboardService = dashboardService;
        this.userService = userService;
        this.auditService = auditService;
        this.inventoryService = inventoryService;
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
}
