package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.dto.ActiveDealsResponseDto;
import com.shopkart.dto.FlashDealCreateRequest;
import com.shopkart.dto.FlashDealDto;
import com.shopkart.service.FlashDealService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class DealController {

    private final FlashDealService flashDealService;

    public DealController(FlashDealService flashDealService) {
        this.flashDealService = flashDealService;
    }

    @GetMapping("/api/deals/active")
    public ResponseEntity<ApiResponse<ActiveDealsResponseDto>> getActiveDeals() {
        return ResponseEntity.ok(ApiResponse.ok(flashDealService.getActiveDeals()));
    }

    @GetMapping("/api/admin/deals")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<FlashDealDto>>> getAllDeals() {
        return ResponseEntity.ok(ApiResponse.ok(flashDealService.getAllDeals()));
    }

    @PostMapping("/api/admin/deals")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FlashDealDto>> createDeal(@Valid @RequestBody FlashDealCreateRequest req) {
        FlashDealDto created = flashDealService.createDeal(req);
        return ResponseEntity.ok(ApiResponse.ok("Flash deal created successfully", created));
    }

    @PutMapping("/api/admin/deals/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FlashDealDto>> toggleDealActive(@PathVariable Long id) {
        FlashDealDto toggled = flashDealService.toggleDealActive(id);
        return ResponseEntity.ok(ApiResponse.ok("Flash deal status updated", toggled));
    }

    @DeleteMapping("/api/admin/deals/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteDeal(@PathVariable Long id) {
        flashDealService.deleteDeal(id);
        return ResponseEntity.ok(ApiResponse.ok("Flash deal deleted successfully", null));
    }
}
