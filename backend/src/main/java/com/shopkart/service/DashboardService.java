package com.shopkart.service;

import com.shopkart.dto.DashboardStatsDto;
import com.shopkart.dto.OrderDto;
import com.shopkart.model.OrderStatus;
import com.shopkart.model.PaymentStatus;
import com.shopkart.model.Product;
import com.shopkart.model.Role;
import com.shopkart.repository.CategoryRepository;
import com.shopkart.repository.OrderRepository;
import com.shopkart.repository.ProductRepository;
import com.shopkart.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final CategoryRepository categoryRepository;
    private final OrderService orderService;

    public DashboardService(
            UserRepository userRepository,
            ProductRepository productRepository,
            OrderRepository orderRepository,
            CategoryRepository categoryRepository,
            OrderService orderService) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.categoryRepository = categoryRepository;
        this.orderService = orderService;
    }

    public DashboardStatsDto getAdminDashboard() {
        DashboardStatsDto dto = new DashboardStatsDto();
        dto.setTotalUsers(userRepository.count());
        dto.setTotalSellers(userRepository.countByRole(Role.SELLER));
        dto.setTotalProducts(productRepository.count());
        dto.setTotalOrders(orderRepository.count());

        BigDecimal revenue = orderRepository.sumTotalRevenueByPaymentStatus(PaymentStatus.PAID);
        dto.setTotalRevenue(revenue != null ? revenue : BigDecimal.ZERO);

        dto.setPendingOrders(orderRepository.countByOrderStatus(OrderStatus.PLACED) + orderRepository.countByOrderStatus(OrderStatus.CONFIRMED));
        dto.setDeliveredOrders(orderRepository.countByOrderStatus(OrderStatus.DELIVERED));
        dto.setLowStockCount(productRepository.countByStockLessThan(10));

        List<OrderDto> recent = orderRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 10))
                .getContent().stream()
                .map(orderService::toDto)
                .collect(Collectors.toList());
        dto.setRecentOrders(recent);

        Map<String, Long> categoryCount = new HashMap<>();
        categoryRepository.findAll().forEach(cat -> {
            long count = productRepository.findByCategoryId(cat.getId()).size();
            categoryCount.put(cat.getName(), count);
        });
        dto.setCategoryProductCount(categoryCount);

        return dto;
    }

    public DashboardStatsDto getSellerDashboard(Long sellerId) {
        DashboardStatsDto dto = new DashboardStatsDto();
        List<Product> products = productRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
        dto.setTotalProducts(products.size());

        List<OrderDto> sellerOrders = orderService.getOrdersBySeller(sellerId);
        dto.setTotalOrders(sellerOrders.size());

        BigDecimal sellerRev = orderRepository.sumSellerRevenue(sellerId, PaymentStatus.PAID);
        dto.setTotalRevenue(sellerRev != null ? sellerRev : BigDecimal.ZERO);

        long lowStock = products.stream().filter(p -> p.getStock() < 10).count();
        dto.setLowStockCount(lowStock);

        long pending = sellerOrders.stream()
                .filter(o -> o.getOrderStatus() == OrderStatus.PLACED || o.getOrderStatus() == OrderStatus.CONFIRMED)
                .count();
        dto.setPendingOrders(pending);

        long delivered = sellerOrders.stream()
                .filter(o -> o.getOrderStatus() == OrderStatus.DELIVERED)
                .count();
        dto.setDeliveredOrders(delivered);

        dto.setRecentOrders(sellerOrders.stream().limit(10).collect(Collectors.toList()));

        return dto;
    }
}
