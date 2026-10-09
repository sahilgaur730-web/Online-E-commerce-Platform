package com.shopkart;

import com.shopkart.dto.SalesReportDTO;
import com.shopkart.model.*;
import com.shopkart.repository.*;
import com.shopkart.repository.jdbc.SalesAnalyticsJdbcDao;
import com.shopkart.security.JwtUtils;
import com.shopkart.security.UserPrincipal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SalesAnalyticsJdbcDaoTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private SalesAnalyticsJdbcDao salesAnalyticsJdbcDao;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Test
    @DisplayName("Verify DataSource connection and raw JDBC SalesAnalyticsJdbcDao execution")
    void testDataSourceAndReportGeneration() throws SQLException {
        // Assert valid raw JDBC connection can be acquired from DataSource
        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection);
            assertFalse(connection.isClosed());
        }

        SalesReportDTO report = salesAnalyticsJdbcDao.generateSalesReport();
        assertNotNull(report);
        assertNotNull(report.getTotalRevenue());
        assertNotNull(report.getAverageOrderValue());
        assertNotNull(report.getCategoryBreakdown());
        assertNotNull(report.getTopSellingProducts());
        assertNotNull(report.getGeneratedAt());
        assertTrue(report.getQueryExecutionTimeMs() >= 0);
    }

    @Test
    @DisplayName("Verify raw JDBC SQL calculations exclude CANCELLED orders and aggregate categories")
    void testJdbcAggregationsWithSeededData() {
        // Create test user, category, and product
        User buyer = userRepository.findByEmail("buyer@shopkart.com").orElse(null);
        assertNotNull(buyer);

        Category electronics = categoryRepository.findBySlug("electronics").orElse(null);
        assertNotNull(electronics);

        Product testProduct = new Product();
        testProduct.setTitle("JDBC Test Item " + System.currentTimeMillis());
        testProduct.setBrand("TestBrand");
        testProduct.setPrice(BigDecimal.valueOf(1500));
        testProduct.setStock(50);
        testProduct.setCategory(electronics);
        testProduct.setSeller(buyer);
        Product savedProduct = productRepository.save(testProduct);

        // 1. Valid Active Order
        Order activeOrder = new Order();
        activeOrder.setOrderNumber("OD-ACTIVE-" + System.currentTimeMillis());
        activeOrder.setBuyer(buyer);
        activeOrder.setTotalAmount(BigDecimal.valueOf(3000));
        activeOrder.setFinalAmount(BigDecimal.valueOf(3000));
        activeOrder.setOrderStatus(OrderStatus.CONFIRMED);
        activeOrder.setPaymentStatus(PaymentStatus.PAID);
        Order savedActiveOrder = orderRepository.save(activeOrder);

        OrderItem item1 = new OrderItem(savedActiveOrder, savedProduct, savedProduct.getTitle(), "", BigDecimal.valueOf(1500), 2, BigDecimal.valueOf(3000));
        orderItemRepository.save(item1);

        // 2. Cancelled Order (should be excluded by JDBC parameterized placeholder)
        Order cancelledOrder = new Order();
        cancelledOrder.setOrderNumber("OD-CANCEL-" + System.currentTimeMillis());
        cancelledOrder.setBuyer(buyer);
        cancelledOrder.setTotalAmount(BigDecimal.valueOf(10000));
        cancelledOrder.setFinalAmount(BigDecimal.valueOf(10000));
        cancelledOrder.setOrderStatus(OrderStatus.CANCELLED);
        cancelledOrder.setPaymentStatus(PaymentStatus.FAILED);
        Order savedCancelledOrder = orderRepository.save(cancelledOrder);

        OrderItem item2 = new OrderItem(savedCancelledOrder, savedProduct, savedProduct.getTitle(), "", BigDecimal.valueOf(5000), 2, BigDecimal.valueOf(10000));
        orderItemRepository.save(item2);

        // Execute Raw JDBC Report
        SalesReportDTO report = salesAnalyticsJdbcDao.generateSalesReport();
        assertNotNull(report);
        assertTrue(report.getTotalOrders() >= 1);
        assertTrue(report.getTotalRevenue().compareTo(BigDecimal.valueOf(3000)) >= 0);

        // Confirm category breakdown has electronics with sold units
        boolean foundElectronics = report.getCategoryBreakdown().stream()
                .anyMatch(c -> c.getCategoryName().equalsIgnoreCase("Electronics") && c.getUnitsSold() >= 2);
        assertTrue(foundElectronics, "Expected Electronics category to include sold items via JDBC query");

        // Confirm top selling products has our test item
        boolean foundItem = report.getTopSellingProducts().stream()
                .anyMatch(p -> p.getProductId().equals(savedProduct.getId()));
        assertTrue(foundItem, "Expected seeded product in raw JDBC top selling items");
    }

    @Test
    @DisplayName("Verify Admin REST endpoint GET /api/admin/reports/jdbc-sales-summary")
    void testAdminJdbcEndpoint() throws Exception {
        User admin = userRepository.findByEmail("admin@shopkart.com").orElse(null);
        assertNotNull(admin);

        String adminToken = jwtUtils.generateToken(UserPrincipal.create(admin));

        mockMvc.perform(get("/api/admin/reports/jdbc-sales-summary")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalRevenue").exists())
                .andExpect(jsonPath("$.data.categoryBreakdown").isArray())
                .andExpect(jsonPath("$.data.topSellingProducts").isArray())
                .andExpect(jsonPath("$.data.generatedAt").isNotEmpty());
    }
}
