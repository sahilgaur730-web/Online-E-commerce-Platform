package com.shopkart.service;

import com.shopkart.common.BadRequestException;
import com.shopkart.dto.AuthResponse;
import com.shopkart.dto.LoginRequest;
import com.shopkart.dto.RegisterRequest;
import com.shopkart.dto.UserProfileDto;
import com.shopkart.model.Role;
import com.shopkart.model.User;
import com.shopkart.repository.UserRepository;
import com.shopkart.security.JwtUtils;
import com.shopkart.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final AuditService auditService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtUtils jwtUtils,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.auditService = auditService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getRole() == Role.ADMIN) {
            throw new BadRequestException("Registration as ADMIN is not permitted");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail().toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(request.getRole() == Role.SELLER ? Role.SELLER : Role.BUYER);

        if (user.getRole() == Role.SELLER) {
            user.setStoreName(request.getStoreName() != null ? request.getStoreName() : request.getName() + "'s Store");
            user.setStoreDescription(request.getStoreDescription());
        }

        user = userRepository.save(user);

        UserPrincipal principal = UserPrincipal.create(user);
        String token = jwtUtils.generateToken(principal);

        auditService.log("USER_REGISTERED", user.getEmail(), "Registered with role " + user.getRole(), "USER", user.getId());

        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getStoreName());
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase().trim(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtUtils.generateToken(principal);

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!user.isActive()) {
            throw new BadRequestException("This account has been deactivated. Please contact support.");
        }

        auditService.log("USER_LOGIN", user.getEmail(), "Successful login", "USER", user.getId());

        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getStoreName());
    }

    public UserProfileDto getCurrentProfile(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BadRequestException("User not found"));
        return new UserProfileDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStoreName(),
                user.getStoreDescription(),
                user.isActive(),
                user.getCreatedAt()
        );
    }

    @Transactional
    public UserProfileDto updateProfile(UserPrincipal principal, UserProfileDto dto) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (dto.getName() != null && !dto.getName().isBlank()) {
            user.setName(dto.getName());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }
        if (user.getRole() == Role.SELLER) {
            if (dto.getStoreName() != null) user.setStoreName(dto.getStoreName());
            if (dto.getStoreDescription() != null) user.setStoreDescription(dto.getStoreDescription());
        }

        user = userRepository.save(user);
        return getCurrentProfile(principal);
    }
}
