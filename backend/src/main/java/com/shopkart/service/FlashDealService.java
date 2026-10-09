package com.shopkart.service;

import com.shopkart.common.ResourceNotFoundException;
import com.shopkart.dto.ActiveDealsResponseDto;
import com.shopkart.dto.FlashDealCreateRequest;
import com.shopkart.dto.FlashDealDto;
import com.shopkart.model.FlashDeal;
import com.shopkart.model.Product;
import com.shopkart.model.ProductImage;
import com.shopkart.repository.FlashDealRepository;
import com.shopkart.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FlashDealService {

    private final FlashDealRepository flashDealRepository;
    private final ProductRepository productRepository;

    public FlashDealService(FlashDealRepository flashDealRepository, ProductRepository productRepository) {
        this.flashDealRepository = flashDealRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public ActiveDealsResponseDto getActiveDeals() {
        Instant now = Instant.now();
        List<FlashDeal> activeEntities = flashDealRepository.findActiveDeals(now);

        // If no active flash deals exist in table yet, seed default flash deals from dealOfTheDay products
        if (activeEntities.isEmpty()) {
            List<Product> dealProducts = productRepository.findByDealOfTheDayTrue();
            if (!dealProducts.isEmpty()) {
                Instant defaultEnd = now.plus(14, ChronoUnit.HOURS).plus(22, ChronoUnit.MINUTES).plus(45, ChronoUnit.SECONDS);
                List<FlashDealDto> fallbackDtos = new ArrayList<>();
                for (Product p : dealProducts) {
                    FlashDealDto dto = new FlashDealDto();
                    dto.setId(p.getId());
                    dto.setProductId(p.getId());
                    dto.setProductTitle(p.getTitle());
                    dto.setProductBrand(p.getBrand());
                    dto.setCategoryName(p.getCategory() != null ? p.getCategory().getName() : "");
                    dto.setPrimaryImage(getPrimaryImageUrl(p));
                    dto.setDealPrice(p.getPrice());
                    dto.setOriginalPrice(p.getOriginalPrice() != null ? p.getOriginalPrice() : p.getPrice());
                    dto.setDiscountPercentage(p.getDiscountPercentage());
                    dto.setStockLimit(Math.max(p.getStock(), 20));
                    dto.setSoldCount(Math.max(1, p.getRatingCount() / 4));
                    dto.setRemainingStock(p.getStock());
                    dto.setStartTime(now.minus(2, ChronoUnit.HOURS));
                    dto.setEndTime(defaultEnd);
                    dto.setRemainingSeconds(Duration.between(now, defaultEnd).getSeconds());
                    dto.setActive(true);
                    dto.setExpired(false);
                    dto.setRating(p.getRating());
                    fallbackDtos.add(dto);
                }
                long remSecs = Duration.between(now, defaultEnd).getSeconds();
                return new ActiveDealsResponseDto(now, defaultEnd, remSecs, remSecs > 0 ? "ACTIVE" : "EXPIRED", fallbackDtos);
            }
        }

        Instant earliestEnd = activeEntities.stream()
                .map(FlashDeal::getEndTime)
                .min(Instant::compareTo)
                .orElse(now.plus(12, ChronoUnit.HOURS));

        long remainingSec = Math.max(0, Duration.between(now, earliestEnd).getSeconds());
        String status = (remainingSec > 0 && !activeEntities.isEmpty()) ? "ACTIVE" : "EXPIRED";

        List<FlashDealDto> dtos = activeEntities.stream()
                .map(d -> mapToDto(d, now))
                .collect(Collectors.toList());

        return new ActiveDealsResponseDto(now, earliestEnd, remainingSec, status, dtos);
    }

    @Transactional(readOnly = true)
    public List<FlashDealDto> getAllDeals() {
        Instant now = Instant.now();
        return flashDealRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(d -> mapToDto(d, now))
                .collect(Collectors.toList());
    }

    @Transactional
    public FlashDealDto createDeal(FlashDealCreateRequest req) {
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + req.getProductId()));

        Instant now = Instant.now();
        Instant start = req.getStartTime() != null ? req.getStartTime() : now;
        Instant end = req.getEndTime() != null ? req.getEndTime() : now.plus(24, ChronoUnit.HOURS);

        BigDecimal orig = req.getOriginalPrice() != null ? req.getOriginalPrice() : product.getOriginalPrice();
        if (orig == null) orig = product.getPrice();

        int discount = req.getDiscountPercentage();
        if (discount <= 0 && orig.compareTo(BigDecimal.ZERO) > 0 && orig.compareTo(req.getDealPrice()) > 0) {
            discount = orig.subtract(req.getDealPrice())
                    .divide(orig, 2, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .intValue();
        }

        FlashDeal deal = new FlashDeal(
                product,
                req.getDealPrice(),
                orig,
                discount,
                start,
                end,
                req.getStockLimit() > 0 ? req.getStockLimit() : 50
        );

        // Mark product as dealOfTheDay as well
        product.setDealOfTheDay(true);
        productRepository.save(product);

        FlashDeal saved = flashDealRepository.save(deal);
        return mapToDto(saved, now);
    }

    @Transactional
    public FlashDealDto toggleDealActive(Long id) {
        FlashDeal deal = flashDealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal not found with id: " + id));
        deal.setActive(!deal.isActive());
        FlashDeal saved = flashDealRepository.save(deal);
        return mapToDto(saved, Instant.now());
    }

    @Transactional
    public void deleteDeal(Long id) {
        FlashDeal deal = flashDealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal not found with id: " + id));
        flashDealRepository.delete(deal);
    }

    private FlashDealDto mapToDto(FlashDeal deal, Instant now) {
        FlashDealDto dto = new FlashDealDto();
        dto.setId(deal.getId());
        dto.setProductId(deal.getProduct().getId());
        dto.setProductTitle(deal.getProduct().getTitle());
        dto.setProductBrand(deal.getProduct().getBrand());
        dto.setCategoryName(deal.getProduct().getCategory() != null ? deal.getProduct().getCategory().getName() : "");
        dto.setPrimaryImage(getPrimaryImageUrl(deal.getProduct()));
        dto.setDealPrice(deal.getDealPrice());
        dto.setOriginalPrice(deal.getOriginalPrice());
        dto.setDiscountPercentage(deal.getDiscountPercentage());
        dto.setStockLimit(deal.getStockLimit());
        dto.setSoldCount(deal.getSoldCount());
        dto.setRemainingStock(Math.max(0, deal.getStockLimit() - deal.getSoldCount()));
        dto.setStartTime(deal.getStartTime());
        dto.setEndTime(deal.getEndTime());
        dto.setActive(deal.isActive());
        dto.setRating(deal.getProduct().getRating());

        long remainingSec = Duration.between(now, deal.getEndTime()).getSeconds();
        dto.setRemainingSeconds(Math.max(0, remainingSec));
        dto.setExpired(!deal.isActive() || remainingSec <= 0 || dto.getRemainingStock() <= 0);

        return dto;
    }

    private String getPrimaryImageUrl(Product product) {
        if (product.getImages() == null || product.getImages().isEmpty()) {
            return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80";
        }
        return product.getImages().stream()
                .filter(ProductImage::isPrimary)
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(product.getImages().get(0).getImageUrl());
    }
}
