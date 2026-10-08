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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class InventoryAndOrderFlowTests {

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
    private com.shopkart.service.ProductService productService;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @Test
    @DisplayName("Inventory deduction and overselling protection test")
    @Transactional
    void testInventoryOversellingProtection() {
        List<Product> products = productRepository.findAll();
        assertFalse(products.isEmpty(), "Products should be seeded");

        Product product = products.get(0);
        int initialStock = product.getStock();

        // 1. Valid deduction
        inventoryService.deductStock(product.getId(), 2);
        Product updated = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(initialStock - 2, updated.getStock());

        // 2. Overselling attempt should throw BadRequestException
        assertThrows(BadRequestException.class, () -> {
            inventoryService.deductStock(product.getId(), initialStock + 100);
        }, "Should prevent overselling when stock is insufficient");

        // 3. Stock restoration
        inventoryService.restoreStock(product.getId(), 2);
        Product restored = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(initialStock, restored.getStock());
    }

    @Test
    @DisplayName("End-to-end Cart, Checkout, Order placement and strict State Machine")
    void testCartCheckoutOrderFlow() {
        User buyer = userRepository.findByEmail("buyer@shopkart.com").orElseThrow();
        Address address = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(buyer.getId()).get(0);
        Product product = productRepository.findAll().stream().filter(p -> p.getStock() > 5).findFirst().orElseThrow();
        int initialStock = product.getStock();

        // 1. Add to cart
        cartService.clearCart(buyer.getId());
        CartSummaryDto cart = cartService.addToCart(buyer.getId(), new AddToCartRequest(product.getId(), 2));
        assertEquals(2, cart.getTotalItems());
        assertTrue(cart.getFinalTotal().compareTo(BigDecimal.ZERO) > 0);

        // 2. Place Order
        CreateOrderRequest orderReq = new CreateOrderRequest(address.getId(), "UPI");
        OrderDto placedOrder = orderService.createOrder(buyer.getId(), orderReq);

        assertNotNull(placedOrder.getId());
        assertEquals(OrderStatus.PLACED, placedOrder.getOrderStatus());
        assertEquals("UPI", placedOrder.getPaymentMethod());
        assertNotNull(placedOrder.getOrderNumber());

        // Verify stock deducted
        Product productAfterOrder = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(initialStock - 2, productAfterOrder.getStock());

        // Verify cart is now empty
        CartSummaryDto emptyCart = cartService.getCartSummary(buyer.getId());
        assertEquals(0, emptyCart.getTotalItems());

        // 3. State Machine: PLACED -> CONFIRMED -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED
        OrderDto confirmed = orderService.updateOrderStatus(placedOrder.getId(), OrderStatus.CONFIRMED, "Seller confirmed order", "admin@shopkart.com");
        assertEquals(OrderStatus.CONFIRMED, confirmed.getOrderStatus());

        OrderDto shipped = orderService.updateOrderStatus(placedOrder.getId(), OrderStatus.SHIPPED, "Item in transit", "admin@shopkart.com");
        assertEquals(OrderStatus.SHIPPED, shipped.getOrderStatus());

        OrderDto outForDelivery = orderService.updateOrderStatus(placedOrder.getId(), OrderStatus.OUT_FOR_DELIVERY, "With courier partner", "admin@shopkart.com");
        assertEquals(OrderStatus.OUT_FOR_DELIVERY, outForDelivery.getOrderStatus());

        OrderDto delivered = orderService.updateOrderStatus(placedOrder.getId(), OrderStatus.DELIVERED, "Package delivered", "admin@shopkart.com");
        assertEquals(OrderStatus.DELIVERED, delivered.getOrderStatus());

        // Attempt invalid state transition after delivered should throw BadRequestException
        assertThrows(BadRequestException.class, () -> {
            orderService.updateOrderStatus(placedOrder.getId(), OrderStatus.SHIPPED, "Invalid jump", "admin@shopkart.com");
        });
    }

    @Test
    @DisplayName("Order cancellation restores inventory correctly")
    void testOrderCancellationRestoresStock() {
        User buyer = userRepository.findByEmail("buyer@shopkart.com").orElseThrow();
        Address address = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(buyer.getId()).get(0);
        Product product = productRepository.findAll().stream().filter(p -> p.getStock() > 5).findFirst().orElseThrow();
        int initialStock = product.getStock();

        cartService.clearCart(buyer.getId());
        cartService.addToCart(buyer.getId(), new AddToCartRequest(product.getId(), 3));

        OrderDto order = orderService.createOrder(buyer.getId(), new CreateOrderRequest(address.getId(), "COD"));
        assertEquals(initialStock - 3, productRepository.findById(product.getId()).orElseThrow().getStock());

        // Cancel order
        OrderDto cancelled = orderService.cancelOrder(order.getId(), buyer.getId(), "Changed mind", false);
        assertEquals(OrderStatus.CANCELLED, cancelled.getOrderStatus());

        // Verify stock is restored
        assertEquals(initialStock, productRepository.findById(product.getId()).orElseThrow().getStock());
    }

    @Test
    @DisplayName("Seller restock endpoint permissions and ownership verification")
    void testSellerRestockPermissions() {
        User seller1 = userRepository.findByEmail("seller@shopkart.com").orElseThrow();
        User seller2 = userRepository.findByEmail("fashionhub@shopkart.com").orElseThrow();
        User admin = userRepository.findByEmail("admin@shopkart.com").orElseThrow();

        // Product 1 (iPhone 15) belongs to seller1
        Product product = productRepository.findBySellerIdOrderByCreatedAtDesc(seller1.getId()).get(0);
        int currentStock = product.getStock();

        // 1. Owner seller can restock
        com.shopkart.dto.ProductDto updated = productService.updateProductStock(product.getId(), currentStock + 10, seller1.getId(), seller1.getEmail(), false);
        assertEquals(currentStock + 10, updated.getStock());

        // 2. Another seller cannot restock product belonging to seller1
        assertThrows(BadRequestException.class, () -> {
            productService.updateProductStock(product.getId(), currentStock + 50, seller2.getId(), seller2.getEmail(), false);
        });

        // 3. Admin has privilege to restock any product
        com.shopkart.dto.ProductDto adminUpdated = productService.updateProductStock(product.getId(), currentStock + 20, admin.getId(), admin.getEmail(), true);
        assertEquals(currentStock + 20, adminUpdated.getStock());
    }

    @Test
    @DisplayName("Product version field is updated to provide optimistic concurrency control")
    @Transactional
    void testOptimisticLockVersionHandling() {
        Product product = productRepository.findAll().get(0);
        Long initialVersion = product.getVersion();

        inventoryService.deductStock(product.getId(), 1);
        entityManager.flush();
        entityManager.refresh(product);

        // Verify version changed/incremented
        assertNotEquals(initialVersion, product.getVersion());
    }
}
