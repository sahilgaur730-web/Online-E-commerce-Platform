package com.shopkart;

import com.shopkart.dto.ApiResponse;
import com.shopkart.dto.InvoiceReceiptDTO;
import com.shopkart.model.*;
import com.shopkart.repository.*;
import com.shopkart.service.AsyncInvoiceGeneratorService;
import com.shopkart.util.GenericCache;
import com.shopkart.util.PaginatedResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class ConcurrencyAndGenericsTests {

    @Autowired
    private AsyncInvoiceGeneratorService asyncInvoiceGeneratorService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Test
    @DisplayName("Verify @Async CompletableFuture invoice generation runs in dedicated ShopKart-Async- thread")
    void testAsyncInvoiceWorkerExecution() throws Exception {
        User buyer = userRepository.findByEmail("buyer@shopkart.com").orElse(null);
        assertNotNull(buyer);

        Order order = new Order();
        order.setOrderNumber("OD-ASYNC-" + System.currentTimeMillis());
        order.setBuyer(buyer);
        order.setTotalAmount(BigDecimal.valueOf(1999));
        order.setFinalAmount(BigDecimal.valueOf(1999));
        order.setOrderStatus(OrderStatus.PLACED);
        order.setPaymentStatus(PaymentStatus.PAID);
        Order savedOrder = orderRepository.save(order);

        // Execute async invoice generator
        CompletableFuture<InvoiceReceiptDTO> future =
                asyncInvoiceGeneratorService.generateOrderInvoiceAsync(savedOrder.getId());

        assertNotNull(future);

        // Await result from background worker thread
        InvoiceReceiptDTO receipt = future.get(5, TimeUnit.SECONDS);

        assertNotNull(receipt);
        assertEquals(savedOrder.getId(), receipt.getOrderId());
        assertEquals("GENERATED", receipt.getStatus());
        assertNotNull(receipt.getGeneratedByThread());

        // Verify it executed on the configured ThreadPoolTaskExecutor thread prefix
        assertTrue(receipt.getGeneratedByThread().startsWith("ShopKart-Async-"),
                "Expected worker thread name prefix ShopKart-Async-, but got: " + receipt.getGeneratedByThread());
    }

    @Test
    @DisplayName("Verify GenericCache<K, V> operations, TTL expiration, bounded streams, and thread safety")
    void testGenericCacheOperations() throws InterruptedException {
        GenericCache<String, Integer> cache = new GenericCache<>(10_000);

        cache.put("item1", 100);
        cache.put("item2", 200);
        cache.put("item3", 300);

        assertTrue(cache.containsKey("item1"));
        assertEquals(Optional.of(200), cache.get("item2"));
        assertEquals(3, cache.size());

        // Stream filtering with Predicate<? super V>
        List<Integer> highValues = cache.filterValues(val -> val >= 200);
        assertEquals(2, highValues.size());
        assertTrue(highValues.contains(200));
        assertTrue(highValues.contains(300));

        // Stream mapping with Function<? super V, ? extends R>
        List<String> formattedValues = cache.mapValues(val -> "Val:" + val);
        assertEquals(3, formattedValues.size());

        // computeIfAbsent
        Integer computed = cache.computeIfAbsent("item4", key -> key.length() * 10);
        assertEquals(50, computed);
        assertTrue(cache.containsKey("item4"));

        // TTL expiration test
        GenericCache<String, String> expiringCache = new GenericCache<>(60); // 60ms TTL
        expiringCache.put("temp", "expiring_data");
        assertTrue(expiringCache.containsKey("temp"));

        Thread.sleep(120); // wait for expiration

        assertFalse(expiringCache.containsKey("temp"));
        assertEquals(Optional.empty(), expiringCache.get("temp"));
    }

    @Test
    @DisplayName("Verify PaginatedResult<T> functional stream filtering, sorting, and bounded transformations")
    void testPaginatedResult() {
        List<String> items = Arrays.asList("Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape");

        PaginatedResult<String> page1 = PaginatedResult.of(items, 0, 3);
        assertEquals(3, page1.getContent().size());
        assertEquals(7, page1.getTotalElements());
        assertEquals(3, page1.getTotalPages());
        assertTrue(page1.hasNext());
        assertFalse(page1.hasPrevious());
        assertEquals(Arrays.asList("Apple", "Banana", "Cherry"), page1.getContent());

        // Page 2
        PaginatedResult<String> page2 = PaginatedResult.of(items, 1, 3);
        assertEquals(Arrays.asList("Date", "Elderberry", "Fig"), page2.getContent());
        assertTrue(page2.hasNext());
        assertTrue(page2.hasPrevious());

        // Functional mapping: String -> Integer (lengths)
        PaginatedResult<Integer> lengths = page1.map(String::length);
        assertEquals(Arrays.asList(5, 6, 6), lengths.getContent());

        // Filtering
        PaginatedResult<String> filtered = page1.filter(s -> s.startsWith("A"));
        assertEquals(1, filtered.getContent().size());
        assertEquals("Apple", filtered.getContent().get(0));

        // Sorting
        PaginatedResult<String> sortedDesc = page1.sorted(Comparator.reverseOrder());
        assertEquals(Arrays.asList("Cherry", "Banana", "Apple"), sortedDesc.getContent());

        // Empty boundary
        PaginatedResult<String> empty = PaginatedResult.empty();
        assertEquals(0, empty.getContent().size());
        assertEquals(0, empty.getTotalElements());
    }

    @Test
    @DisplayName("Verify reusable generic ApiResponse<T> factory methods, error details, and types")
    void testGenericApiResponse() {
        // DTO ApiResponse
        ApiResponse<String> successRes = ApiResponse.success("CustomData", "Operation Successful");
        assertTrue(successRes.isSuccess());
        assertEquals("Operation Successful", successRes.getMessage());
        assertEquals("CustomData", successRes.getData());

        List<String> errors = Arrays.asList("Name must not be empty", "Email is invalid");
        ApiResponse<Void> errorRes = ApiResponse.error("Validation Failed", errors);
        assertFalse(errorRes.isSuccess());
        assertEquals("Validation Failed", errorRes.getMessage());
        assertNull(errorRes.getData());
        assertEquals(2, errorRes.getDetails().size());
        assertEquals("Name must not be empty", errorRes.getDetails().get(0));

        // Common ApiResponse
        com.shopkart.common.ApiResponse<Integer> commonSuccess =
                com.shopkart.common.ApiResponse.success(42, "Computed Answer");
        assertTrue(commonSuccess.isSuccess());
        assertEquals(Integer.valueOf(42), commonSuccess.getData());

        com.shopkart.common.ApiResponse<Object> commonError =
                com.shopkart.common.ApiResponse.error("Err", Collections.singletonList("Detail 1"));
        assertFalse(commonError.isSuccess());
        assertEquals(1, commonError.getDetails().size());
    }
}
