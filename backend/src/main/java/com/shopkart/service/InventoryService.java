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

/**
 * Concurrency-safe inventory management service controlling stock deductions, restorations,
 * and low-stock threshold alerting.
 * <p>
 * Cooperates with {@link Product}'s {@code @Version} optimistic locking field to prevent race conditions
 * and concurrent overselling. Enforces {@code Propagation.MANDATORY} on order deductions so stock changes
 * cannot occur outside an active transactional boundary.
 * </p>
 */
@Service
public class InventoryService {

    private final ProductRepository productRepository;
    private final AuditService auditService;

    public InventoryService(ProductRepository productRepository, AuditService auditService) {
        this.productRepository = productRepository;
        this.auditService = auditService;
    }

    /**
     * Atomically deducts product stock within an existing transactional boundary.
     * Rejects invalid quantities or attempts to purchase more units than available stock.
     *
     * @param productId product primary key ID
     * @param quantity number of items to deduct (must be strictly positive)
     * @throws BadRequestException if quantity <= 0 or if available stock is insufficient
     * @throws ResourceNotFoundException if product ID does not exist
     */
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

    /**
     * Restores stock quantity when an order or package is cancelled, within a transactional boundary.
     *
     * @param productId product primary key ID
     * @param quantity number of units to restore
     * @throws BadRequestException if quantity <= 0
     * @throws ResourceNotFoundException if product is not found
     */
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

    /**
     * Manually overrides stock level for a product (admin/seller operation) and records an audit log.
     *
     * @param productId product primary key ID
     * @param newStock new non-negative stock quantity
     * @param updaterEmail email of the user modifying inventory
     * @return updated {@link Product} entity
     * @throws BadRequestException if newStock < 0
     */
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

    /**
     * Retrieves products with inventory levels at or below the given threshold for restock planning.
     *
     * @param threshold stock threshold integer
     * @return list of low-stock {@link Product} entities
     */
    public List<Product> getLowStockProducts(int threshold) {
        return productRepository.findByStockLessThan(threshold);
    }
}
