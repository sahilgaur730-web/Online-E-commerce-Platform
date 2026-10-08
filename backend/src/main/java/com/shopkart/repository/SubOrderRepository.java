package com.shopkart.repository;

import com.shopkart.model.SubOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubOrderRepository extends JpaRepository<SubOrder, Long> {

    List<SubOrder> findByOrderIdOrderByCreatedAtAsc(Long orderId);

    List<SubOrder> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    Optional<SubOrder> findByIdAndSellerId(Long id, Long sellerId);

    Optional<SubOrder> findBySubOrderNumber(String subOrderNumber);
}
