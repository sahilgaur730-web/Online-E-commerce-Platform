package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.model.Notification;
import com.shopkart.security.UserPrincipal;
import com.shopkart.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller managing real-time and asynchronous user notifications.
 * <p>
 * Provides authenticated endpoints for users to retrieve alert messages, unread badge counts,
 * and mark individual or all notifications as read.
 * </p>
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Retrieves all notifications for the authenticated user ordered by creation timestamp.
     *
     * @param principal authenticated user principal
     * @return response entity containing a list of {@link Notification} entities
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUserNotifications(principal.getId())));
    }

    /**
     * Retrieves the count of unread notifications for display on user interface badge icons.
     *
     * @param principal authenticated user principal
     * @return response entity containing map with "unreadCount" key
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationService.getUnreadCount(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("unreadCount", count)));
    }

    /**
     * Marks a specific notification as read for the authenticated user.
     *
     * @param id notification primary key ID
     * @param principal authenticated user principal
     * @return response entity with confirmation message
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAsRead(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read", null));
    }

    /**
     * Marks all unread notifications as read for the authenticated user.
     *
     * @param principal authenticated user principal
     * @return response entity with confirmation message
     */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", null));
    }
}
