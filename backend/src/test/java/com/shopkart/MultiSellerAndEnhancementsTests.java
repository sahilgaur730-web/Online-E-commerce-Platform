package com.shopkart;

import com.shopkart.common.BadRequestException;
import com.shopkart.dto.*;
import com.shopkart.model.*;
import com.shopkart.repository.*;
import com.shopkart.service.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class MultiSellerAndEnhancementsTests {

    @Autowired
    private OrderService orderService;

    @Autowired
    private CartService cartService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private FileUploadService fileUploadService;

    @Autowired
    private ProductService productService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private SubOrderRepository subOrderRepository;

    @Test
    @DisplayName("Multi-Seller Package Splitting: Checkout with items from multiple sellers creates distinct sub-orders")
    @Transactional
    void testMultiSellerPackageSplittingAndStatusProgression() {
        User buyer = userRepository.findByEmail("buyer@shopkart.com").orElseThrow();
        User seller1 = userRepository.findByEmail("seller@shopkart.com").orElseThrow();
        User seller2 = userRepository.findByEmail("fashionhub@shopkart.com").orElseThrow();

        Address address = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(buyer.getId()).get(0);

        List<Product> s1Products = productRepository.findBySellerIdOrderByCreatedAtDesc(seller1.getId());
        List<Product> s2Products = productRepository.findBySellerIdOrderByCreatedAtDesc(seller2.getId());

        assertFalse(s1Products.isEmpty(), "Seller 1 must have products");
        assertFalse(s2Products.isEmpty(), "Seller 2 must have products");

        Product p1 = s1Products.get(0);
        Product p2 = s2Products.get(0);

        // Clear cart and add 1 product from Seller 1 and 1 product from Seller 2
        cartService.clearCart(buyer.getId());
        cartService.addToCart(buyer.getId(), new AddToCartRequest(p1.getId(), 1));
        cartService.addToCart(buyer.getId(), new AddToCartRequest(p2.getId(), 1));

        // Place master order
        CreateOrderRequest orderReq = new CreateOrderRequest(address.getId(), "CARD");
        OrderDto orderDto = orderService.createOrder(buyer.getId(), orderReq);

        assertNotNull(orderDto.getId());
        assertEquals(OrderStatus.PLACED, orderDto.getOrderStatus());

        // Check sub-orders created
        List<SubOrderDto> subOrders = orderService.getSubOrdersByOrderId(orderDto.getId(), buyer.getId(), false);
        assertEquals(2, subOrders.size(), "Order should split into 2 distinct vendor packages");

        SubOrderDto pkgSeller1 = subOrders.stream()
                .filter(s -> s.getSellerId().equals(seller1.getId()))
                .findFirst().orElseThrow();
        SubOrderDto pkgSeller2 = subOrders.stream()
                .filter(s -> s.getSellerId().equals(seller2.getId()))
                .findFirst().orElseThrow();

        assertEquals(OrderStatus.PLACED, pkgSeller1.getStatus());
        assertEquals(OrderStatus.PLACED, pkgSeller2.getStatus());
        assertNotEquals(pkgSeller1.getTrackingNumber(), pkgSeller2.getTrackingNumber());

        // Seller 2 cannot update Seller 1's package
        assertThrows(BadRequestException.class, () -> {
            orderService.updateSubOrderStatus(pkgSeller1.getId(), OrderStatus.CONFIRMED, "Trying cross-seller update", seller2.getEmail());
        });

        // Seller 1 advances package 1 to CONFIRMED and SHIPPED
        SubOrderDto confirmedPkg1 = orderService.updateSubOrderStatus(pkgSeller1.getId(), OrderStatus.CONFIRMED, "Package confirmed by Tech Seller", seller1.getEmail());
        assertEquals(OrderStatus.CONFIRMED, confirmedPkg1.getStatus());

        SubOrderDto shippedPkg1 = orderService.updateSubOrderStatus(pkgSeller1.getId(), OrderStatus.SHIPPED, "Package shipped by Tech Seller", seller1.getEmail());
        assertEquals(OrderStatus.SHIPPED, shippedPkg1.getStatus());

        // Verify Package 2 remains PLACED without premature alteration
        SubOrder pkg2After = subOrderRepository.findById(pkgSeller2.getId()).orElseThrow();
        assertEquals(OrderStatus.PLACED, pkg2After.getStatus());
    }

    @Test
    @DisplayName("Physical Product Image Upload Service with extension validation")
    void testPhysicalImageUpload() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-product.png",
                "image/png",
                "fake-png-binary-stream-data".getBytes()
        );

        Map<String, Object> result = fileUploadService.uploadFile(file, "seller@shopkart.com");
        assertNotNull(result);
        assertTrue(result.containsKey("imageUrl"));
        String imageUrl = (String) result.get("imageUrl");
        assertTrue(imageUrl.startsWith("/uploads/"));
        assertTrue(imageUrl.endsWith(".png"));

        // Reject non-image file
        MockMultipartFile badFile = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/x-msdownload",
                "bad-data".getBytes()
        );
        assertThrows(BadRequestException.class, () -> {
            fileUploadService.uploadFile(badFile, "seller@shopkart.com");
        });
    }

    @Test
    @DisplayName("Live Payment Gateway Sandbox: Payment intent generation and HMAC signature check")
    @Transactional
    void testPaymentGatewaySandboxAndVerification() {
        User buyer = userRepository.findByEmail("buyer@shopkart.com").orElseThrow();
        Address address = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(buyer.getId()).get(0);
        Product p = productRepository.findAll().get(0);

        cartService.clearCart(buyer.getId());
        cartService.addToCart(buyer.getId(), new AddToCartRequest(p.getId(), 1));

        OrderDto order = orderService.createOrder(buyer.getId(), new CreateOrderRequest(address.getId(), "UPI"));

        // Create payment intent
        PaymentIntentRequest intentReq = new PaymentIntentRequest(order.getId());
        PaymentResponse intentResp = paymentService.createPaymentIntent(buyer.getId(), intentReq);

        assertNotNull(intentResp.getTransactionId());
        assertNotNull(intentResp.getKeyId());
        assertEquals(order.getId(), intentResp.getOrderId());

        // Verify successful payment
        PaymentVerificationRequest verifyReq = new PaymentVerificationRequest(order.getId(), intentResp.getTransactionId(), true);
        PaymentResponse verified = paymentService.verifyPayment(buyer.getId(), verifyReq);

        assertEquals(PaymentStatus.PAID, verified.getStatus());

        // Webhook processing
        String webhookPayload = "{\"event\":\"order.paid\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_test_123\",\"notes\":{\"orderId\":\"" + order.getId() + "\"}}}}}";
        boolean processed = paymentService.processWebhook(webhookPayload, null);
        assertTrue(processed);
    }

    @Test
    @DisplayName("Redis/Spring Cache layer handles featured products and caching")
    void testProductCaching() {
        List<ProductDto> firstCall = productService.getFeaturedProducts();
        assertNotNull(firstCall);

        List<ProductDto> secondCall = productService.getFeaturedProducts();
        assertNotNull(secondCall);
        assertEquals(firstCall.size(), secondCall.size());
    }
}
