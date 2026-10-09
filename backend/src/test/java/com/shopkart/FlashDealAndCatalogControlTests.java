package com.shopkart;

import com.shopkart.dto.ActiveDealsResponseDto;
import com.shopkart.dto.FlashDealCreateRequest;
import com.shopkart.dto.FlashDealDto;
import com.shopkart.dto.ProductDto;
import com.shopkart.model.Product;
import com.shopkart.repository.ProductRepository;
import com.shopkart.service.FlashDealService;
import com.shopkart.service.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class FlashDealAndCatalogControlTests {

    @Autowired
    private FlashDealService flashDealService;

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Test
    @DisplayName("Active Flash Deals: Synchronized UTC server timestamps and positive countdown seconds")
    @Transactional
    void testActiveDealsUtcSynchronization() {
        ActiveDealsResponseDto activeDeals = flashDealService.getActiveDeals();
        assertNotNull(activeDeals);
        assertNotNull(activeDeals.getServerTime(), "serverTime must be non-null UTC timestamp");
        assertNotNull(activeDeals.getEndTime(), "endTime must be non-null UTC timestamp");
        assertTrue(activeDeals.getRemainingSeconds() > 0, "remainingSeconds should be greater than 0");
        assertEquals("ACTIVE", activeDeals.getStatus());
        assertNotNull(activeDeals.getDeals());
        assertFalse(activeDeals.getDeals().isEmpty(), "Active deals list should not be empty");

        FlashDealDto first = activeDeals.getDeals().get(0);
        assertNotNull(first.getProductTitle());
        assertNotNull(first.getDealPrice());
        assertTrue(first.getDealPrice().compareTo(BigDecimal.ZERO) > 0);
        assertFalse(first.isExpired());
    }

    @Test
    @DisplayName("Admin Deal Management: Create, Toggle Active State, and Delete Deal")
    @Transactional
    void testAdminDealLifecycle() {
        List<Product> products = productRepository.findAll();
        assertFalse(products.isEmpty());
        Product p = products.get(0);

        FlashDealCreateRequest req = new FlashDealCreateRequest();
        req.setProductId(p.getId());
        req.setDealPrice(BigDecimal.valueOf(1999.00));
        req.setOriginalPrice(BigDecimal.valueOf(3999.00));
        req.setDiscountPercentage(50);
        req.setStockLimit(25);
        req.setStartTime(Instant.now());
        req.setEndTime(Instant.now().plus(48, ChronoUnit.HOURS));

        FlashDealDto created = flashDealService.createDeal(req);
        assertNotNull(created.getId());
        assertEquals(p.getId(), created.getProductId());
        assertTrue(created.isActive());
        assertEquals(50, created.getDiscountPercentage());

        // Toggle active
        FlashDealDto toggled = flashDealService.toggleDealActive(created.getId());
        assertFalse(toggled.isActive());

        // Delete
        flashDealService.deleteDeal(created.getId());
        assertThrows(Exception.class, () -> flashDealService.toggleDealActive(created.getId()));
    }

    @Test
    @DisplayName("Sitewide Catalog Controls: Update Product Flags (featured, dealOfTheDay, topOffer)")
    @Transactional
    void testCatalogFlagsUpdate() {
        List<Product> products = productRepository.findAll();
        assertFalse(products.isEmpty());
        Product p = products.get(0);

        ProductDto updated = productService.updateProductFlags(p.getId(), true, true, false, "admin@shopkart.com");
        assertTrue(updated.isFeatured());
        assertTrue(updated.isDealOfTheDay());
        assertFalse(updated.isTopOffer());
    }

    @Test
    @DisplayName("Flash Deal Stock Deductions: recordPurchase increments soldCount and triggers expiration at limit")
    @Transactional
    void testDealPurchaseStockDeduction() {
        List<Product> products = productRepository.findAll();
        assertFalse(products.isEmpty());
        Product p = products.get(0);

        FlashDealCreateRequest req = new FlashDealCreateRequest();
        req.setProductId(p.getId());
        req.setDealPrice(BigDecimal.valueOf(1499.00));
        req.setOriginalPrice(BigDecimal.valueOf(2999.00));
        req.setDiscountPercentage(50);
        req.setStockLimit(5);
        req.setStartTime(Instant.now());
        req.setEndTime(Instant.now().plus(24, ChronoUnit.HOURS));

        FlashDealDto deal = flashDealService.createDeal(req);
        assertEquals(0, deal.getSoldCount());
        assertEquals(5, deal.getRemainingStock());
        assertFalse(deal.isExpired());

        // Purchase 3 items
        flashDealService.recordPurchase(p.getId(), 3);
        List<FlashDealDto> all = flashDealService.getAllDeals();
        FlashDealDto updatedDeal = all.stream().filter(d -> d.getId().equals(deal.getId())).findFirst().orElseThrow();
        assertEquals(3, updatedDeal.getSoldCount());
        assertEquals(2, updatedDeal.getRemainingStock());
        assertFalse(updatedDeal.isExpired());

        // Purchase remaining 2 items (hits stock limit = 5)
        flashDealService.recordPurchase(p.getId(), 2);
        List<FlashDealDto> finalDeals = flashDealService.getAllDeals();
        FlashDealDto exhausted = finalDeals.stream().filter(d -> d.getId().equals(deal.getId())).findFirst().orElseThrow();
        assertEquals(5, exhausted.getSoldCount());
        assertEquals(0, exhausted.getRemainingStock());
        assertTrue(exhausted.isExpired(), "Deal must expire when soldCount reaches stockLimit");
    }

    @Test
    @DisplayName("Relational Integrity: Product deletion cleans up associated flash deals without FK error")
    @Transactional
    void testProductDeletionCascadeDeals() {
        List<Product> products = productRepository.findAll();
        assertFalse(products.isEmpty());
        Product p = products.get(0);

        FlashDealCreateRequest req = new FlashDealCreateRequest();
        req.setProductId(p.getId());
        req.setDealPrice(BigDecimal.valueOf(999.00));
        req.setOriginalPrice(BigDecimal.valueOf(1999.00));
        req.setDiscountPercentage(50);
        req.setStockLimit(10);
        req.setStartTime(Instant.now());
        req.setEndTime(Instant.now().plus(12, ChronoUnit.HOURS));

        FlashDealDto deal = flashDealService.createDeal(req);
        assertNotNull(deal.getId());

        // Deleting the product must succeed without DataIntegrityViolationException
        assertDoesNotThrow(() -> {
            productService.deleteProduct(p.getId(), p.getSeller() != null ? p.getSeller().getId() : 1L, true);
        });
    }
}
