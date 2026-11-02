package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.dto.CreateOrderRequest;
import com.shopkart.dto.InvoiceReceiptDTO;
import com.shopkart.dto.OrderDto;
import com.shopkart.dto.SubOrderDto;
import com.shopkart.dto.UpdateOrderStatusRequest;
import com.shopkart.model.Role;
import com.shopkart.security.UserPrincipal;
import com.shopkart.service.AsyncInvoiceGeneratorService;
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

/**
 * REST controller managing order placement, order lifecycle, invoice generation, and seller sub-orders.
 * <p>
 * Supports idempotent checkout requests via {@code Idempotency-Key} or {@code X-Idempotency-Key} HTTP headers,
 * role-based status transitions for sellers and admins, and asynchronous invoice generation.
 * </p>
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final AsyncInvoiceGeneratorService asyncInvoiceGeneratorService;

    public OrderController(OrderService orderService, AsyncInvoiceGeneratorService asyncInvoiceGeneratorService) {
        this.orderService = orderService;
        this.asyncInvoiceGeneratorService = asyncInvoiceGeneratorService;
    }

    /**
     * Places a new order from items currently in the authenticated user's shopping cart.
     * <p>
     * Supports idempotency protection against network retries and duplicate user clicks.
     * Resolves the idempotency key from request headers ({@code Idempotency-Key} or {@code X-Idempotency-Key})
     * or the JSON request body.
     * </p>
     *
     * @param principal authenticated buyer placing the order
     * @param idempotencyKeyHeader optional standard HTTP header for idempotency
     * @param xIdempotencyKeyHeader optional vendor HTTP header for idempotency
     * @param req valid {@link CreateOrderRequest} containing shipping address ID and payment method
     * @return response entity containing created or cached {@link OrderDto}
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderDto>> createOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKeyHeader,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String xIdempotencyKeyHeader,
            @Valid @RequestBody CreateOrderRequest req) {
        String key = (idempotencyKeyHeader != null && !idempotencyKeyHeader.isBlank())
                ? idempotencyKeyHeader.trim()
                : (xIdempotencyKeyHeader != null && !xIdempotencyKeyHeader.isBlank())
                    ? xIdempotencyKeyHeader.trim()
                    : null;
        if (key != null && (req.getIdempotencyKey() == null || req.getIdempotencyKey().isBlank())) {
            req.setIdempotencyKey(key);
        }
        OrderDto order = orderService.createOrder(principal.getId(), req);
        return ResponseEntity.ok(ApiResponse.ok("Order placed successfully", order));
    }

    /**
     * Retrieves all orders placed by the currently authenticated user.
     *
     * @param principal authenticated buyer
     * @return response entity containing list of {@link OrderDto}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderDto>>> getMyOrders(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrdersByUser(principal.getId())));
    }

    /**
     * Retrieves details for a specific order. Enforces ownership authorization unless requester is SELLER or ADMIN.
     *
     * @param id order primary key ID
     * @param principal authenticated user requesting order details
     * @return response entity containing {@link OrderDto}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean hasPrivileges = principal.getRole() == Role.ADMIN || principal.getRole() == Role.SELLER;
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrderById(id, principal.getId(), hasPrivileges)));
    }

    /**
     * Generates or fetches a cached formal invoice receipt for an order.
     *
     * @param id order primary key ID
     * @param principal authenticated user requesting invoice
     * @return response entity containing {@link InvoiceReceiptDTO}
     */
    @GetMapping("/{id}/invoice")
    public ResponseEntity<ApiResponse<InvoiceReceiptDTO>> getOrderInvoice(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean hasPrivileges = principal.getRole() == Role.ADMIN || principal.getRole() == Role.SELLER;
        OrderDto order = orderService.getOrderById(id, principal.getId(), hasPrivileges);
        InvoiceReceiptDTO invoice = asyncInvoiceGeneratorService.getCachedInvoice(order.getId())
                .orElseGet(() -> asyncInvoiceGeneratorService.generateOrderInvoiceAsync(order.getId()).join());
        return ResponseEntity.ok(ApiResponse.success(invoice, "Order invoice retrieved successfully"));
    }

    /**
     * Cancels an existing order if it has not yet reached delivery stages, restoring inventory stock.
     *
     * @param id order primary key ID
     * @param principal authenticated user requesting cancellation
     * @param body optional JSON body with "reason"
     * @return response entity containing updated {@link OrderDto}
     */
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

    /**
     * Updates overall order status according to strict state machine transitions.
     * Accessible to sellers owning products in the order or administrators.
     *
     * @param id order primary key ID
     * @param principal authenticated seller or admin
     * @param req valid {@link UpdateOrderStatusRequest} specifying target status and optional note
     * @return response entity containing updated {@link OrderDto}
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<OrderDto>> updateOrderStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateOrderStatusRequest req) {
        OrderDto updated = orderService.updateOrderStatus(id, req.getStatus(), req.getNote(), principal.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Order status updated", updated));
    }

    /**
     * Administratively lists all orders in the system with pagination.
     * Requires {@code ROLE_ADMIN}.
     *
     * @param page page index (0-based)
     * @param size page size
     * @return response entity containing paged {@link OrderDto} records
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<OrderDto>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getAllOrders(PageRequest.of(page, size))));
    }

    /**
     * Retrieves all parent orders containing items belonging to the authenticated seller.
     * Requires {@code ROLE_SELLER} or {@code ROLE_ADMIN}.
     *
     * @param principal authenticated seller
     * @return response entity containing distinct list of {@link OrderDto}
     */
    @GetMapping("/seller")
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getSellerOrders(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrdersBySeller(principal.getId())));
    }

    /**
     * Retrieves vendor-specific sub-orders associated with a given order.
     *
     * @param id order primary key ID
     * @param principal authenticated user
     * @return response entity containing list of {@link SubOrderDto}
     */
    @GetMapping("/{id}/sub-orders")
    public ResponseEntity<ApiResponse<List<SubOrderDto>>> getOrderSubOrders(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean hasPrivileges = principal.getRole() == Role.ADMIN || principal.getRole() == Role.SELLER;
        return ResponseEntity.ok(ApiResponse.ok(orderService.getSubOrdersByOrderId(id, principal.getId(), hasPrivileges)));
    }

    /**
     * Retrieves sub-orders assigned to the authenticated seller for packaging and dispatch.
     * Requires {@code ROLE_SELLER} or {@code ROLE_ADMIN}.
     *
     * @param principal authenticated seller
     * @return response entity containing list of {@link SubOrderDto}
     */
    @GetMapping("/seller/sub-orders")
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<SubOrderDto>>> getSellerSubOrders(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getSubOrdersBySeller(principal.getId())));
    }

    /**
     * Updates the fulfillment status of a seller's specific sub-order package.
     * Requires {@code ROLE_SELLER} or {@code ROLE_ADMIN}.
     *
     * @param subOrderId sub-order primary key ID
     * @param principal authenticated seller or admin
     * @param req status update request payload
     * @return response entity containing updated {@link SubOrderDto}
     */
    @PutMapping("/sub-orders/{subOrderId}/status")
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<SubOrderDto>> updateSubOrderStatus(
            @PathVariable Long subOrderId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateOrderStatusRequest req) {
        SubOrderDto updated = orderService.updateSubOrderStatus(subOrderId, req.getStatus(), req.getNote(), principal.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Package status updated successfully", updated));
    }
}
