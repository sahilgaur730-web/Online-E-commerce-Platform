package com.shopkart;

import com.shopkart.common.BadRequestException;
import com.shopkart.dto.*;
import com.shopkart.model.*;
import com.shopkart.repository.*;
import com.shopkart.service.CartService;
import com.shopkart.service.InventoryService;
import com.shopkart.service.OrderService;
import com.shopkart.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class PaymentWorkflowIntegrationTests {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private CartService cartService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private SubOrderRepository subOrderRepository;

    @Autowired
    private OrderTrackingRepository orderTrackingRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private User buyer;
    private User seller1;
    private User seller2;
    private Address address;
    private Category category;

    @BeforeEach
    void setUp() {
        buyer = userRepository.findByEmail("buyer@shopkart.com")
                .orElseGet(() -> userRepository.save(new User("Rahul Sharma", "buyer@shopkart.com", "pass123", Role.BUYER, "9876543210")));

        seller1 = userRepository.findByEmail("seller@shopkart.com")
                .orElseGet(() -> userRepository.save(new User("Tech Retail", "seller@shopkart.com", "pass123", Role.SELLER, "9876500002")));

        seller2 = userRepository.findByEmail("fashionhub@shopkart.com")
                .orElseGet(() -> userRepository.save(new User("Style Street", "fashionhub@shopkart.com", "pass123", Role.SELLER, "9876500003")));

        address = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(buyer.getId()).stream().findFirst()
                .orElseGet(() -> {
                    Address addr = new Address();
                    addr.setUser(buyer);
                    addr.setFullName("Rahul Sharma");
                    addr.setPhone("9876543210");
                    addr.setPincode("560103");
                    addr.setStreetAddress("Outer Ring Road, Bellandur");
                    addr.setCity("Bengaluru");
                    addr.setState("Karnataka");
                    addr.setDefault(true);
                    return addressRepository.save(addr);
                });

        category = categoryRepository.findAll().stream().findFirst().orElseGet(() ->
                categoryRepository.save(new Category("Electronics", "electronics-" + System.currentTimeMillis(), "Tech gear", "Laptop", "", 1))
        );

        cartService.clearCart(buyer.getId());
    }

    private Product createProduct(String title, BigDecimal price, int stock, User owner) {
        Product p = new Product();
        p.setTitle(title);
        p.setDescription("Test product description for " + title);
        p.setBrand("ShopKart Brand");
        p.setPrice(price);
        p.setOriginalPrice(price);
        p.setStock(stock);
        p.setCategory(category);
        p.setSeller(owner);
        return productRepository.saveAndFlush(p);
    }

    @Test
    @DisplayName("Test 1: Mocked sandbox payment intent creation")
    void testCreatePaymentIntentSandbox() {
        Product product = createProduct("Intent Test Item " + System.currentTimeMillis(), new BigDecimal("1200.00"), 10, seller1);
        cartService.addToCart(buyer.getId(), new AddToCartRequest(product.getId(), 1));
        OrderDto placedOrder = orderService.createOrder(buyer.getId(), new CreateOrderRequest(address.getId(), "CARD"));

        // Call createPaymentIntent
        PaymentIntentRequest intentReq = new PaymentIntentRequest(placedOrder.getId());
        intentReq.setPaymentMethod("CARD");
        PaymentResponse response = paymentService.createPaymentIntent(buyer.getId(), intentReq);

        // Assert sandbox intent generation fields
        assertNotNull(response);
        assertEquals(placedOrder.getId(), response.getOrderId());
        assertEquals(placedOrder.getOrderNumber(), response.getOrderNumber());
        assertEquals(0, placedOrder.getFinalAmount().compareTo(response.getAmount()));
        assertEquals(PaymentStatus.PENDING, response.getStatus());

        assertNotNull(response.getTransactionId(), "Transaction ID must be generated");
        assertTrue(response.getTransactionId().startsWith("TXN_"), "Transaction ID must follow TXN_ prefix");

        assertNotNull(response.getClientSecret(), "Client secret must be generated for gateway init");
        assertTrue(response.getClientSecret().startsWith("sk_intent_"), "Client secret must follow sk_intent_ prefix");

        assertNotNull(response.getGatewayOrderId(), "Gateway order ID must be generated");
        assertTrue(response.getGatewayOrderId().startsWith("order_"), "Gateway order ID must follow order_ prefix");

        // Unauthorized access guard: another user cannot create intent for this order
        assertThrows(BadRequestException.class, () -> {
            paymentService.createPaymentIntent(seller1.getId(), intentReq);
        });
    }

    @Test
    @DisplayName("Test 2: Payment verification success: Order to CONFIRMED, Payment to PAID, and SubOrders to CONFIRMED")
    void testPaymentVerificationSuccess() {
        // Multi-seller cart: Product 1 from seller1, Product 2 from seller2
        Product p1 = createProduct("MultiSeller Tech " + System.currentTimeMillis(), new BigDecimal("800.00"), 10, seller1);
        Product p2 = createProduct("MultiSeller Fashion " + System.currentTimeMillis(), new BigDecimal("600.00"), 10, seller2);

        cartService.addToCart(buyer.getId(), new AddToCartRequest(p1.getId(), 1));
        cartService.addToCart(buyer.getId(), new AddToCartRequest(p2.getId(), 1));

        OrderDto placedOrder = orderService.createOrder(buyer.getId(), new CreateOrderRequest(address.getId(), "UPI"));
        assertEquals(OrderStatus.PLACED, placedOrder.getOrderStatus());
        assertEquals(PaymentStatus.PENDING, placedOrder.getPaymentStatus());

        // Verify initial sub-order packages are in PLACED state
        List<SubOrder> subOrdersPlaced = subOrderRepository.findByOrderIdOrderByCreatedAtAsc(placedOrder.getId());
        assertEquals(2, subOrdersPlaced.size(), "Multi-seller order must generate 2 separate SubOrder packages");
        assertTrue(subOrdersPlaced.stream().allMatch(so -> so.getStatus() == OrderStatus.PLACED));

        // Verify payment successfully
        String txnId = "TXN_VERIFY_OK_" + System.currentTimeMillis();
        PaymentVerificationRequest verifyReq = new PaymentVerificationRequest(placedOrder.getId(), txnId, true);
        PaymentResponse response = paymentService.verifyPayment(buyer.getId(), verifyReq);

        // Assert payment response
        assertEquals(PaymentStatus.PAID, response.getStatus());
        assertEquals(txnId, response.getTransactionId());

        // Assert master order state in database
        Order updatedOrder = orderRepository.findById(placedOrder.getId()).orElseThrow();
        assertEquals(PaymentStatus.PAID, updatedOrder.getPaymentStatus(), "Order payment status must be PAID");
        assertEquals(OrderStatus.CONFIRMED, updatedOrder.getOrderStatus(), "Order status must be CONFIRMED");
        assertEquals(txnId, updatedOrder.getPaymentTransactionId());

        // Assert all vendor SubOrder packages transitioned to CONFIRMED
        List<SubOrder> subOrdersConfirmed = subOrderRepository.findByOrderIdOrderByCreatedAtAsc(placedOrder.getId());
        assertEquals(2, subOrdersConfirmed.size());
        for (SubOrder so : subOrdersConfirmed) {
            assertEquals(OrderStatus.CONFIRMED, so.getStatus(),
                    "Vendor package " + so.getSubOrderNumber() + " must transition to CONFIRMED");
        }

        // Assert tracking event added
        List<OrderTracking> trackings = orderTrackingRepository.findByOrderIdOrderByTimestampAsc(placedOrder.getId());
        assertTrue(trackings.stream().anyMatch(t -> t.getStatus() == OrderStatus.CONFIRMED),
                "Order tracking must contain CONFIRMED milestone");

        // Double payment guard: Cannot re-pay or verify already paid order
        assertThrows(BadRequestException.class, () -> paymentService.verifyPayment(buyer.getId(), verifyReq));
    }

    @Test
    @DisplayName("Test 3: Payment failure handling: verification failure marks FAILED, Order remains PLACED for retry")
    void testPaymentFailureHandlingAndRetry() {
        Product product = createProduct("Failure Flow Item " + System.currentTimeMillis(), new BigDecimal("999.00"), 10, seller1);
        cartService.addToCart(buyer.getId(), new AddToCartRequest(product.getId(), 1));
        OrderDto placedOrder = orderService.createOrder(buyer.getId(), new CreateOrderRequest(address.getId(), "CARD"));

        // 1. Simulate gateway failure: verify with success = false
        String failedTxn = "TXN_FAILED_" + System.currentTimeMillis();
        PaymentVerificationRequest failReq = new PaymentVerificationRequest(placedOrder.getId(), failedTxn, false);
        PaymentResponse failResponse = paymentService.verifyPayment(buyer.getId(), failReq);

        assertEquals(PaymentStatus.FAILED, failResponse.getStatus());

        // Verify order status in DB: PaymentStatus is FAILED, but OrderStatus MUST REMAIN PLACED!
        Order failedOrder = orderRepository.findById(placedOrder.getId()).orElseThrow();
        assertEquals(PaymentStatus.FAILED, failedOrder.getPaymentStatus(), "Payment status must be marked FAILED");
        assertEquals(OrderStatus.PLACED, failedOrder.getOrderStatus(), "CRITICAL: Order status must remain PLACED to allow retry!");

        // SubOrders remain in PLACED state
        List<SubOrder> subOrders = subOrderRepository.findByOrderIdOrderByCreatedAtAsc(placedOrder.getId());
        assertTrue(subOrders.stream().allMatch(so -> so.getStatus() == OrderStatus.PLACED));

        // 2. Buyer re-attempts payment successfully
        String retryTxn = "TXN_RETRY_SUCCESS_" + System.currentTimeMillis();
        PaymentVerificationRequest retryReq = new PaymentVerificationRequest(placedOrder.getId(), retryTxn, true);
        PaymentResponse retryResponse = paymentService.verifyPayment(buyer.getId(), retryReq);

        assertEquals(PaymentStatus.PAID, retryResponse.getStatus());

        // Verify final order state after successful retry
        Order retriedOrder = orderRepository.findById(placedOrder.getId()).orElseThrow();
        assertEquals(PaymentStatus.PAID, retriedOrder.getPaymentStatus());
        assertEquals(OrderStatus.CONFIRMED, retriedOrder.getOrderStatus());
        assertEquals(retryTxn, retriedOrder.getPaymentTransactionId());

        // All suborders now transition to CONFIRMED
        List<SubOrder> confirmedSubOrders = subOrderRepository.findByOrderIdOrderByCreatedAtAsc(placedOrder.getId());
        assertTrue(confirmedSubOrders.stream().allMatch(so -> so.getStatus() == OrderStatus.CONFIRMED));
    }

    @Test
    @DisplayName("Test 4: Order cancellation: verified inventory restoration (restoreStock) and refund status (REFUNDED)")
    void testOrderCancellationRestoresInventoryAndRefundsPayment() {
        int initialStock = 15;
        int orderedQty = 4;
        Product product = createProduct("Cancellation Item " + System.currentTimeMillis(), new BigDecimal("1500.00"), initialStock, seller1);

        cartService.addToCart(buyer.getId(), new AddToCartRequest(product.getId(), orderedQty));
        OrderDto placedOrder = orderService.createOrder(buyer.getId(), new CreateOrderRequest(address.getId(), "UPI"));

        // Verify stock is decremented to 11
        Product afterOrderProduct = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(initialStock - orderedQty, afterOrderProduct.getStock(), "Stock must be 11 after order placement");

        // Pay for order
        String txnId = "TXN_PAID_BEFORE_CANCEL_" + System.currentTimeMillis();
        paymentService.verifyPayment(buyer.getId(), new PaymentVerificationRequest(placedOrder.getId(), txnId, true));

        Order paidOrder = orderRepository.findById(placedOrder.getId()).orElseThrow();
        assertEquals(PaymentStatus.PAID, paidOrder.getPaymentStatus());
        assertEquals(OrderStatus.CONFIRMED, paidOrder.getOrderStatus());

        // Cancel order as buyer
        OrderDto cancelledDto = orderService.cancelOrder(placedOrder.getId(), buyer.getId(), "Found lower price", false);

        // 1. Assert order status and payment status in DTO and Database
        assertEquals(OrderStatus.CANCELLED, cancelledDto.getOrderStatus());
        assertEquals(PaymentStatus.REFUNDED, cancelledDto.getPaymentStatus(), "Payment status must be updated to REFUNDED");

        Order dbOrder = orderRepository.findById(placedOrder.getId()).orElseThrow();
        assertEquals(OrderStatus.CANCELLED, dbOrder.getOrderStatus());
        assertEquals(PaymentStatus.REFUNDED, dbOrder.getPaymentStatus());
        assertEquals("Found lower price", dbOrder.getCancellationReason());

        // 2. CRITICAL: Assert inventory restoration in database
        Product restoredProduct = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(initialStock, restoredProduct.getStock(), "CRITICAL: Product stock MUST be fully restored to initial value (15)!");

        // 3. Assert all SubOrders transitioned to CANCELLED
        List<SubOrder> subOrders = subOrderRepository.findByOrderIdOrderByCreatedAtAsc(placedOrder.getId());
        assertTrue(subOrders.stream().allMatch(so -> so.getStatus() == OrderStatus.CANCELLED),
                "All sub-order packages must transition to CANCELLED");

        // 4. Guards: Cannot pay or cancel already cancelled order
        assertThrows(BadRequestException.class, () ->
                paymentService.createPaymentIntent(buyer.getId(), new PaymentIntentRequest(placedOrder.getId()))
        );
        assertThrows(BadRequestException.class, () ->
                orderService.cancelOrder(placedOrder.getId(), buyer.getId(), "Cancel again", false)
        );
    }

    // =========================================================================
    // Test Group: HMAC-SHA256 Signature Verification & Gateways
    // =========================================================================

    private static final String TEST_KEY_SECRET = "test_secret_shopkartSandbox2026";
    private static final String TEST_WEBHOOK_SECRET = "whsec_test_secret123";

    private String calculateHmac(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKey);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            String h = Integer.toHexString(0xff & b);
            if (h.length() == 1) hex.append('0');
            hex.append(h);
        }
        return hex.toString();
    }

    @Test
    @DisplayName("Test 5: verifyRazorpaySignature accepts valid HMAC-SHA256 signature")
    void testVerifyRazorpaySignature_Valid() throws Exception {
        String orderId = "order_rzp_123456";
        String paymentId = "pay_rzp_987654";
        String payload = orderId + "|" + paymentId;
        String validSignature = calculateHmac(payload, TEST_KEY_SECRET);

        assertTrue(paymentService.verifyRazorpaySignature(orderId, paymentId, validSignature));
    }

    @Test
    @DisplayName("Test 6: verifyRazorpaySignature rejects tampered signature")
    void testVerifyRazorpaySignature_TamperedSignature() throws Exception {
        String orderId = "order_rzp_123456";
        String paymentId = "pay_rzp_987654";
        String validSignature = calculateHmac(orderId + "|" + paymentId, TEST_KEY_SECRET);

        // Corrupt one character
        char corruptChar = validSignature.charAt(10) == 'a' ? 'b' : 'a';
        String tamperedSignature = validSignature.substring(0, 10) + corruptChar + validSignature.substring(11);

        assertFalse(paymentService.verifyRazorpaySignature(orderId, paymentId, tamperedSignature));
    }

    @Test
    @DisplayName("Test 7: verifyRazorpaySignature rejects forged payload (altered orderId or paymentId)")
    void testVerifyRazorpaySignature_ForgedPayload() throws Exception {
        String validSignature = calculateHmac("order_100|pay_200", TEST_KEY_SECRET);

        assertFalse(paymentService.verifyRazorpaySignature("order_999", "pay_200", validSignature));
        assertFalse(paymentService.verifyRazorpaySignature("order_100", "pay_888", validSignature));
    }

    @Test
    @DisplayName("Test 8: verifyRazorpaySignature rejects null, empty, and blank inputs")
    void testVerifyRazorpaySignature_NullAndEmptyInputs() throws Exception {
        String validSignature = calculateHmac("order_1|pay_1", TEST_KEY_SECRET);

        assertFalse(paymentService.verifyRazorpaySignature("order_1", "pay_1", null));
        assertFalse(paymentService.verifyRazorpaySignature("order_1", "pay_1", ""));
        assertFalse(paymentService.verifyRazorpaySignature("order_1", "pay_1", "   "));
        assertFalse(paymentService.verifyRazorpaySignature(null, "pay_1", validSignature));
        assertFalse(paymentService.verifyRazorpaySignature("   ", "pay_1", validSignature));
        assertFalse(paymentService.verifyRazorpaySignature("order_1", null, validSignature));
        assertFalse(paymentService.verifyRazorpaySignature("order_1", "   ", validSignature));
    }

    @Test
    @DisplayName("Test 9: verifyWebhookSignature accepts valid HMAC-SHA256 signature on JSON payload")
    void testVerifyWebhookSignature_Valid() throws Exception {
        String payload = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_test123\"}}}}";
        String validSignature = calculateHmac(payload, TEST_WEBHOOK_SECRET);

        assertTrue(paymentService.verifyWebhookSignature(payload, validSignature));
    }

    @Test
    @DisplayName("Test 10: verifyWebhookSignature rejects tampered signature and forged payload")
    void testVerifyWebhookSignature_TamperedAndForged() throws Exception {
        String payload = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_test123\"}}}}";
        String validSignature = calculateHmac(payload, TEST_WEBHOOK_SECRET);
        String tamperedSignature = validSignature.substring(0, validSignature.length() - 2) + "ff";

        assertFalse(paymentService.verifyWebhookSignature(payload, tamperedSignature));
        assertFalse(paymentService.verifyWebhookSignature(payload + " ", validSignature));
        assertFalse(paymentService.verifyWebhookSignature("{\"event\":\"payment.failed\"}", validSignature));
    }

    @Test
    @DisplayName("Test 11: verifyWebhookSignature rejects null, empty, and blank payloads and signatures")
    void testVerifyWebhookSignature_NullAndEmptyInputs() {
        assertFalse(paymentService.verifyWebhookSignature("payload", null));
        assertFalse(paymentService.verifyWebhookSignature("payload", ""));
        assertFalse(paymentService.verifyWebhookSignature("payload", "   "));
        assertFalse(paymentService.verifyWebhookSignature(null, "valid_sig"));
        assertFalse(paymentService.verifyWebhookSignature("", "valid_sig"));
        assertFalse(paymentService.verifyWebhookSignature("   ", "valid_sig"));
    }

    @Test
    @DisplayName("Test 12: verifyPayment with valid signature transitions order to PAID and CONFIRMED")
    void testVerifyPayment_ValidSignatureFlow() throws Exception {
        Product product = createProduct("Sig Item " + System.currentTimeMillis(), new BigDecimal("500.00"), 10, seller1);
        cartService.addToCart(buyer.getId(), new AddToCartRequest(product.getId(), 1));
        OrderDto order = orderService.createOrder(buyer.getId(), new CreateOrderRequest(address.getId(), "CARD"));

        String txnId = "TXN_SIG_OK_" + System.currentTimeMillis();
        String validSignature = calculateHmac(order.getId() + "|" + txnId, TEST_KEY_SECRET);

        PaymentVerificationRequest req = new PaymentVerificationRequest(order.getId(), txnId, true);
        req.setSignature(validSignature);

        PaymentResponse res = paymentService.verifyPayment(buyer.getId(), req);
        assertEquals(PaymentStatus.PAID, res.getStatus());

        Order dbOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(PaymentStatus.PAID, dbOrder.getPaymentStatus());
        assertEquals(OrderStatus.CONFIRMED, dbOrder.getOrderStatus());
    }

    @Test
    @DisplayName("Test 13: verifyPayment with tampered signature throws BadRequestException and leaves order PLACED/PENDING")
    void testVerifyPayment_TamperedSignatureRejection() throws Exception {
        Product product = createProduct("Tamper Item " + System.currentTimeMillis(), new BigDecimal("500.00"), 10, seller1);
        cartService.addToCart(buyer.getId(), new AddToCartRequest(product.getId(), 1));
        OrderDto order = orderService.createOrder(buyer.getId(), new CreateOrderRequest(address.getId(), "CARD"));

        String txnId = "TXN_SIG_BAD_" + System.currentTimeMillis();
        PaymentVerificationRequest req = new PaymentVerificationRequest(order.getId(), txnId, true);
        req.setSignature("invalid_forged_signature_hex_value");

        assertThrows(BadRequestException.class, () -> paymentService.verifyPayment(buyer.getId(), req));

        Order dbOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(PaymentStatus.PENDING, dbOrder.getPaymentStatus());
        assertEquals(OrderStatus.PLACED, dbOrder.getOrderStatus());
    }
}
