package com.shopkart.service;

import com.shopkart.common.ResourceNotFoundException;
import com.shopkart.dto.UserProfileDto;
import com.shopkart.model.Role;
import com.shopkart.model.User;
import com.shopkart.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AuditService auditService;

    public UserService(UserRepository userRepository, AuditService auditService) {
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public List<UserProfileDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserProfileDto updateUserRole(Long userId, Role newRole, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        Role oldRole = user.getRole();
        user.setRole(newRole);
        user = userRepository.save(user);

        auditService.log("USER_ROLE_CHANGED", adminEmail, "Changed role of " + user.getEmail() + " from " + oldRole + " to " + newRole, "USER", user.getId());
        return toDto(user);
    }

    @Transactional
    public UserProfileDto toggleUserActive(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setActive(!user.isActive());
        user = userRepository.save(user);

        auditService.log("USER_STATUS_TOGGLED", adminEmail, "Changed active status of " + user.getEmail() + " to " + user.isActive(), "USER", user.getId());
        return toDto(user);
    }

    private UserProfileDto toDto(User u) {
        return new UserProfileDto(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getPhone(),
                u.getRole(),
                u.getStoreName(),
                u.getStoreDescription(),
                u.isActive(),
                u.getCreatedAt()
        );
    }
}
