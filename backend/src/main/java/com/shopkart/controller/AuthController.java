package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.dto.AuthResponse;
import com.shopkart.dto.LoginRequest;
import com.shopkart.dto.RegisterRequest;
import com.shopkart.dto.UserProfileDto;
import com.shopkart.security.UserPrincipal;
import com.shopkart.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller handling user authentication and profile management.
 * <p>
 * Provides public endpoints for user registration and JWT login, as well as
 * authenticated endpoints to retrieve and modify the currently logged-in user profile.
 * </p>
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Registers a new user account (BUYER or SELLER) and returns an authentication JWT token.
     * Note: Direct registration with ROLE_ADMIN is prohibited and rejected with HTTP 400.
     *
     * @param request valid {@link RegisterRequest} with name, email, password, role, and phone
     * @return response entity containing {@link AuthResponse} with access token and user metadata
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.ok("Registration successful", response));
    }

    /**
     * Authenticates existing user credentials and generates a signed JWT bearer token.
     *
     * @param request valid {@link LoginRequest} containing email and plaintext password
     * @return response entity containing {@link AuthResponse} with JWT access token
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    /**
     * Retrieves the profile details of the currently authenticated user.
     *
     * @param principal authenticated user principal injected from the JWT security context
     * @return response entity containing {@link UserProfileDto} or 401 Unauthorized if unauthenticated
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        UserProfileDto profile = authService.getCurrentProfile(principal);
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    /**
     * Updates profile details (name, phone, store metadata) of the authenticated user.
     *
     * @param principal authenticated user principal
     * @param dto user profile DTO with updated fields
     * @return response entity containing updated {@link UserProfileDto}
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UserProfileDto dto) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        UserProfileDto updated = authService.updateProfile(principal, dto);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", updated));
    }
}
