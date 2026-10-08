package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.dto.CreateOrderRequest;
import com.shopkart.dto.OrderDto;
import com.shopkart.dto.UpdateOrderStatusRequest;
import com.shopkart.model.Role;
import com.shopkart.security.UserPrincipal;
import com.shopkart.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderDto>> createOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateOrderRequest req) {
        OrderDto order = orderService.createOrder(principal.getId(), req);
        return ResponseEntity.ok(ApiResponse.ok("Order placed successfully", order));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderDto>>> getMyOrders(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrdersByUser(principal.getId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean hasPrivileges = principal.getRole() == Role.ADMIN || principal.getRole() == Role.SELLER;
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrderById(id, principal.getId(), hasPrivileges)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderDto>> cancelOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) Map<String, String> body) {
        boolean isAdmin = principal.getRole() == Role.ADMIN;
        String reason = (body != null && body.containsKey("reason")) ? body.get("reason") : "Customer cancelled";
        OrderDto cancelled = orderService.cancelOrder(id, principal.getId(), reason, isAdmin);
        return ResponseEntity.ok(ApiResponse.ok("Order cancelled successfully", cancelled));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<OrderDto>> updateOrderStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateOrderStatusRequest req) {
        OrderDto updated = orderService.updateOrderStatus(id, req.getStatus(), req.getNote(), principal.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Order status updated", updated));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<OrderDto>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getAllOrders(PageRequest.of(page, size))));
    }

    @GetMapping("/seller")
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getSellerOrders(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrdersBySeller(principal.getId())));
    }
}
