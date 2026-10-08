package com.shopkart;

import com.shopkart.common.BadRequestException;
import com.shopkart.dto.*;
import com.shopkart.model.Role;
import com.shopkart.service.AuthService;
import com.shopkart.service.DashboardService;
import com.shopkart.service.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AuthAndCatalogTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private ProductService productService;

    @Autowired
    private DashboardService dashboardService;

    @Test
    @DisplayName("User registration and login flow")
    @Transactional
    void testAuthRegistrationAndLogin() {
        String testEmail = "testuser" + System.currentTimeMillis() + "@shopkart.com";
        RegisterRequest regReq = new RegisterRequest();
        regReq.setName("Test Buyer");
        regReq.setEmail(testEmail);
        regReq.setPassword("secret123");
        regReq.setPhone("9988776655");
        regReq.setRole(Role.BUYER);

        AuthResponse regRes = authService.register(regReq);
        assertNotNull(regRes.getToken());
        assertEquals(Role.BUYER, regRes.getRole());
        assertEquals(testEmail, regRes.getEmail());

        // Duplicate registration should throw BadRequestException
        assertThrows(BadRequestException.class, () -> {
            authService.register(regReq);
        });

        // Valid Login
        LoginRequest loginReq = new LoginRequest(testEmail, "secret123");
        AuthResponse loginRes = authService.login(loginReq);
        assertNotNull(loginRes.getToken());
        assertEquals(regRes.getId(), loginRes.getId());

        // Invalid Password should throw BadCredentialsException
        LoginRequest badLogin = new LoginRequest(testEmail, "wrongpassword");
        assertThrows(BadCredentialsException.class, () -> {
            authService.login(badLogin);
        });
    }

    @Test
    @DisplayName("Product catalog search and filtering")
    void testProductCatalogSearch() {
        Page<ProductDto> searchIphone = productService.searchProducts(
                "iPhone", null, null, null, null, null, "popularity", "desc", 0, 10
        );
        assertTrue(searchIphone.getTotalElements() >= 1, "Should find iPhone 15");
        assertTrue(searchIphone.getContent().get(0).getTitle().contains("iPhone"));

        // Price range filter
        Page<ProductDto> priceFilter = productService.searchProducts(
                null, null, null, new BigDecimal("2000"), new BigDecimal("10000"), null, "price_asc", "asc", 0, 10
        );
        for (ProductDto p : priceFilter.getContent()) {
            assertTrue(p.getPrice().compareTo(new BigDecimal("2000")) >= 0);
            assertTrue(p.getPrice().compareTo(new BigDecimal("10000")) <= 0);
        }
    }

    @Test
    @DisplayName("Admin dashboard metric calculations")
    void testAdminDashboardMetrics() {
        DashboardStatsDto dashboard = dashboardService.getAdminDashboard();
        assertTrue(dashboard.getTotalUsers() >= 4, "Should have seeded users");
        assertTrue(dashboard.getTotalProducts() >= 10, "Should have seeded products");
        assertNotNull(dashboard.getCategoryProductCount());
        assertFalse(dashboard.getCategoryProductCount().isEmpty());
    }
}
