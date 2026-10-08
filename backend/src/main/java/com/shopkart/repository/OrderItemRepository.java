package com.shopkart.repository;

import com.shopkart.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);

    @Query("SELECT COUNT(item) > 0 FROM OrderItem item WHERE item.order.buyer.id = :buyerId AND item.product.id = :productId AND item.order.orderStatus != com.shopkart.model.OrderStatus.CANCELLED")
    boolean existsByBuyerIdAndProductId(@Param("buyerId") Long buyerId, @Param("productId") Long productId);
}
