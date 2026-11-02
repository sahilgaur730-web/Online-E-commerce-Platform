package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.dto.AddressDto;
import com.shopkart.security.UserPrincipal;
import com.shopkart.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller managing buyer shipping and billing addresses.
 * <p>
 * Provides authenticated endpoints to list, create, modify, and delete delivery addresses.
 * All operations require an authenticated JWT and restrict access to the authenticated user's records.
 * </p>
 */
@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    /**
     * Retrieves all saved addresses for the authenticated user ordered by default status and recency.
     *
     * @param principal authenticated user principal injected via security context
     * @return response entity containing a list of {@link AddressDto}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AddressDto>>> getMyAddresses(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(addressService.getAddressesByUser(principal.getId())));
    }

    /**
     * Creates a new shipping or billing address for the authenticated user.
     *
     * @param principal authenticated user principal
     * @param dto address data transfer object containing street, city, state, pincode, and type
     * @return response entity containing the created {@link AddressDto} with HTTP 200 OK
     */
    @PostMapping
    public ResponseEntity<ApiResponse<AddressDto>> addAddress(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AddressDto dto) {
        AddressDto saved = addressService.addAddress(principal.getId(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Address added successfully", saved));
    }

    /**
     * Updates an existing address owned by the authenticated user.
     *
     * @param id primary key ID of the address to update
     * @param principal authenticated user principal
     * @param dto updated address details
     * @return response entity containing the updated {@link AddressDto}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AddressDto>> updateAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AddressDto dto) {
        AddressDto updated = addressService.updateAddress(principal.getId(), id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Address updated successfully", updated));
    }

    /**
     * Deletes a specified address owned by the authenticated user.
     *
     * @param id primary key ID of the address to delete
     * @param principal authenticated user principal
     * @return response entity with a confirmation message and null data payload
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        addressService.deleteAddress(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Address deleted", null));
    }
}
