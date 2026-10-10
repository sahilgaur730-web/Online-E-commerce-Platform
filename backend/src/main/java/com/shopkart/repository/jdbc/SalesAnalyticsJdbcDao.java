package com.shopkart.repository.jdbc;

import com.shopkart.dto.SalesReportDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Raw JDBC DAO implementing complex native SQL reporting queries.
 * Demonstrates low-level JDBC API mastery using java.sql.* exclusively:
 * DataSource connection management, PreparedStatements with parameterized placeholders,
 * ResultSets with manual column extraction, try-with-resources, and SQLException handling.
 */
@Repository
public class SalesAnalyticsJdbcDao {

    private static final Logger log = LoggerFactory.getLogger(SalesAnalyticsJdbcDao.class);

    private final DataSource dataSource;

    public SalesAnalyticsJdbcDao(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Executes native SQL queries via raw java.sql.* to construct a comprehensive sales analytics report.
     *
     * @return SalesReportDTO containing overall sales aggregates, category breakdown, and top selling products.
     */
    public SalesReportDTO generateSalesReport() {
        long startTime = System.currentTimeMillis();

        long totalOrders = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal avgOrderValue = BigDecimal.ZERO;
        List<SalesReportDTO.CategorySalesDTO> categorySales = new ArrayList<>();
        List<SalesReportDTO.TopSellingProductDTO> topProducts = new ArrayList<>();

        // Execute raw JDBC queries within a single connection for high-throughput efficiency
        String summarySql = "SELECT COUNT(o.id) AS total_orders, " +
                "COALESCE(SUM(o.final_amount), 0) AS total_revenue, " +
                "COALESCE(AVG(o.final_amount), 0) AS avg_order_val " +
                "FROM orders o " +
                "WHERE o.order_status <> ?";

        String categorySql = "SELECT c.id AS cat_id, c.name AS cat_name, " +
                "COALESCE(SUM(oi.quantity), 0) AS units_sold, " +
                "COALESCE(SUM(oi.subtotal), 0) AS total_cat_revenue " +
                "FROM categories c " +
                "JOIN products p ON p.category_id = c.id " +
                "JOIN order_items oi ON oi.product_id = p.id " +
                "JOIN orders o ON o.id = oi.order_id " +
                "WHERE o.order_status <> ? " +
                "GROUP BY c.id, c.name " +
                "ORDER BY total_cat_revenue DESC";

        String topProductsSql = "SELECT oi.product_id, oi.product_name, " +
                "SUM(oi.quantity) AS total_units, " +
                "SUM(oi.subtotal) AS total_sales " +
                "FROM order_items oi " +
                "JOIN orders o ON o.id = oi.order_id " +
                "WHERE o.order_status <> ? " +
                "GROUP BY oi.product_id, oi.product_name " +
                "ORDER BY total_units DESC, total_sales DESC " +
                "LIMIT ?";

        try (Connection connection = dataSource.getConnection()) {
            // Query 1: Overall Order Totals (ignoring CANCELLED orders)
            try (PreparedStatement summaryStmt = connection.prepareStatement(summarySql)) {
                summaryStmt.setString(1, "CANCELLED");
                try (ResultSet rs = summaryStmt.executeQuery()) {
                    if (rs.next()) {
                        totalOrders = rs.getLong("total_orders");
                        BigDecimal rev = rs.getBigDecimal("total_revenue");
                        totalRevenue = (rev != null) ? rev.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                        BigDecimal avg = rs.getBigDecimal("avg_order_val");
                        avgOrderValue = (avg != null) ? avg.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                    }
                }
            }

            // Query 2: Aggregate Revenue by Category
            try (PreparedStatement categoryStmt = connection.prepareStatement(categorySql)) {
                categoryStmt.setString(1, "CANCELLED");
                try (ResultSet rs = categoryStmt.executeQuery()) {
                    while (rs.next()) {
                        Long catId = rs.getObject("cat_id") != null ? rs.getLong("cat_id") : null;
                        String catName = rs.getString("cat_name");
                        long units = rs.getLong("units_sold");
                        BigDecimal rev = rs.getBigDecimal("total_cat_revenue");
                        BigDecimal safeRev = (rev != null) ? rev.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

                        categorySales.add(new SalesReportDTO.CategorySalesDTO(catId, catName, units, safeRev));
                    }
                }
            }

            // Query 3: Top 5 Selling Products
            try (PreparedStatement topStmt = connection.prepareStatement(topProductsSql)) {
                topStmt.setString(1, "CANCELLED");
                topStmt.setInt(2, 5);
                try (ResultSet rs = topStmt.executeQuery()) {
                    while (rs.next()) {
                        Long prodId = rs.getObject("product_id") != null ? rs.getLong("product_id") : null;
                        String prodName = rs.getString("product_name");
                        long units = rs.getLong("total_units");
                        BigDecimal sales = rs.getBigDecimal("total_sales");
                        BigDecimal safeSales = (sales != null) ? sales.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

                        topProducts.add(new SalesReportDTO.TopSellingProductDTO(prodId, prodName, units, safeSales));
                    }
                }
            }
        } catch (SQLException e) {
            log.error("SQLException while executing raw JDBC sales analytics report", e);
            throw new RuntimeException("Database error executing JDBC sales summary: " + e.getMessage(), e);
        }

        long executionTimeMs = System.currentTimeMillis() - startTime;
        String generatedAt = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        return new SalesReportDTO(
                totalOrders,
                totalRevenue,
                avgOrderValue,
                categorySales,
                topProducts,
                generatedAt,
                executionTimeMs
        );
    }
}
