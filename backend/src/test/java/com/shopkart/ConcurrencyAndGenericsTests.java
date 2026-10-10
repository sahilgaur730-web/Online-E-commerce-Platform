package com.shopkart;

import com.shopkart.dto.ApiResponse;
import com.shopkart.dto.InvoiceReceiptDTO;
import com.shopkart.model.*;
import com.shopkart.repository.*;
import com.shopkart.security.JwtUtils;
import com.shopkart.security.UserPrincipal;
import com.shopkart.service.AsyncInvoiceGeneratorService;
import com.shopkart.util.GenericCache;
import com.shopkart.util.PaginatedResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ConcurrencyAndGenericsTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtils jwtUtils;

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

    @Autowired
    @org.springframework.beans.factory.annotation.Qualifier("shopkartTaskExecutor")
    private org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor shopkartTaskExecutor;

    @Test
    @DisplayName("Verify @Async CompletableFuture invoice generation runs in dedicated ShopKart-Async- thread and exposes GET /api/orders/{id}/invoice")
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

        // Verify cached invoice is present in GenericCache
        assertTrue(asyncInvoiceGeneratorService.getCachedInvoice(savedOrder.getId()).isPresent());

        // Verify GET /api/orders/{id}/invoice endpoint returns wrapped ApiResponse<InvoiceReceiptDTO>
        String buyerToken = jwtUtils.generateToken(UserPrincipal.create(buyer));
        mockMvc.perform(get("/api/orders/" + savedOrder.getId() + "/invoice")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderId").value(savedOrder.getId()))
                .andExpect(jsonPath("$.data.status").value("GENERATED"));

        // Verify BOLA protection: a different buyer cannot access this order's invoice
        User otherBuyer = new User("Other Buyer", "otherbuyer" + System.currentTimeMillis() + "@shopkart.com", "pass123", Role.BUYER, "9988776655");
        User savedOtherBuyer = userRepository.save(otherBuyer);
        String otherBuyerToken = jwtUtils.generateToken(UserPrincipal.create(savedOtherBuyer));
        mockMvc.perform(get("/api/orders/" + savedOrder.getId() + "/invoice")
                        .header("Authorization", "Bearer " + otherBuyerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        // Non-existent & null order ID boundary tests
        CompletableFuture<InvoiceReceiptDTO> missingFuture =
                asyncInvoiceGeneratorService.generateOrderInvoiceAsync(999_999_999L);
        assertNull(missingFuture.get(5, TimeUnit.SECONDS));
        assertNull(asyncInvoiceGeneratorService.generateOrderInvoiceAsync(null).get(5, TimeUnit.SECONDS));
    }

    @Test
    @DisplayName("Verify ThreadPoolTaskExecutor parameters (core=4, max=8, queue=50) and CallerRunsPolicy saturation backpressure")
    void testThreadPoolExecutorConfigAndBackpressureSaturation() throws Exception {
        assertNotNull(shopkartTaskExecutor);
        assertEquals(4, shopkartTaskExecutor.getCorePoolSize());
        assertEquals(8, shopkartTaskExecutor.getMaxPoolSize());
        assertEquals(50, shopkartTaskExecutor.getQueueCapacity());
        assertEquals("ShopKart-Async-", shopkartTaskExecutor.getThreadNamePrefix());

        // Submit 65 concurrent tasks (> maxPoolSize 8 + queueCapacity 50 = 58) to verify CallerRunsPolicy backpressure
        int totalTasks = 65;
        java.util.concurrent.atomic.AtomicInteger completedTasks = new java.util.concurrent.atomic.AtomicInteger(0);
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        for (int i = 0; i < totalTasks; i++) {
            futures.add(CompletableFuture.runAsync(() -> {
                try {
                    Thread.sleep(5);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                completedTasks.incrementAndGet();
            }, shopkartTaskExecutor));
        }
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).get(10, TimeUnit.SECONDS);
        assertEquals(totalTasks, completedTasks.get(), "All 65 burst tasks must complete under CallerRunsPolicy without rejection");
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

        // Long.MAX_VALUE TTL overflow boundary check
        cache.put("eternal", 777, Long.MAX_VALUE);
        assertEquals(Optional.of(777), cache.get("eternal"), "Long.MAX_VALUE TTL must not overflow into negative expiry");

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

        // Empty boundary & PaginatedResult.of with empty list preserves page/size
        PaginatedResult<String> empty = PaginatedResult.empty();
        assertEquals(0, empty.getContent().size());
        assertEquals(0, empty.getTotalElements());
        PaginatedResult<String> emptyCustom = PaginatedResult.of(Collections.emptyList(), 2, 5);
        assertEquals(2, emptyCustom.getPage());
        assertEquals(5, emptyCustom.getSize());
        assertEquals(0, emptyCustom.getTotalElements());

        // Spring Data Page conversion
        org.springframework.data.domain.Page<String> springPage =
                new org.springframework.data.domain.PageImpl<>(Arrays.asList("X", "Y"), org.springframework.data.domain.PageRequest.of(0, 2), 4);
        PaginatedResult<String> fromSpring = PaginatedResult.fromPage(springPage);
        assertEquals(2, fromSpring.getContent().size());
        assertEquals(4, fromSpring.getTotalElements());
        assertTrue(fromSpring.hasNext());
        assertEquals(0, PaginatedResult.fromPage(null).getTotalElements());
    }

    @Test
    @DisplayName("Verify reusable generic ApiResponse<T> factory methods, error details, and types")
    void testGenericApiResponse() {
        // DTO ApiResponse
        ApiResponse<String> successRes = ApiResponse.success("CustomData", "Operation Successful");
        assertTrue(successRes.isSuccess());
        assertEquals("Operation Successful", successRes.getMessage());
        assertEquals("CustomData", successRes.getData());

        ApiResponse<String> singleArgSuccess = ApiResponse.success("OnlyData");
        assertTrue(singleArgSuccess.isSuccess());
        assertEquals("OnlyData", singleArgSuccess.getData());

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
        assertEquals(Integer.valueOf(99), com.shopkart.common.ApiResponse.success(99).getData());

        com.shopkart.common.ApiResponse<Object> commonError =
                com.shopkart.common.ApiResponse.error("Err", Collections.singletonList("Detail 1"));
        assertFalse(commonError.isSuccess());
        assertEquals(1, commonError.getDetails().size());
    }

    @Test
    @DisplayName("Verify GenericCache multi-threaded atomic computeIfAbsent with 20 concurrent threads")
    void testConcurrentGenericCacheComputeIfAbsent() throws InterruptedException {
        GenericCache<String, String> cache = new GenericCache<>(30_000);
        java.util.concurrent.atomic.AtomicInteger computeCount = new java.util.concurrent.atomic.AtomicInteger(0);

        int numThreads = 20;
        java.util.concurrent.CountDownLatch startLatch = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.CountDownLatch doneLatch = new java.util.concurrent.CountDownLatch(numThreads);
        List<String> results = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < numThreads; i++) {
            new Thread(() -> {
                try {
                    startLatch.await();
                    String val = cache.computeIfAbsent("sharedKey", key -> {
                        computeCount.incrementAndGet();
                        try {
                            Thread.sleep(20);
                        } catch (InterruptedException ignored) {}
                        return "COMPUTED_VALUE";
                    });
                    results.add(val);
                } catch (Exception ignored) {
                } finally {
                    doneLatch.countDown();
                }
            }).start();
        }

        startLatch.countDown();
        assertTrue(doneLatch.await(5, TimeUnit.SECONDS));

        assertEquals(20, results.size());
        for (String val : results) {
            assertEquals("COMPUTED_VALUE", val);
        }
        assertEquals(1, computeCount.get(), "Mapping function must execute exactly once under concurrent threads");
    }

    @Test
    @DisplayName("Verify PaginatedResult JSON serialization contains hasNext and hasPrevious")
    void testPaginatedResultJsonSerialization() throws Exception {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        List<String> items = Arrays.asList("ItemA", "ItemB", "ItemC", "ItemD");
        PaginatedResult<String> page = PaginatedResult.of(items, 0, 2);

        String json = mapper.writeValueAsString(page);
        assertNotNull(json);
        assertTrue(json.contains("\"hasNext\":true"));
        assertTrue(json.contains("\"hasPrevious\":false"));
        assertTrue(json.contains("\"totalPages\":2"));
        assertTrue(json.contains("\"totalElements\":4"));
    }
}

