package com.shopkart.repository;

import com.shopkart.model.Order;
import com.shopkart.model.OrderStatus;
import com.shopkart.model.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);

    Optional<Order> findByOrderNumber(String orderNumber);

    Optional<Order> findByIdAndBuyerId(Long id, Long buyerId);

    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items item WHERE item.product.seller.id = :sellerId ORDER BY o.createdAt DESC")
    List<Order> findOrdersBySellerId(@Param("sellerId") Long sellerId);

    long countByOrderStatus(OrderStatus orderStatus);

    @Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM Order o WHERE o.paymentStatus = :paymentStatus")
    BigDecimal sumTotalRevenueByPaymentStatus(@Param("paymentStatus") PaymentStatus paymentStatus);

    @Query("SELECT COALESCE(SUM(item.subtotal), 0) FROM Order o JOIN o.items item WHERE item.product.seller.id = :sellerId AND o.paymentStatus = :paymentStatus")
    BigDecimal sumSellerRevenue(@Param("sellerId") Long sellerId, @Param("paymentStatus") PaymentStatus paymentStatus);
}
