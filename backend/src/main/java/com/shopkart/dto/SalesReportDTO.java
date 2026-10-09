package com.shopkart.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class SalesReportDTO {
    private long totalOrders;
    private BigDecimal totalRevenue;
    private BigDecimal averageOrderValue;
    private List<CategorySalesDTO> categoryBreakdown = new ArrayList<>();
    private List<TopSellingProductDTO> topSellingProducts = new ArrayList<>();
    private String generatedAt;
    private long queryExecutionTimeMs;

    public SalesReportDTO() {
    }

    public SalesReportDTO(long totalOrders, BigDecimal totalRevenue, BigDecimal averageOrderValue,
                          List<CategorySalesDTO> categoryBreakdown, List<TopSellingProductDTO> topSellingProducts,
                          String generatedAt, long queryExecutionTimeMs) {
        this.totalOrders = totalOrders;
        this.totalRevenue = totalRevenue;
        this.averageOrderValue = averageOrderValue;
        this.categoryBreakdown = categoryBreakdown;
        this.topSellingProducts = topSellingProducts;
        this.generatedAt = generatedAt;
        this.queryExecutionTimeMs = queryExecutionTimeMs;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public BigDecimal getAverageOrderValue() {
        return averageOrderValue;
    }

    public void setAverageOrderValue(BigDecimal averageOrderValue) {
        this.averageOrderValue = averageOrderValue;
    }

    public List<CategorySalesDTO> getCategoryBreakdown() {
        return categoryBreakdown;
    }

    public void setCategoryBreakdown(List<CategorySalesDTO> categoryBreakdown) {
        this.categoryBreakdown = categoryBreakdown;
    }

    public List<TopSellingProductDTO> getTopSellingProducts() {
        return topSellingProducts;
    }

    public void setTopSellingProducts(List<TopSellingProductDTO> topSellingProducts) {
        this.topSellingProducts = topSellingProducts;
    }

    public String getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(String generatedAt) {
        this.generatedAt = generatedAt;
    }

    public long getQueryExecutionTimeMs() {
        return queryExecutionTimeMs;
    }

    public void setQueryExecutionTimeMs(long queryExecutionTimeMs) {
        this.queryExecutionTimeMs = queryExecutionTimeMs;
    }

    public static class CategorySalesDTO {
        private Long categoryId;
        private String categoryName;
        private long unitsSold;
        private BigDecimal totalRevenue;

        public CategorySalesDTO() {
        }

        public CategorySalesDTO(Long categoryId, String categoryName, long unitsSold, BigDecimal totalRevenue) {
            this.categoryId = categoryId;
            this.categoryName = categoryName;
            this.unitsSold = unitsSold;
            this.totalRevenue = totalRevenue;
        }

        public Long getCategoryId() {
            return categoryId;
        }

        public void setCategoryId(Long categoryId) {
            this.categoryId = categoryId;
        }

        public String getCategoryName() {
            return categoryName;
        }

        public void setCategoryName(String categoryName) {
            this.categoryName = categoryName;
        }

        public long getUnitsSold() {
            return unitsSold;
        }

        public void setUnitsSold(long unitsSold) {
            this.unitsSold = unitsSold;
        }

        public BigDecimal getTotalRevenue() {
            return totalRevenue;
        }

        public void setTotalRevenue(BigDecimal totalRevenue) {
            this.totalRevenue = totalRevenue;
        }
    }

    public static class TopSellingProductDTO {
        private Long productId;
        private String productName;
        private long unitsSold;
        private BigDecimal totalRevenue;

        public TopSellingProductDTO() {
        }

        public TopSellingProductDTO(Long productId, String productName, long unitsSold, BigDecimal totalRevenue) {
            this.productId = productId;
            this.productName = productName;
            this.unitsSold = unitsSold;
            this.totalRevenue = totalRevenue;
        }

        public Long getProductId() {
            return productId;
        }

        public void setProductId(Long productId) {
            this.productId = productId;
        }

        public String getProductName() {
            return productName;
        }

        public void setProductName(String productName) {
            this.productName = productName;
        }

        public long getUnitsSold() {
            return unitsSold;
        }

        public void setUnitsSold(long unitsSold) {
            this.unitsSold = unitsSold;
        }

        public BigDecimal getTotalRevenue() {
            return totalRevenue;
        }

        public void setTotalRevenue(BigDecimal totalRevenue) {
            this.totalRevenue = totalRevenue;
        }
    }
}
