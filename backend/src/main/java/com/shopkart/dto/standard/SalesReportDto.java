package com.shopkart.dto.standard;

import com.shopkart.dto.SalesReportDTO;
import java.math.BigDecimal;
import java.util.List;

/**
 * Normalized DTO representing sales analytics report data with standard PascalCase naming.
 * Extends {@link SalesReportDTO} for seamless compatibility across the DTO layer.
 */
public class SalesReportDto extends SalesReportDTO {

    public SalesReportDto() {
        super();
    }

    public SalesReportDto(long totalOrders, BigDecimal totalRevenue, BigDecimal averageOrderValue,
                          List<CategorySalesDTO> categoryBreakdown, List<TopSellingProductDTO> topSellingProducts,
                          String generatedAt, long queryExecutionTimeMs) {
        super(totalOrders, totalRevenue, averageOrderValue, categoryBreakdown, topSellingProducts,
              generatedAt, queryExecutionTimeMs);
    }

    public static class CategorySalesDto extends SalesReportDTO.CategorySalesDTO {
        public CategorySalesDto() {
            super();
        }

        public CategorySalesDto(Long categoryId, String categoryName, long unitsSold, BigDecimal totalRevenue) {
            super(categoryId, categoryName, unitsSold, totalRevenue);
        }
    }

    public static class TopSellingProductDto extends SalesReportDTO.TopSellingProductDTO {
        public TopSellingProductDto() {
            super();
        }

        public TopSellingProductDto(Long productId, String productName, long unitsSold, BigDecimal totalRevenue) {
            super(productId, productName, unitsSold, totalRevenue);
        }
    }
}
