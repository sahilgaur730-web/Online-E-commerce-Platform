package com.shopkart;

import com.shopkart.common.BadRequestException;
import com.shopkart.dto.AddToCartRequest;
import com.shopkart.dto.CreateOrderRequest;
import com.shopkart.dto.OrderDto;
import com.shopkart.model.*;
import com.shopkart.repository.*;
import com.shopkart.service.CartService;
import com.shopkart.service.InventoryService;
import com.shopkart.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Concurrency and multithreaded optimistic locking test suite for Milestone M4.
 * Simulates simultaneous checkout, race conditions on stock=1, oversell prevention,
 * and transactional rollback.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ConcurrencyAndOptimisticLockTests {

    @Autowired
    private OrderService orderService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private CartService cartService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private User seller;
    private Category category;

    @BeforeEach
    void setUp() {
        seller = userRepository.findByEmail("seller@shopkart.com")
                .orElseGet(() -> userRepository.save(new User("Test Seller", "seller@shopkart.com", "pass123", Role.SELLER, "9876500002")));

        category = categoryRepository.findAll().stream().findFirst().orElseGet(() ->
                categoryRepository.save(new Category("Electronics", "electronics-" + System.currentTimeMillis(), "Tech gear", "Laptop", "", 1))
        );
    }

    private Product createProductWithStock(String title, int stock) {
        Product p = new Product();
        p.setTitle(title);
        p.setDescription("Concurrency test product");
        p.setBrand("ShopKart");
        p.setPrice(new BigDecimal("999.00"));
        p.setOriginalPrice(new BigDecimal("1299.00"));
        p.setStock(stock);
        p.setCategory(category);
        p.setSeller(seller);
        return productRepository.saveAndFlush(p);
    }

    private User createBuyer(String name, String email) {
        User buyer = userRepository.findByEmail(email).orElseGet(() ->
                userRepository.save(new User(name, email, "pass123", Role.BUYER, "9876543210"))
        );
        Address address = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(buyer.getId()).stream().findFirst()
                .orElseGet(() -> {
                    Address addr = new Address();
                    addr.setUser(buyer);
                    addr.setFullName(name);
                    addr.setPhone("9876543210");
                    addr.setPincode("560103");
                    addr.setStreetAddress("123 Race Track Road");
                    addr.setCity("Bengaluru");
                    addr.setState("Karnataka");
                    addr.setDefault(true);
                    return addressRepository.save(addr);
                });
        cartService.clearCart(buyer.getId());
        return buyer;
    }

    @Test
    @DisplayName("Verify simultaneous checkout on stock=1 allows exactly 1 winner and cleanly rolls back the loser")
    void testSimultaneousOrderPlacementOnStockOne() throws Exception {
        // Setup product with stock = 1
        Product product = createProductWithStock("Limited Edition Phone " + System.currentTimeMillis(), 1);

        // Setup two distinct buyers
        User buyer1 = createBuyer("Buyer Alpha", "alpha_" + System.currentTimeMillis() + "@shopkart.com");
        User buyer2 = createBuyer("Buyer Beta", "beta_" + System.currentTimeMillis() + "@shopkart.com");

        Address address1 = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(buyer1.getId()).get(0);
        Address address2 = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(buyer2.getId()).get(0);

        // Both buyers add the 1 remaining item to their carts
        cartService.addToCart(buyer1.getId(), new AddToCartRequest(product.getId(), 1));
        cartService.addToCart(buyer2.getId(), new AddToCartRequest(product.getId(), 1));

        assertEquals(1, cartService.getCartSummary(buyer1.getId()).getTotalItems());
        assertEquals(1, cartService.getCartSummary(buyer2.getId()).getTotalItems());

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger optimisticLockCount = new AtomicInteger(0);
        AtomicInteger badRequestCount = new AtomicInteger(0);
        List<Throwable> unexpectedExceptions = Collections.synchronizedList(new ArrayList<>());
        List<OrderDto> successfulOrders = Collections.synchronizedList(new ArrayList<>());

        // Thread 1: Buyer 1
        executor.submit(() -> {
            try {
                readyLatch.countDown();
                startLatch.await();
                OrderDto order = orderService.createOrder(buyer1.getId(), new CreateOrderRequest(address1.getId(), "COD"));
                successCount.incrementAndGet();
                successfulOrders.add(order);
            } catch (OptimisticLockingFailureException ex) {
                optimisticLockCount.incrementAndGet();
            } catch (BadRequestException ex) {
                badRequestCount.incrementAndGet();
            } catch (Throwable t) {
                unexpectedExceptions.add(t);
            } finally {
                doneLatch.countDown();
            }
        });

        // Thread 2: Buyer 2
        executor.submit(() -> {
            try {
                readyLatch.countDown();
                startLatch.await();
                OrderDto order = orderService.createOrder(buyer2.getId(), new CreateOrderRequest(address2.getId(), "UPI"));
                successCount.incrementAndGet();
                successfulOrders.add(order);
            } catch (OptimisticLockingFailureException ex) {
                optimisticLockCount.incrementAndGet();
            } catch (BadRequestException ex) {
                badRequestCount.incrementAndGet();
            } catch (Throwable t) {
                unexpectedExceptions.add(t);
            } finally {
                doneLatch.countDown();
            }
        });

        // Release threads simultaneously
        assertTrue(readyLatch.await(5, TimeUnit.SECONDS), "Both worker threads must report ready");
        startLatch.countDown();
        assertTrue(doneLatch.await(10, TimeUnit.SECONDS), "Concurrent checkout execution must finish within 10 seconds");
        executor.shutdown();

        // 1. Invariants on execution counts
        assertEquals(0, unexpectedExceptions.size(), "Unexpected errors: " + unexpectedExceptions);
        assertEquals(1, successCount.get(), "Exactly one buyer must successfully place the order");
        assertEquals(1, optimisticLockCount.get() + badRequestCount.get(),
                "The colliding buyer must fail with either OptimisticLockingFailureException or BadRequestException");

        // 2. Oversell prevention: remaining stock must be 0, never negative
        Product refreshed = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(0, refreshed.getStock(), "Stock must be exactly 0 after one unit was ordered");

        // 3. Rollback & cart preservation verification
        Long winningBuyerId = successfulOrders.get(0).getBuyerId();
        Long losingBuyerId = winningBuyerId.equals(buyer1.getId()) ? buyer2.getId() : buyer1.getId();

        // Winner's cart is cleared
        assertEquals(0, cartService.getCartSummary(winningBuyerId).getTotalItems(), "Winning buyer cart must be emptied");
        // Loser's cart is preserved due to transactional rollback
        assertEquals(1, cartService.getCartSummary(losingBuyerId).getTotalItems(), "Losing buyer cart must be preserved upon rollback");
    }

    @Test
    @DisplayName("Verify high-contention concurrent stock deduction prevents oversell across 4 threads")
    void testConcurrentStockDeductionHighContention() throws Exception {
        Product product = createProductWithStock("Hot Deal Item " + System.currentTimeMillis(), 1);

        int threadCount = 4;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    readyLatch.countDown();
                    startLatch.await();
                    txTemplate.executeWithoutResult(status -> {
                        inventoryService.deductStock(product.getId(), 1);
                    });
                    successCount.incrementAndGet();
                } catch (OptimisticLockingFailureException | BadRequestException ex) {
                    failureCount.incrementAndGet();
                } catch (Throwable ignored) {
                    failureCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        assertTrue(readyLatch.await(5, TimeUnit.SECONDS));
        startLatch.countDown();
        assertTrue(doneLatch.await(10, TimeUnit.SECONDS));
        executor.shutdown();

        assertEquals(1, successCount.get(), "Exactly one thread must succeed in deducting stock");
        assertEquals(threadCount - 1, failureCount.get(), "All other 3 threads must be rejected");

        Product refreshed = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(0, refreshed.getStock(), "Final stock must be exactly 0 (no overselling)");
    }

    @Test
    @DisplayName("Verify deterministic @Version conflict when two concurrent transactions update the same entity")
    void testDirectVersionMismatchOptimisticLock() {
        Product product = createProductWithStock("Versioned Item " + System.currentTimeMillis(), 10);
        Long productId = product.getId();

        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        // Transaction 1 updates stock to 9 and commits
        txTemplate.executeWithoutResult(status -> {
            Product p1 = productRepository.findById(productId).orElseThrow();
            p1.setStock(9);
            productRepository.saveAndFlush(p1);
        });

        // Verify version was incremented
        Product afterTx1 = productRepository.findById(productId).orElseThrow();
        assertEquals(9, afterTx1.getStock());
        assertNotNull(afterTx1.getVersion());

        // Now simulate stale update using outdated version
        assertThrows(ObjectOptimisticLockingFailureException.class, () -> {
            txTemplate.executeWithoutResult(status -> {
                // Instantiate entity with old version = 0
                Product stale = new Product();
                stale.setId(productId);
                stale.setTitle(product.getTitle());
                stale.setBrand(product.getBrand());
                stale.setPrice(product.getPrice());
                stale.setCategory(product.getCategory());
                stale.setSeller(product.getSeller());
                stale.setStock(5);
                stale.setVersion(product.getVersion()); // Stale version!
                productRepository.saveAndFlush(stale);
            });
        });

        // Stock in database must remain 9
        Product finalProduct = productRepository.findById(productId).orElseThrow();
        assertEquals(9, finalProduct.getStock());
    }
}
