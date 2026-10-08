package com.shopkart.service;

import com.shopkart.common.BadRequestException;
import com.shopkart.common.ResourceNotFoundException;
import com.shopkart.dto.*;
import com.shopkart.model.*;
import com.shopkart.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderTrackingRepository orderTrackingRepository;
    private final SubOrderRepository subOrderRepository;
    private final CartItemRepository cartItemRepository;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            OrderTrackingRepository orderTrackingRepository,
            SubOrderRepository subOrderRepository,
            CartItemRepository cartItemRepository,
            AddressRepository addressRepository,
            UserRepository userRepository,
            InventoryService inventoryService,
            NotificationService notificationService,
            AuditService auditService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderTrackingRepository = orderTrackingRepository;
        this.subOrderRepository = subOrderRepository;
        this.cartItemRepository = cartItemRepository;
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.inventoryService = inventoryService;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public OrderDto createOrder(Long userId, CreateOrderRequest req) {
        User buyer = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<CartItem> cartItems = cartItemRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Your cart is empty. Add products before placing an order.");
        }

        Address address = addressRepository.findByIdAndUserId(req.getAddressId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipping address not found"));

        // Deduct inventory atomically with optimistic locking check
        for (CartItem cartItem : cartItems) {
            inventoryService.deductStock(cartItem.getProduct().getId(), cartItem.getQuantity());
        }

        BigDecimal originalTotal = BigDecimal.ZERO;
        BigDecimal finalSubtotal = BigDecimal.ZERO;

        for (CartItem item : cartItems) {
            Product p = item.getProduct();
            BigDecimal origPrice = (p.getOriginalPrice() != null) ? p.getOriginalPrice() : p.getPrice();
            originalTotal = originalTotal.add(origPrice.multiply(BigDecimal.valueOf(item.getQuantity())));
            finalSubtotal = finalSubtotal.add(p.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        BigDecimal discountTotal = originalTotal.subtract(finalSubtotal);
        if (discountTotal.compareTo(BigDecimal.ZERO) < 0) discountTotal = BigDecimal.ZERO;

        BigDecimal deliveryFee = BigDecimal.ZERO;
        if (finalSubtotal.compareTo(BigDecimal.valueOf(500)) < 0) {
            deliveryFee = BigDecimal.valueOf(40);
        }

        BigDecimal finalTotal = finalSubtotal.add(deliveryFee);

        String orderNumber = "OD" + System.currentTimeMillis() + (int)(Math.random() * 900 + 100);
        String trackingNumber = "SK" + (100000000L + (long)(Math.random() * 900000000L));

        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setBuyer(buyer);
        order.setTotalAmount(originalTotal);
        order.setDiscountAmount(discountTotal);
        order.setDeliveryFee(deliveryFee);
        order.setFinalAmount(finalTotal);
        order.setPaymentMethod(req.getPaymentMethod().toUpperCase());
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setOrderStatus(OrderStatus.PLACED);
        order.setTrackingNumber(trackingNumber);

        String addressSnapshot = String.format("%s, Phone: %s, %s, %s, %s - %s (%s)",
                address.getFullName(),
                address.getPhone(),
                address.getStreetAddress(),
                address.getCity(),
                address.getState(),
                address.getPincode(),
                address.getAddressType());
        order.setShippingAddressSnapshot(addressSnapshot);

        Order savedOrder = orderRepository.save(order);

        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cartItems) {
            Product p = cartItem.getProduct();
            String img = (p.getImages() != null && !p.getImages().isEmpty())
                    ? p.getImages().get(0).getImageUrl()
                    : "";
            BigDecimal sub = p.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));

            OrderItem orderItem = new OrderItem(
                    savedOrder,
                    p,
                    p.getTitle(),
                    img,
                    p.getPrice(),
                    cartItem.getQuantity(),
                    sub
            );
            orderItems.add(orderItem);
        }
        orderItemRepository.saveAll(orderItems);
        savedOrder.setItems(orderItems);

        // Multi-Seller Sub-Orders / Package Splitting
        Map<Long, List<OrderItem>> itemsBySellerId = new LinkedHashMap<>();
        for (OrderItem item : orderItems) {
            Long sellerId = (item.getProduct() != null && item.getProduct().getSeller() != null)
                    ? item.getProduct().getSeller().getId()
                    : null;
            itemsBySellerId.computeIfAbsent(sellerId, k -> new ArrayList<>()).add(item);
        }

        List<SubOrder> subOrders = new ArrayList<>();
        int pkgIndex = 1;
        for (Map.Entry<Long, List<OrderItem>> entry : itemsBySellerId.entrySet()) {
            Long sId = entry.getKey();
            List<OrderItem> sItems = entry.getValue();
            User seller = null;
            if (sId != null) {
                seller = userRepository.findById(sId).orElse(null);
            }
            if (seller == null && !sItems.isEmpty() && sItems.get(0).getProduct() != null) {
                seller = sItems.get(0).getProduct().getSeller();
            }
            if (seller == null) {
                seller = buyer; // fallback safe
            }

            BigDecimal sSubtotal = sItems.stream()
                    .map(OrderItem::getSubtotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            String subOrderNum = orderNumber + "-PKG" + pkgIndex;
            String pkgTrackingNum = "PKG" + (10000000L + (long)(Math.random() * 90000000L));

            SubOrder subOrder = new SubOrder(savedOrder, seller, subOrderNum, sSubtotal, pkgTrackingNum);
            SubOrder savedSubOrder = subOrderRepository.save(subOrder);

            for (OrderItem item : sItems) {
                item.setSubOrder(savedSubOrder);
            }
            orderItemRepository.saveAll(sItems);
            savedSubOrder.setItems(sItems);
            subOrders.add(savedSubOrder);
            pkgIndex++;
        }
        savedOrder.setSubOrders(subOrders);

        // Tracking event: Placed
        OrderTracking tracking = new OrderTracking(
                savedOrder,
                OrderStatus.PLACED,
                "Order Placed",
                "Your order " + orderNumber + " with " + subOrders.size() + " package(s) has been successfully placed on ShopKart."
        );
        orderTrackingRepository.save(tracking);

        // Clear cart
        cartItemRepository.deleteByUserId(userId);

        // Notifications & Audit
        notificationService.notifyUser(
                buyer,
                "Order Placed Successfully",
                "Your order " + orderNumber + " for ₹" + finalTotal + " has been placed.",
                "ORDER"
        );
        auditService.log("ORDER_PLACED", buyer.getEmail(), "Placed order " + orderNumber + " total ₹" + finalTotal, "ORDER", savedOrder.getId());

        return toDto(savedOrder);
    }

    public List<OrderDto> getOrdersByUser(Long userId) {
        return orderRepository.findByBuyerIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public OrderDto getOrderById(Long orderId, Long userId, boolean hasPrivileges) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (!hasPrivileges && !order.getBuyer().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to this order");
        }

        return toDto(order);
    }

    public List<OrderDto> getOrdersBySeller(Long sellerId) {
        return orderRepository.findOrdersBySellerId(sellerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<SubOrderDto> getSubOrdersBySeller(Long sellerId) {
        return subOrderRepository.findBySellerIdOrderByCreatedAtDesc(sellerId).stream()
                .map(this::toSubOrderDto)
                .collect(Collectors.toList());
    }

    public List<SubOrderDto> getSubOrdersByOrderId(Long orderId, Long userId, boolean hasPrivileges) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (!hasPrivileges && !order.getBuyer().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to sub-orders");
        }

        return subOrderRepository.findByOrderIdOrderByCreatedAtAsc(orderId).stream()
                .map(this::toSubOrderDto)
                .collect(Collectors.toList());
    }

    public Page<OrderDto> getAllOrders(Pageable pageable) {
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toDto);
    }

    @Transactional
    public OrderDto updateOrderStatus(Long orderId, OrderStatus newStatus, String note, String updaterEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        User updater = userRepository.findByEmail(updaterEmail)
                .orElseThrow(() -> new BadRequestException("Updater user not found: " + updaterEmail));

        List<SubOrder> subOrders = subOrderRepository.findByOrderIdOrderByCreatedAtAsc(orderId);

        if (updater.getRole() != Role.ADMIN) {
            if (updater.getRole() == Role.SELLER) {
                boolean ownsItem = order.getItems() != null && order.getItems().stream().anyMatch(item ->
                        item.getProduct() != null && item.getProduct().getSeller() != null &&
                        item.getProduct().getSeller().getId().equals(updater.getId())
                );
                if (!ownsItem) {
                    throw new BadRequestException("Seller does not own any products in this order");
                }
            } else {
                throw new BadRequestException("Unauthorized to update order status");
            }
        }

        OrderStatus currentStatus = order.getOrderStatus();
        if (currentStatus == OrderStatus.DELIVERED) {
            throw new BadRequestException("Order is already DELIVERED and cannot change status");
        }
        if (currentStatus == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order is CANCELLED and cannot change status");
        }

        if (newStatus == OrderStatus.PLACED) {
            throw new BadRequestException("Cannot rewind order status back to PLACED");
        }

        if (newStatus == OrderStatus.CANCELLED) {
            if (currentStatus == OrderStatus.SHIPPED || currentStatus == OrderStatus.OUT_FOR_DELIVERY) {
                throw new BadRequestException("Order cannot be cancelled once shipped or out for delivery");
            }
        }

        // Validate state machine progression
        if (newStatus == OrderStatus.CONFIRMED && currentStatus != OrderStatus.PLACED) {
            throw new BadRequestException("Only PLACED orders can be CONFIRMED");
        }
        if (newStatus == OrderStatus.SHIPPED && currentStatus != OrderStatus.CONFIRMED) {
            throw new BadRequestException("Order must be CONFIRMED before shipping");
        }
        if (newStatus == OrderStatus.OUT_FOR_DELIVERY && currentStatus != OrderStatus.SHIPPED) {
            throw new BadRequestException("Order must be SHIPPED before out for delivery");
        }
        if (newStatus == OrderStatus.DELIVERED && currentStatus != OrderStatus.OUT_FOR_DELIVERY) {
            throw new BadRequestException("Order must be OUT_FOR_DELIVERY before delivered");
        }

        if (newStatus == OrderStatus.CANCELLED) {
            // Restore inventory
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() != null) {
                    inventoryService.restoreStock(item.getProduct().getId(), item.getQuantity());
                }
            }
            if (order.getPaymentStatus() == PaymentStatus.PAID) {
                order.setPaymentStatus(PaymentStatus.REFUNDED);
            }
            order.setCancellationReason(note != null ? note : "Cancelled by admin/seller");
        }

        order.setOrderStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());
        if (newStatus == OrderStatus.DELIVERED && "COD".equalsIgnoreCase(order.getPaymentMethod())) {
            order.setPaymentStatus(PaymentStatus.PAID);
        }
        Order saved = orderRepository.save(order);

        // Synchronize matching sub-orders
        for (SubOrder so : subOrders) {
            if (updater.getRole() == Role.ADMIN || (so.getSeller() != null && so.getSeller().getId().equals(updater.getId()))) {
                so.setStatus(newStatus);
                if (newStatus == OrderStatus.CANCELLED) {
                    so.setCancellationReason(note != null && !note.isBlank() ? note : "Cancelled by admin/seller");
                }
                so.setUpdatedAt(LocalDateTime.now());
            }
        }
        if (!subOrders.isEmpty()) {
            subOrderRepository.saveAll(subOrders);
        }

        // Add tracking milestone
        String title = formatStatusTitle(newStatus);
        String desc = (note != null && !note.isBlank()) ? note : "Order status updated to " + title;
        OrderTracking tracking = new OrderTracking(saved, newStatus, title, desc);
        orderTrackingRepository.save(tracking);

        notificationService.notifyUser(
                order.getBuyer(),
                "Order Update: " + title,
                "Your order " + order.getOrderNumber() + " is now " + title + ".",
                "ORDER"
        );
        auditService.log("ORDER_STATUS_CHANGED", updaterEmail,
                "Changed order " + order.getOrderNumber() + " from " + currentStatus + " to " + newStatus,
                "ORDER", saved.getId());

        return toDto(saved);
    }

    @Transactional
    public SubOrderDto updateSubOrderStatus(Long subOrderId, OrderStatus newStatus, String note, String updaterEmail) {
        SubOrder subOrder = subOrderRepository.findById(subOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Package / Sub-order not found: " + subOrderId));

        User updater = userRepository.findByEmail(updaterEmail)
                .orElseThrow(() -> new BadRequestException("Updater user not found: " + updaterEmail));

        boolean isAdmin = updater.getRole() == Role.ADMIN;
        boolean isOwnerSeller = subOrder.getSeller() != null && subOrder.getSeller().getId().equals(updater.getId());

        if (!isAdmin && !isOwnerSeller) {
            throw new BadRequestException("You do not have permission to manage this package");
        }

        OrderStatus currentStatus = subOrder.getStatus();
        if (currentStatus == OrderStatus.DELIVERED) {
            throw new BadRequestException("Package is already DELIVERED and cannot change status");
        }
        if (currentStatus == OrderStatus.CANCELLED) {
            throw new BadRequestException("Package is CANCELLED and cannot change status");
        }

        if (newStatus == OrderStatus.PLACED) {
            throw new BadRequestException("Cannot rewind package status to PLACED");
        }

        if (newStatus == OrderStatus.CANCELLED) {
            if (currentStatus == OrderStatus.SHIPPED || currentStatus == OrderStatus.OUT_FOR_DELIVERY) {
                throw new BadRequestException("Package cannot be cancelled once shipped or out for delivery");
            }
            // Restore inventory for package items
            if (subOrder.getItems() != null) {
                for (OrderItem item : subOrder.getItems()) {
                    if (item.getProduct() != null) {
                        inventoryService.restoreStock(item.getProduct().getId(), item.getQuantity());
                    }
                }
            }
            subOrder.setCancellationReason(note != null && !note.isBlank() ? note : "Cancelled by seller/admin");
        }

        // Validate state transitions
        if (newStatus == OrderStatus.CONFIRMED && currentStatus != OrderStatus.PLACED) {
            throw new BadRequestException("Only PLACED packages can be CONFIRMED");
        }
        if (newStatus == OrderStatus.SHIPPED && currentStatus != OrderStatus.CONFIRMED) {
            throw new BadRequestException("Package must be CONFIRMED before shipping");
        }
        if (newStatus == OrderStatus.OUT_FOR_DELIVERY && currentStatus != OrderStatus.SHIPPED) {
            throw new BadRequestException("Package must be SHIPPED before out for delivery");
        }
        if (newStatus == OrderStatus.DELIVERED && currentStatus != OrderStatus.OUT_FOR_DELIVERY) {
            throw new BadRequestException("Package must be OUT_FOR_DELIVERY before delivered");
        }

        subOrder.setStatus(newStatus);
        subOrder.setUpdatedAt(LocalDateTime.now());
        SubOrder savedSubOrder = subOrderRepository.save(subOrder);

        // Update tracking on master order
        Order order = subOrder.getOrder();
        String sellerName = (subOrder.getSeller() != null && subOrder.getSeller().getStoreName() != null)
                ? subOrder.getSeller().getStoreName()
                : (subOrder.getSeller() != null ? subOrder.getSeller().getName() : "Seller");
        String trackingTitle = "Package " + subOrder.getSubOrderNumber() + " " + formatStatusTitle(newStatus);
        String trackingDesc = (note != null && !note.isBlank())
                ? note
                : "Package from " + sellerName + " is now " + formatStatusTitle(newStatus);

        OrderTracking tracking = new OrderTracking(order, newStatus, trackingTitle, trackingDesc);
        orderTrackingRepository.save(tracking);

        // Recalculate Master Order Status based on all vendor packages
        List<SubOrder> allPackages = subOrderRepository.findByOrderIdOrderByCreatedAtAsc(order.getId());
        List<SubOrder> activePackages = allPackages.stream()
                .filter(p -> p.getStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.toList());

        if (activePackages.isEmpty()) {
            // All packages have been cancelled
            order.setOrderStatus(OrderStatus.CANCELLED);
            order.setCancellationReason("All packages in this order were cancelled");
            if (order.getPaymentStatus() == PaymentStatus.PAID) {
                order.setPaymentStatus(PaymentStatus.REFUNDED);
            }
        } else {
            boolean allDelivered = activePackages.stream().allMatch(p -> p.getStatus() == OrderStatus.DELIVERED);
            boolean allOutOrDelivered = activePackages.stream().allMatch(p -> p.getStatus() == OrderStatus.OUT_FOR_DELIVERY || p.getStatus() == OrderStatus.DELIVERED);
            boolean anyShippedOrOut = activePackages.stream().anyMatch(p -> p.getStatus() == OrderStatus.SHIPPED || p.getStatus() == OrderStatus.OUT_FOR_DELIVERY || p.getStatus() == OrderStatus.DELIVERED);
            boolean allConfirmedOrHigher = activePackages.stream().allMatch(p -> p.getStatus() != OrderStatus.PLACED);

            if (allDelivered) {
                order.setOrderStatus(OrderStatus.DELIVERED);
                if ("COD".equalsIgnoreCase(order.getPaymentMethod())) {
                    order.setPaymentStatus(PaymentStatus.PAID);
                }
            } else if (allOutOrDelivered) {
                order.setOrderStatus(OrderStatus.OUT_FOR_DELIVERY);
            } else if (anyShippedOrOut) {
                order.setOrderStatus(OrderStatus.SHIPPED);
            } else if (allConfirmedOrHigher) {
                order.setOrderStatus(OrderStatus.CONFIRMED);
            } else {
                order.setOrderStatus(OrderStatus.PLACED);
            }
        }
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        auditService.log("PACKAGE_STATUS_UPDATED", updaterEmail,
                "Updated package " + subOrder.getSubOrderNumber() + " to " + newStatus,
                "SUB_ORDER", savedSubOrder.getId());

        return toSubOrderDto(savedSubOrder);
    }

    @Transactional
    public OrderDto cancelOrder(Long orderId, Long userId, String reason, boolean isAdmin) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (!isAdmin && !order.getBuyer().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized to cancel this order");
        }

        if (order.getOrderStatus() == OrderStatus.SHIPPED ||
            order.getOrderStatus() == OrderStatus.OUT_FOR_DELIVERY ||
            order.getOrderStatus() == OrderStatus.DELIVERED) {
            throw new BadRequestException("Order cannot be cancelled once shipped. You may initiate a return after delivery.");
        }

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order is already cancelled");
        }

        // Restore inventory
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                inventoryService.restoreStock(item.getProduct().getId(), item.getQuantity());
            }
        }

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            order.setPaymentStatus(PaymentStatus.REFUNDED);
        }
        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(reason != null ? reason : "Cancelled by customer");
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        // Cancel all sub-orders
        List<SubOrder> subOrders = subOrderRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
        for (SubOrder so : subOrders) {
            so.setStatus(OrderStatus.CANCELLED);
            so.setCancellationReason(reason != null ? reason : "Order cancelled by customer");
            so.setUpdatedAt(LocalDateTime.now());
        }
        subOrderRepository.saveAll(subOrders);

        OrderTracking tracking = new OrderTracking(
                saved,
                OrderStatus.CANCELLED,
                "Order Cancelled",
                order.getCancellationReason()
        );
        orderTrackingRepository.save(tracking);

        notificationService.notifyUser(
                order.getBuyer(),
                "Order Cancelled",
                "Your order " + order.getOrderNumber() + " has been cancelled.",
                "ORDER"
        );
        auditService.log("ORDER_CANCELLED", order.getBuyer().getEmail(),
                "Cancelled order " + order.getOrderNumber() + ". Reason: " + order.getCancellationReason(),
                "ORDER", saved.getId());

        return toDto(saved);
    }

    private String formatStatusTitle(OrderStatus status) {
        switch (status) {
            case PLACED: return "Order Placed";
            case CONFIRMED: return "Order Confirmed";
            case SHIPPED: return "Shipped";
            case OUT_FOR_DELIVERY: return "Out for Delivery";
            case DELIVERED: return "Delivered";
            case CANCELLED: return "Cancelled";
            default: return status.name();
        }
    }

    public SubOrderDto toSubOrderDto(SubOrder s) {
        SubOrderDto dto = new SubOrderDto();
        dto.setId(s.getId());
        dto.setSubOrderNumber(s.getSubOrderNumber());
        dto.setOrderId(s.getOrder() != null ? s.getOrder().getId() : null);
        dto.setOrderNumber(s.getOrder() != null ? s.getOrder().getOrderNumber() : null);
        if (s.getSeller() != null) {
            dto.setSellerId(s.getSeller().getId());
            dto.setSellerName(s.getSeller().getName());
            dto.setStoreName(s.getSeller().getStoreName() != null ? s.getSeller().getStoreName() : s.getSeller().getName());
        }
        dto.setStatus(s.getStatus());
        dto.setSubtotal(s.getSubtotal());
        dto.setShippingFee(s.getShippingFee());
        dto.setTrackingNumber(s.getTrackingNumber());
        dto.setCarrier(s.getCarrier());
        dto.setCancellationReason(s.getCancellationReason());
        dto.setCreatedAt(s.getCreatedAt());
        dto.setUpdatedAt(s.getUpdatedAt());

        if (s.getItems() != null) {
            dto.setItems(s.getItems().stream().map(this::toOrderItemDto).collect(Collectors.toList()));
        }
        return dto;
    }

    public OrderItemDto toOrderItemDto(OrderItem i) {
        OrderItemDto itemDto = new OrderItemDto(
                i.getId(),
                i.getProduct() != null ? i.getProduct().getId() : null,
                i.getProductName(),
                i.getProductImageUrl(),
                i.getPrice(),
                i.getQuantity(),
                i.getSubtotal()
        );
        if (i.getProduct() != null && i.getProduct().getSeller() != null) {
            itemDto.setSellerId(i.getProduct().getSeller().getId());
            itemDto.setSellerName(i.getProduct().getSeller().getStoreName() != null
                    ? i.getProduct().getSeller().getStoreName()
                    : i.getProduct().getSeller().getName());
        }
        return itemDto;
    }

    public OrderDto toDto(Order o) {
        OrderDto dto = new OrderDto();
        dto.setId(o.getId());
        dto.setOrderNumber(o.getOrderNumber());
        if (o.getBuyer() != null) {
            dto.setBuyerId(o.getBuyer().getId());
            dto.setBuyerName(o.getBuyer().getName());
            dto.setBuyerEmail(o.getBuyer().getEmail());
        }
        dto.setTotalAmount(o.getTotalAmount());
        dto.setDiscountAmount(o.getDiscountAmount());
        dto.setDeliveryFee(o.getDeliveryFee());
        dto.setFinalAmount(o.getFinalAmount());
        dto.setPaymentMethod(o.getPaymentMethod());
        dto.setPaymentStatus(o.getPaymentStatus());
        dto.setPaymentTransactionId(o.getPaymentTransactionId());
        dto.setOrderStatus(o.getOrderStatus());
        dto.setShippingAddressSnapshot(o.getShippingAddressSnapshot());
        dto.setTrackingNumber(o.getTrackingNumber());
        dto.setCancellationReason(o.getCancellationReason());
        dto.setCreatedAt(o.getCreatedAt());

        if (o.getItems() != null) {
            dto.setItems(o.getItems().stream().map(this::toOrderItemDto).collect(Collectors.toList()));
        }

        List<SubOrder> subOrders = subOrderRepository.findByOrderIdOrderByCreatedAtAsc(o.getId());
        dto.setSubOrders(subOrders.stream().map(this::toSubOrderDto).collect(Collectors.toList()));

        List<OrderTracking> trackings = orderTrackingRepository.findByOrderIdOrderByTimestampAsc(o.getId());
        dto.setTrackingEvents(trackings.stream().map(t -> new OrderTrackingDto(
                t.getId(),
                t.getStatus(),
                t.getTitle(),
                t.getDescription(),
                t.getTimestamp()
        )).collect(Collectors.toList()));

        return dto;
    }
}
