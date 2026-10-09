package com.shopkart.repository;

import com.shopkart.model.FlashDeal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface FlashDealRepository extends JpaRepository<FlashDeal, Long> {

    @Query("SELECT fd FROM FlashDeal fd WHERE fd.active = true AND fd.startTime <= :now AND fd.endTime > :now ORDER BY fd.endTime ASC")
    List<FlashDeal> findActiveDeals(@Param("now") Instant now);

    List<FlashDeal> findAllByOrderByCreatedAtDesc();

    boolean existsByProductIdAndActiveTrueAndEndTimeAfter(Long productId, Instant now);
}
