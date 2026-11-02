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

/**
 * REST controller for flash deals, promotional countdowns, and administrative deal curation.
 * <p>
 * Provides public endpoints to fetch currently active and upcoming flash deals, as well as
 * administrative endpoints restricted to {@code ROLE_ADMIN} to create, toggle, and delete deals.
 * </p>
 */
@RestController
public class DealController {

    private final FlashDealService flashDealService;

    public DealController(FlashDealService flashDealService) {
        this.flashDealService = flashDealService;
    }

    /**
     * Retrieves currently active flash deals and upcoming scheduled deals with promotional pricing.
     * Accessible publicly without authentication.
     *
     * @return response entity containing {@link ActiveDealsResponseDto} with active and upcoming deals
     */
    @GetMapping("/api/deals/active")
    public ResponseEntity<ApiResponse<ActiveDealsResponseDto>> getActiveDeals() {
        return ResponseEntity.ok(ApiResponse.ok(flashDealService.getActiveDeals()));
    }

    /**
     * Lists all flash deals (active, expired, upcoming) for administrative management.
     * Requires {@code ROLE_ADMIN}.
     *
     * @return response entity containing list of all {@link FlashDealDto}
     */
    @GetMapping("/api/admin/deals")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<FlashDealDto>>> getAllDeals() {
        return ResponseEntity.ok(ApiResponse.ok(flashDealService.getAllDeals()));
    }

    /**
     * Creates a new flash deal with custom discounted pricing, stock allocation, and time window.
     * Requires {@code ROLE_ADMIN}.
     *
     * @param req valid {@link FlashDealCreateRequest} containing product ID, discount/deal price, and schedule
     * @return response entity containing created {@link FlashDealDto}
     */
    @PostMapping("/api/admin/deals")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FlashDealDto>> createDeal(@Valid @RequestBody FlashDealCreateRequest req) {
        FlashDealDto created = flashDealService.createDeal(req);
        return ResponseEntity.ok(ApiResponse.ok("Flash deal created successfully", created));
    }

    /**
     * Toggles the active/inactive state of a specified flash deal.
     * Requires {@code ROLE_ADMIN}.
     *
     * @param id flash deal primary key ID
     * @return response entity containing updated {@link FlashDealDto}
     */
    @PutMapping("/api/admin/deals/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FlashDealDto>> toggleDealActive(@PathVariable Long id) {
        FlashDealDto toggled = flashDealService.toggleDealActive(id);
        return ResponseEntity.ok(ApiResponse.ok("Flash deal status updated", toggled));
    }

    /**
     * Permanently deletes a flash deal configuration.
     * Requires {@code ROLE_ADMIN}.
     *
     * @param id flash deal primary key ID
     * @return response entity confirming deletion
     */
    @DeleteMapping("/api/admin/deals/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteDeal(@PathVariable Long id) {
        flashDealService.deleteDeal(id);
        return ResponseEntity.ok(ApiResponse.ok("Flash deal deleted successfully", null));
    }
}
