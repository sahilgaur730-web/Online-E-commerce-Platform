package com.shopkart.service;

import com.shopkart.common.BadRequestException;
import com.shopkart.common.ResourceNotFoundException;
import com.shopkart.model.Product;
import com.shopkart.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InventoryService {

    private final ProductRepository productRepository;
    private final AuditService auditService;

    public InventoryService(ProductRepository productRepository, AuditService auditService) {
        this.productRepository = productRepository;
        this.auditService = auditService;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void deductStock(Long productId, int quantity) {
        if (quantity <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        if (product.getStock() < quantity) {
            throw new BadRequestException("Insufficient inventory for product '" + product.getTitle() +
                    "'. Requested: " + quantity + ", Available: " + product.getStock());
        }

        int previousStock = product.getStock();
        int newStock = previousStock - quantity;
        product.setStock(newStock);
        product.setUpdatedAt(LocalDateTime.now());

        productRepository.saveAndFlush(product);

        if (newStock < 5) {
            auditService.log("LOW_STOCK_ALERT", "SYSTEM",
                    "Product " + product.getTitle() + " stock reached critical low: " + newStock,
                    "PRODUCT", product.getId());
        }
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void restoreStock(Long productId, int quantity) {
        if (quantity <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        product.setStock(product.getStock() + quantity);
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.saveAndFlush(product);

        auditService.log("STOCK_RESTORED", "SYSTEM",
                "Restored " + quantity + " units for product " + product.getTitle() + ". Current stock: " + product.getStock(),
                "PRODUCT", product.getId());
    }

    @Transactional
    public Product updateStockManually(Long productId, int newStock, String updaterEmail) {
        if (newStock < 0) {
            throw new BadRequestException("Stock cannot be negative");
        }
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        int oldStock = product.getStock();
        product.setStock(newStock);
        product.setUpdatedAt(LocalDateTime.now());
        Product saved = productRepository.saveAndFlush(product);

        auditService.log("MANUAL_STOCK_UPDATE", updaterEmail,
                "Updated stock for " + product.getTitle() + " from " + oldStock + " to " + newStock,
                "PRODUCT", product.getId());

        return saved;
    }

    public List<Product> getLowStockProducts(int threshold) {
        return productRepository.findByStockLessThan(threshold);
    }
}
