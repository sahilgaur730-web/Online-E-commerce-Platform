package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.dto.DashboardStatsDto;
import com.shopkart.security.UserPrincipal;
import com.shopkart.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller providing analytical metrics and overview statistics for seller dashboards.
 * <p>
 * Accessible strictly to users with {@code ROLE_SELLER} or {@code ROLE_ADMIN}.
 * Aggregates vendor revenue, order totals, pending shipments, and inventory volume.
 * </p>
 */
@RestController
@RequestMapping("/api/seller/dashboard")
@PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
public class SellerDashboardController {

    private final DashboardService dashboardService;

    public SellerDashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * Retrieves dashboard summary metrics scoped to the authenticated seller's store.
     *
     * @param principal authenticated seller principal
     * @return response entity containing {@link DashboardStatsDto}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getSellerDashboard(principal.getId())));
    }
}
