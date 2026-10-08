package com.shopkart;

import com.shopkart.common.BadRequestException;
import com.shopkart.dto.CreateOrderRequest;
import com.shopkart.dto.OrderDto;
import com.shopkart.dto.PaymentVerificationRequest;
import com.shopkart.dto.RegisterRequest;
import com.shopkart.dto.ReviewCreateRequest;
import com.shopkart.dto.ReviewDto;
import com.shopkart.model.*;
import com.shopkart.repository.*;
import com.shopkart.security.JwtUtils;
import com.shopkart.security.UserPrincipal;
import com.shopkart.service.AuthService;
import com.shopkart.service.InventoryService;
import com.shopkart.service.OrderService;
import com.shopkart.service.PaymentService;
import com.shopkart.service.ReviewService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityRemediationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Test
    @DisplayName("1. Prohibit ADMIN registration via RegisterRequest, AuthService, and HTTP REST endpoint")
    void testAdminRegistrationProhibited() throws Exception {
        // Attempting to set role ADMIN on RegisterRequest directly throws
        RegisterRequest req = new RegisterRequest();
        assertThrows(BadRequestException.class, () -> req.setRole(Role.ADMIN));

        // Default role is BUYER
        assertEquals(Role.BUYER, req.getRole());

        // Role SELLER is permitted
        req.setRole(Role.SELLER);
        assertEquals(Role.SELLER, req.getRole());

        // HTTP POST with role ADMIN returns 400 Bad Request (handled, not 500)
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Attacker\",\"email\":\"attacker" + System.currentTimeMillis() + "@shopkart.com\",\"password\":\"secret123\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("ADMIN")));
    }

    @Test
    @DisplayName("2. Deactivated user token is rejected with 403 Forbidden by JwtAuthenticationFilter")
    void testDeactivatedUserTokenRejected() throws Exception {
        User user = new User("Deactivated User", "deactivated" + System.currentTimeMillis() + "@shopkart.com", "pass123", Role.BUYER, "1234567890");
        user.setActive(false);
        userRepository.save(user);

        UserPrincipal principal = UserPrincipal.create(user);
        String token = jwtUtils.generateToken(principal);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("3. Order Status BOLA check and strict State Machine progression")
    void testOrderStatusBOLAAndStateMachine() {
        User seller1 = userRepository.findByEmail("seller@shopkart.com").orElseThrow();
        User seller2 = userRepository.findByEmail("fashionhub@shopkart.com").orElseThrow();
        User buyer = userRepository.findByEmail("buyer@shopkart.com").orElseThrow();
        Address address = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(buyer.getId()).get(0);
        Product seller1Product = productRepository.findBySellerIdOrderByCreatedAtDesc(seller1.getId()).get(0);

        // Place an order with seller1's product
        Order order = new Order();
        order.setOrderNumber("OD_TEST_" + System.currentTimeMillis());
        order.setBuyer(buyer);
        order.setTotalAmount(seller1Product.getPrice());
        order.setFinalAmount(seller1Product.getPrice());
        order.setOrderStatus(OrderStatus.PLACED);
        order.setPaymentMethod("COD");
        order.setShippingAddressSnapshot("Test Snapshot");
        Order savedOrder = orderRepository.save(order);

        OrderItem item = new OrderItem(savedOrder, seller1Product, seller1Product.getTitle(), "", seller1Product.getPrice(), 1, seller1Product.getPrice());
        orderItemRepository.save(item);
        savedOrder.setItems(List.of(item));

        // Seller 2 does NOT own any product in this order -> BOLA rejection
        assertThrows(BadRequestException.class, () -> {
            orderService.updateOrderStatus(savedOrder.getId(), OrderStatus.CONFIRMED, "Trying unauthorized update", seller2.getEmail());
        });

        // Seller 1 owns the product -> Allowed to advance PLACED -> CONFIRMED
        OrderDto confirmed = orderService.updateOrderStatus(savedOrder.getId(), OrderStatus.CONFIRMED, "Confirmed by seller", seller1.getEmail());
        assertEquals(OrderStatus.CONFIRMED, confirmed.getOrderStatus());

        // Rewind to PLACED -> Rejected
        assertThrows(BadRequestException.class, () -> {
            orderService.updateOrderStatus(savedOrder.getId(), OrderStatus.PLACED, "Rewind to placed", seller1.getEmail());
        });

        // Advance to SHIPPED
        OrderDto shipped = orderService.updateOrderStatus(savedOrder.getId(), OrderStatus.SHIPPED, "Shipped by seller", seller1.getEmail());
        assertEquals(OrderStatus.SHIPPED, shipped.getOrderStatus());

        // Disallow CANCELLED once SHIPPED
        assertThrows(BadRequestException.class, () -> {
            orderService.updateOrderStatus(savedOrder.getId(), OrderStatus.CANCELLED, "Cancel after shipping", seller1.getEmail());
        });

        // Advance to OUT_FOR_DELIVERY
        OrderDto outForDelivery = orderService.updateOrderStatus(savedOrder.getId(), OrderStatus.OUT_FOR_DELIVERY, "Out for delivery", "admin@shopkart.com");
        assertEquals(OrderStatus.OUT_FOR_DELIVERY, outForDelivery.getOrderStatus());

        // Disallow CANCELLED once OUT_FOR_DELIVERY
        assertThrows(BadRequestException.class, () -> {
            orderService.updateOrderStatus(savedOrder.getId(), OrderStatus.CANCELLED, "Cancel while out for delivery", "admin@shopkart.com");
        });

        // Strict state machine: jumping directly from PLACED to SHIPPED is prohibited
        Order orderSkip = new Order();
        orderSkip.setOrderNumber("OD_SKIP_" + System.currentTimeMillis());
        orderSkip.setBuyer(buyer);
        orderSkip.setTotalAmount(seller1Product.getPrice());
        orderSkip.setFinalAmount(seller1Product.getPrice());
        orderSkip.setOrderStatus(OrderStatus.PLACED);
        Order savedOrderSkip = orderRepository.save(orderSkip);
        OrderItem itemSkip = new OrderItem(savedOrderSkip, seller1Product, seller1Product.getTitle(), "", seller1Product.getPrice(), 1, seller1Product.getPrice());
        orderItemRepository.save(itemSkip);
        savedOrderSkip.setItems(List.of(itemSkip));

        assertThrows(BadRequestException.class, () -> {
            orderService.updateOrderStatus(savedOrderSkip.getId(), OrderStatus.SHIPPED, "Jump to shipped without confirm", seller1.getEmail());
        });
    }

    @Test
    @DisplayName("4. Payment Service guards against double-paying, paying for cancelled order, paying refunded order, and overwriting PAID")
    void testPaymentServiceGuards() {
        User buyer = userRepository.findByEmail("buyer@shopkart.com").orElseThrow();

        // 1. Paid order
        Order paidOrder = new Order();
        paidOrder.setOrderNumber("OD_PAID_" + System.currentTimeMillis());
        paidOrder.setBuyer(buyer);
        paidOrder.setTotalAmount(new BigDecimal("1000"));
        paidOrder.setFinalAmount(new BigDecimal("1000"));
        paidOrder.setOrderStatus(OrderStatus.CONFIRMED);
        paidOrder.setPaymentStatus(PaymentStatus.PAID);
        orderRepository.save(paidOrder);

        // Cannot create payment intent for already paid order
        assertThrows(BadRequestException.class, () -> {
            paymentService.createPaymentIntent(buyer.getId(), new com.shopkart.dto.PaymentIntentRequest(paidOrder.getId()));
        });

        // Cannot overwrite or fail already paid order
        assertThrows(BadRequestException.class, () -> {
            paymentService.verifyPayment(buyer.getId(), new PaymentVerificationRequest(paidOrder.getId(), "TXN_NEW", false));
        });

        // 2. Cancelled order
        Order cancelledOrder = new Order();
        cancelledOrder.setOrderNumber("OD_CANCELLED_" + System.currentTimeMillis());
        cancelledOrder.setBuyer(buyer);
        cancelledOrder.setTotalAmount(new BigDecimal("1000"));
        cancelledOrder.setFinalAmount(new BigDecimal("1000"));
        cancelledOrder.setOrderStatus(OrderStatus.CANCELLED);
        cancelledOrder.setPaymentStatus(PaymentStatus.PENDING);
        orderRepository.save(cancelledOrder);

        // Cannot create payment intent for cancelled order
        assertThrows(BadRequestException.class, () -> {
            paymentService.createPaymentIntent(buyer.getId(), new com.shopkart.dto.PaymentIntentRequest(cancelledOrder.getId()));
        });

        // Cannot verify payment for cancelled order
        assertThrows(BadRequestException.class, () -> {
            paymentService.verifyPayment(buyer.getId(), new PaymentVerificationRequest(cancelledOrder.getId(), "TXN_NEW", true));
        });

        // 3. Refunded order
        Order refundedOrder = new Order();
        refundedOrder.setOrderNumber("OD_REFUNDED_" + System.currentTimeMillis());
        refundedOrder.setBuyer(buyer);
        refundedOrder.setTotalAmount(new BigDecimal("1000"));
        refundedOrder.setFinalAmount(new BigDecimal("1000"));
        refundedOrder.setOrderStatus(OrderStatus.CANCELLED);
        refundedOrder.setPaymentStatus(PaymentStatus.REFUNDED);
        orderRepository.save(refundedOrder);

        assertThrows(BadRequestException.class, () -> {
            paymentService.createPaymentIntent(buyer.getId(), new com.shopkart.dto.PaymentIntentRequest(refundedOrder.getId()));
        });
        assertThrows(BadRequestException.class, () -> {
            paymentService.verifyPayment(buyer.getId(), new PaymentVerificationRequest(refundedOrder.getId(), "TXN_NEW", true));
        });
    }

    @Test
    @DisplayName("5. GlobalExceptionHandler sanitizes generic unhandled exceptions (CWE-209) and properly handles payload parse errors")
    void testGlobalExceptionHandlerSanitization() throws Exception {
        com.shopkart.common.GlobalExceptionHandler handler = new com.shopkart.common.GlobalExceptionHandler();
        org.springframework.http.ResponseEntity<com.shopkart.common.ApiResponse<Void>> response =
                handler.handleGeneralException(new RuntimeException("Sensitive database credentials or internal stack details"));
        assertEquals(500, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("An unexpected error occurred. Please contact support.", response.getBody().getMessage());
        assertFalse(response.getBody().getMessage().contains("Sensitive database"));

        // Malformed body via mockMvc returns 400 rather than 500
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{malformed: json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("6. Unauthenticated /api/auth/profile returns 401 Unauthorized and login/register are public")
    void testAuthEndpointsSecurity() throws Exception {
        // /api/auth/profile without token returns 401
        mockMvc.perform(put("/api/auth/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Hacker\"}"))
                .andExpect(status().isUnauthorized());

        // /api/auth/me without token returns 401
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());

        // /api/products is public
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("7. OrderRepository findOrdersBySellerId returns distinct orders")
    @Transactional
    void testOrderRepositoryDistinctOrders() {
        User seller1 = userRepository.findByEmail("seller@shopkart.com").orElseThrow();
        User buyer = userRepository.findByEmail("buyer@shopkart.com").orElseThrow();
        List<Product> seller1Products = productRepository.findBySellerIdOrderByCreatedAtDesc(seller1.getId());
        assertTrue(seller1Products.size() >= 2);

        Order order = new Order();
        order.setOrderNumber("OD_MULTI_ITEM_" + System.currentTimeMillis());
        order.setBuyer(buyer);
        order.setTotalAmount(new BigDecimal("5000"));
        order.setFinalAmount(new BigDecimal("5000"));
        order.setOrderStatus(OrderStatus.PLACED);
        Order savedOrder = orderRepository.save(order);

        // Two items from the same seller in the same order
        OrderItem item1 = new OrderItem(savedOrder, seller1Products.get(0), "Item 1", "", new BigDecimal("2500"), 1, new BigDecimal("2500"));
        OrderItem item2 = new OrderItem(savedOrder, seller1Products.get(1), "Item 2", "", new BigDecimal("2500"), 1, new BigDecimal("2500"));
        orderItemRepository.saveAll(List.of(item1, item2));

        List<Order> orders = orderRepository.findOrdersBySellerId(seller1.getId());
        long countOfThisOrder = orders.stream().filter(o -> o.getId().equals(savedOrder.getId())).count();
        assertEquals(1, countOfThisOrder, "Order should appear only once in seller's order list even with multiple items");
    }

    @Test
    @DisplayName("8. Inventory quantity guard disallows zero and negative quantities")
    @Transactional
    void testInventoryQuantityGuard() {
        Product product = productRepository.findAll().get(0);

        assertThrows(BadRequestException.class, () -> inventoryService.deductStock(product.getId(), 0));
        assertThrows(BadRequestException.class, () -> inventoryService.deductStock(product.getId(), -3));

        assertThrows(BadRequestException.class, () -> inventoryService.restoreStock(product.getId(), 0));
        assertThrows(BadRequestException.class, () -> inventoryService.restoreStock(product.getId(), -2));
    }

    @Test
    @DisplayName("9. Review integrity: no seller self-review, duplicate review check, verified purchase verification")
    @Transactional
    void testReviewIntegrity() {
        User seller1 = userRepository.findByEmail("seller@shopkart.com").orElseThrow();
        Product product = productRepository.findBySellerIdOrderByCreatedAtDesc(seller1.getId()).get(0);
        User buyer = userRepository.findByEmail("buyer@shopkart.com").orElseThrow();

        // 1. Seller cannot review their own product
        ReviewCreateRequest selfReview = new ReviewCreateRequest(5, "Self review", "Great product");
        assertThrows(BadRequestException.class, () -> {
            reviewService.addReview(product.getId(), seller1.getId(), selfReview);
        });

        // 2. Verified purchase logic
        // Create another buyer who has NEVER ordered this product
        User newBuyer = new User("New Buyer", "newbuyer" + System.currentTimeMillis() + "@shopkart.com", "pass123", Role.BUYER, "1122334455");
        final User savedBuyer = userRepository.save(newBuyer);

        ReviewCreateRequest unverifiedReq = new ReviewCreateRequest(4, "Unverified Review", "Nice product");
        ReviewDto unverifiedResult = reviewService.addReview(product.getId(), savedBuyer.getId(), unverifiedReq);
        assertFalse(unverifiedResult.isVerifiedPurchase(), "Should NOT be verified purchase since buyer never ordered it");

        // 3. Duplicate review by same user on same product is rejected
        assertThrows(BadRequestException.class, () -> {
            reviewService.addReview(product.getId(), savedBuyer.getId(), unverifiedReq);
        });

        // 4. Cancelled order does NOT grant verified purchase status
        User cancelledBuyer = new User("Cancelled Buyer", "cancelled" + System.currentTimeMillis() + "@shopkart.com", "pass123", Role.BUYER, "9988776655");
        final User savedCancelledBuyer = userRepository.save(cancelledBuyer);

        Order cancelledOrder = new Order();
        cancelledOrder.setOrderNumber("OD_CANCELLED_REV_" + System.currentTimeMillis());
        cancelledOrder.setBuyer(savedCancelledBuyer);
        cancelledOrder.setTotalAmount(product.getPrice());
        cancelledOrder.setFinalAmount(product.getPrice());
        cancelledOrder.setOrderStatus(OrderStatus.CANCELLED);
        Order savedCancelledOrder = orderRepository.save(cancelledOrder);

        OrderItem cancelledItem = new OrderItem(savedCancelledOrder, product, product.getTitle(), "", product.getPrice(), 1, product.getPrice());
        orderItemRepository.save(cancelledItem);

        ReviewCreateRequest cancelledBuyerReq = new ReviewCreateRequest(5, "Cancelled order review", "Cancelled before delivery");
        ReviewDto cancelledResult = reviewService.addReview(product.getId(), savedCancelledBuyer.getId(), cancelledBuyerReq);
        assertFalse(cancelledResult.isVerifiedPurchase(), "Should NOT be verified purchase since order was cancelled");
    }
}
