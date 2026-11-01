package com.shopkart;

import com.shopkart.common.BadRequestException;
import com.shopkart.dto.AddToCartRequest;
import com.shopkart.dto.CartSummaryDto;
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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class InventoryAndCheckoutIntegrationTests {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private OrderService orderService;

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

    private User buyer;
    private User seller;
    private Address address;
    private Category category;

    @BeforeEach
    void setUp() {
        buyer = userRepository.findByEmail("buyer@shopkart.com")
                .orElseGet(() -> userRepository.save(new User("Test Buyer", "buyer@shopkart.com", "pass123", Role.BUYER, "9876543210")));

        seller = userRepository.findByEmail("seller@shopkart.com")
                .orElseGet(() -> userRepository.save(new User("Test Seller", "seller@shopkart.com", "pass123", Role.SELLER, "9876500002")));

        address = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(buyer.getId()).stream().findFirst()
                .orElseGet(() -> {
                    Address addr = new Address();
                    addr.setUser(buyer);
                    addr.setFullName("Rahul Sharma");
                    addr.setPhone("9876543210");
                    addr.setPincode("560103");
                    addr.setStreetAddress("Flat 402, Green Glen Heights");
                    addr.setCity("Bengaluru");
                    addr.setState("Karnataka");
                    addr.setDefault(true);
                    return addressRepository.save(addr);
                });

        category = categoryRepository.findAll().stream().findFirst().orElseGet(() ->
                categoryRepository.save(new Category("General", "general-" + System.currentTimeMillis(), "General items", "Package", "", 1))
        );

        cartService.clearCart(buyer.getId());
    }

    private Product createProduct(String title, BigDecimal price, BigDecimal origPrice, int stock, User owner) {
        Product p = new Product();
        p.setTitle(title);
        p.setDescription("Test product description for " + title);
        p.setBrand("ShopKart Brand");
        p.setPrice(price);
        p.setOriginalPrice(origPrice);
        p.setStock(stock);
        p.setCategory(category);
        p.setSeller(owner);
        return productRepository.saveAndFlush(p);
    }

    @Test
    @DisplayName("Test 1: Stock deduction on successful order creation")
    void testStockDeductionOnSuccessfulOrder() {
        Product product = createProduct("Deduction Item " + System.currentTimeMillis(), new BigDecimal("1000.00"), new BigDecimal("1200.00"), 20, seller);
        int initialStock = product.getStock();

        // Add 3 units to cart
        cartService.addToCart(buyer.getId(), new AddToCartRequest(product.getId(), 3));
        assertEquals(3, cartService.getCartSummary(buyer.getId()).getTotalItems());

        // Execute checkout
        CreateOrderRequest req = new CreateOrderRequest(address.getId(), "UPI");
        OrderDto order = orderService.createOrder(buyer.getId(), req);

        // Assertions
        assertNotNull(order.getId());
        assertEquals(OrderStatus.PLACED, order.getOrderStatus());
        assertEquals(PaymentStatus.PENDING, order.getPaymentStatus());

        // Verify stock in database is decremented by 3
        Product updated = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(initialStock - 3, updated.getStock(), "Stock must be decremented by exactly ordered quantity (3)");

        // Verify buyer cart is cleared
        CartSummaryDto cart = cartService.getCartSummary(buyer.getId());
        assertEquals(0, cart.getTotalItems(), "Buyer's cart must be empty after order creation");
    }

    @Test
    @DisplayName("Test 2: Insufficient stock rejection throws BadRequestException")
    void testInsufficientStockRejection() {
        Product product = createProduct("Low Stock Item " + System.currentTimeMillis(), new BigDecimal("500.00"), new BigDecimal("500.00"), 2, seller);

        // 1. Direct InventoryService deduction with quantity > available stock inside transaction
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            txTemplate.executeWithoutResult(status -> {
                inventoryService.deductStock(product.getId(), 5);
            });
        });
        assertTrue(ex.getMessage().contains("Insufficient inventory"));
        assertTrue(ex.getMessage().contains("Requested: 5, Available: 2"));

        // Verify stock remains untouched at 2
        Product unch = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(2, unch.getStock());

        // 2. Quantity guard rejection on 0 or negative
        assertThrows(BadRequestException.class, () -> {
            txTemplate.executeWithoutResult(status -> {
                inventoryService.deductStock(product.getId(), 0);
            });
        });
        assertThrows(BadRequestException.class, () -> {
            txTemplate.executeWithoutResult(status -> {
                inventoryService.deductStock(product.getId(), -3);
            });
        });
    }

    @Test
    @DisplayName("Test 3: Transactional rollback on order creation failure (multi-item cart)")
    void testTransactionalRollbackOnOrderCreationFailure() {
        // Product 1 has sufficient stock (10)
        Product product1 = createProduct("Item 1 Adequate Stock " + System.currentTimeMillis(), new BigDecimal("400.00"), new BigDecimal("500.00"), 10, seller);

        // Product 2 has initial stock (5)
        Product product2 = createProduct("Item 2 Depleting Stock " + System.currentTimeMillis(), new BigDecimal("600.00"), new BigDecimal("700.00"), 5, seller);

        // Add Product 2 first, then Product 1 (so Product 1 is processed first under OrderByCreatedAtDesc)
        cartService.addToCart(buyer.getId(), new AddToCartRequest(product2.getId(), 4));
        try {
            Thread.sleep(20);
        } catch (InterruptedException ignored) {}
        cartService.addToCart(buyer.getId(), new AddToCartRequest(product1.getId(), 2));
        assertEquals(6, cartService.getCartSummary(buyer.getId()).getTotalItems());

        // Simulate concurrent depletion of Product 2 down to 1
        product2.setStock(1);
        productRepository.saveAndFlush(product2);

        int p1InitialStock = product1.getStock(); // 10
        long orderCountBefore = orderRepository.count();

        // Attempt checkout: Item 1 deduction succeeds, but Item 2 deduction fails!
        CreateOrderRequest req = new CreateOrderRequest(address.getId(), "COD");
        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            orderService.createOrder(buyer.getId(), req);
        });

        assertTrue(ex.getMessage().contains("Insufficient inventory"));
        assertTrue(ex.getMessage().contains(product2.getTitle()));

        // CRITICAL INVARIANT: Product 1 stock MUST be rolled back to 10 and NOT left at 8
        Product refreshedP1 = productRepository.findById(product1.getId()).orElseThrow();
        assertEquals(p1InitialStock, refreshedP1.getStock(), "Product 1 stock MUST be rolled back atomically on subsequent item failure!");

        // Product 2 stock remains 1
        Product refreshedP2 = productRepository.findById(product2.getId()).orElseThrow();
        assertEquals(1, refreshedP2.getStock());

        // No order was committed
        assertEquals(orderCountBefore, orderRepository.count(), "No order should be persisted when transaction rolls back");

        // Cart items are NOT cleared
        assertEquals(6, cartService.getCartSummary(buyer.getId()).getTotalItems(), "Cart must be preserved when order creation fails");
    }

    @Test
    @DisplayName("Test 4: Cart calculation & delivery fee business logic (< ₹500 adds ₹40; >= ₹500 free delivery)")
    void testCartCalculationAndDeliveryFeeBusinessLogic() {
        Product pSub300 = createProduct("Product 200 " + System.currentTimeMillis(), new BigDecimal("200.00"), new BigDecimal("250.00"), 20, seller);
        Product pSub350 = createProduct("Product 350 " + System.currentTimeMillis(), new BigDecimal("350.00"), new BigDecimal("400.00"), 20, seller);
        Product pExact500 = createProduct("Product 500 " + System.currentTimeMillis(), new BigDecimal("500.00"), new BigDecimal("500.00"), 20, seller);

        // Case A: Subtotal < ₹500 (₹200) -> deliveryFee = ₹40, finalTotal = ₹240
        cartService.clearCart(buyer.getId());
        cartService.addToCart(buyer.getId(), new AddToCartRequest(pSub300.getId(), 1));
        CartSummaryDto summaryUnder500 = cartService.getCartSummary(buyer.getId());
        assertEquals(0, new BigDecimal("40").compareTo(summaryUnder500.getDeliveryFee()), "Delivery fee must be ₹40 when subtotal < 500");
        assertEquals(0, new BigDecimal("240.00").compareTo(summaryUnder500.getFinalTotal()), "Final total must be 200 + 40 = 240");
        assertEquals(0, new BigDecimal("50.00").compareTo(summaryUnder500.getDiscountTotal()), "Savings discount must be 250 - 200 = 50");

        // Case B: Subtotal >= ₹500 (₹200 + ₹350 = ₹550) -> deliveryFee = ₹0, finalTotal = ₹550
        cartService.addToCart(buyer.getId(), new AddToCartRequest(pSub350.getId(), 1));
        CartSummaryDto summaryOver500 = cartService.getCartSummary(buyer.getId());
        assertEquals(0, BigDecimal.ZERO.compareTo(summaryOver500.getDeliveryFee()), "Delivery fee must be ₹0 when subtotal >= 500");
        assertEquals(0, new BigDecimal("550.00").compareTo(summaryOver500.getFinalTotal()), "Final total must be ₹550 with free delivery");

        // Case C: Exact boundary threshold ₹500 -> deliveryFee = ₹0
        cartService.clearCart(buyer.getId());
        cartService.addToCart(buyer.getId(), new AddToCartRequest(pExact500.getId(), 1));
        CartSummaryDto summaryExact500 = cartService.getCartSummary(buyer.getId());
        assertEquals(0, BigDecimal.ZERO.compareTo(summaryExact500.getDeliveryFee()), "Delivery fee must be ₹0 at exactly ₹500");
        assertEquals(0, new BigDecimal("500.00").compareTo(summaryExact500.getFinalTotal()), "Final total must be ₹500.00");
    }

    @Test
    @DisplayName("Test 5: Out of stock cart addition rejection")
    void testOutOfStockCartAdditionRejection() {
        Product outOfStockProduct = createProduct("Out of Stock " + System.currentTimeMillis(), new BigDecimal("300.00"), new BigDecimal("300.00"), 0, seller);
        Product limitedStockProduct = createProduct("Limited Stock " + System.currentTimeMillis(), new BigDecimal("300.00"), new BigDecimal("300.00"), 3, seller);

        // 1. Attempting to add out of stock product (stock = 0)
        BadRequestException exOos = assertThrows(BadRequestException.class, () -> {
            cartService.addToCart(buyer.getId(), new AddToCartRequest(outOfStockProduct.getId(), 1));
        });
        assertEquals("This product is currently out of stock", exOos.getMessage());

        // 2. Attempting to add quantity greater than available stock (qty 5 > stock 3)
        BadRequestException exExceed = assertThrows(BadRequestException.class, () -> {
            cartService.addToCart(buyer.getId(), new AddToCartRequest(limitedStockProduct.getId(), 5));
        });
        assertTrue(exExceed.getMessage().contains("Cannot add more than available stock (3)"));

        // 3. Adding valid quantity then attempting to increment beyond stock
        cartService.addToCart(buyer.getId(), new AddToCartRequest(limitedStockProduct.getId(), 2));
        BadRequestException exCumulative = assertThrows(BadRequestException.class, () -> {
            cartService.addToCart(buyer.getId(), new AddToCartRequest(limitedStockProduct.getId(), 2));
        });
        assertTrue(exCumulative.getMessage().contains("Cannot add more than available stock (3)"));
    }
}
