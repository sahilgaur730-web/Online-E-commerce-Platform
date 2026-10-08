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

@RestController
@RequestMapping("/api/seller/dashboard")
@PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
public class SellerDashboardController {

    private final DashboardService dashboardService;

    public SellerDashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getSellerDashboard(principal.getId())));
    }
}
