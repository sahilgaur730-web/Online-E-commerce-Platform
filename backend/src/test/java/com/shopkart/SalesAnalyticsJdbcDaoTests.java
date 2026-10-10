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
        SalesReportDTO baseline = salesAnalyticsJdbcDao.generateSalesReport(100);

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
        SalesReportDTO report = salesAnalyticsJdbcDao.generateSalesReport(100);
        assertNotNull(report);
        assertEquals(baseline.getTotalOrders() + 1, report.getTotalOrders(),
                "Only the non-cancelled order must increment totalOrders");
        assertEquals(0, baseline.getTotalRevenue().add(new BigDecimal("3000.00")).compareTo(report.getTotalRevenue()),
                "Only the non-cancelled order amount (3000.00) must be added to totalRevenue");

        // Confirm category breakdown has electronics with sold units
        boolean foundElectronics = report.getCategoryBreakdown().stream()
                .anyMatch(c -> c.getCategoryName().equalsIgnoreCase("Electronics") && c.getUnitsSold() >= 2);
        assertTrue(foundElectronics, "Expected Electronics category to include sold items via JDBC query");

        // Confirm top selling products has our test item with exact non-cancelled units (2) and revenue (3000.00)
        SalesReportDTO.TopSellingProductDTO seededProdStats = report.getTopSellingProducts().stream()
                .filter(p -> p.getProductId().equals(savedProduct.getId()))
                .findFirst()
                .orElse(null);
        assertNotNull(seededProdStats, "Expected seeded product in raw JDBC top selling items");
        assertEquals(2L, seededProdStats.getUnitsSold(), "Cancelled order units must be excluded from product aggregation");
        assertEquals(0, new BigDecimal("3000.00").compareTo(seededProdStats.getTotalRevenue()),
                "Cancelled order subtotal must be excluded from product revenue");

        // Verify countOrdersByStatus with valid and boundary inputs
        assertTrue(salesAnalyticsJdbcDao.countOrdersByStatus("CONFIRMED") >= 1);
        assertTrue(salesAnalyticsJdbcDao.countOrdersByStatus("CANCELLED") >= 1);
        assertEquals(0, salesAnalyticsJdbcDao.countOrdersByStatus(null));
        assertEquals(0, salesAnalyticsJdbcDao.countOrdersByStatus(""));
        assertEquals(0, salesAnalyticsJdbcDao.countOrdersByStatus("   "));

        // Verify topLimit parameter boundaries
        SalesReportDTO top1Report = salesAnalyticsJdbcDao.generateSalesReport(1);
        assertTrue(top1Report.getTopSellingProducts().size() <= 1);
        SalesReportDTO negativeLimitReport = salesAnalyticsJdbcDao.generateSalesReport(-3);
        assertTrue(negativeLimitReport.getTopSellingProducts().size() <= 5);
    }

    @Test
    @DisplayName("Verify Flyway V1__init_schema.sql migration executed cleanly via raw JDBC")
    void testFlywayMigrationHistoryViaRawJdbc() throws SQLException {
        String sql = "SELECT \"version\", \"description\", \"success\" FROM \"flyway_schema_history\" WHERE \"version\" = ?";
        try (Connection connection = dataSource.getConnection();
             java.sql.PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, "1");
            try (java.sql.ResultSet rs = stmt.executeQuery()) {
                assertTrue(rs.next(), "Expected Flyway V1 migration record in flyway_schema_history");
                assertEquals("1", rs.getString("version"));
                assertEquals("init schema", rs.getString("description"));
                assertTrue(rs.getBoolean("success"));
            }
        }
    }

    @Test
    @DisplayName("Verify Admin REST endpoint GET /api/admin/reports/jdbc-sales-summary and RBAC protection")
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

        mockMvc.perform(get("/api/admin/reports/jdbc-sales-summary?topLimit=1")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.topSellingProducts.length()").value(org.hamcrest.Matchers.lessThanOrEqualTo(1)));

        // Non-admin buyer must be rejected with 403 Forbidden
        User buyer = userRepository.findByEmail("buyer@shopkart.com").orElseThrow();
        String buyerToken = jwtUtils.generateToken(UserPrincipal.create(buyer));
        mockMvc.perform(get("/api/admin/reports/jdbc-sales-summary")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
