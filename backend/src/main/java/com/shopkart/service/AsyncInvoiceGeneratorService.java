package com.shopkart.service;

import com.shopkart.dto.InvoiceReceiptDTO;
import com.shopkart.model.Order;
import com.shopkart.repository.OrderRepository;
import com.shopkart.util.GenericCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

/**
 * Asynchronous worker service that executes invoice generation and PDF compilation
 * in a dedicated background worker thread pool.
 */
@Service
public class AsyncInvoiceGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(AsyncInvoiceGeneratorService.class);

    private final OrderRepository orderRepository;
    private final GenericCache<Long, InvoiceReceiptDTO> invoiceCache = new GenericCache<>(3_600_000L);
    private final java.util.Map<Long, Order> pendingOrderSnapshots = new java.util.concurrent.ConcurrentHashMap<>();

    public AsyncInvoiceGeneratorService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    /**
     * Registers an in-flight order snapshot before transaction commit so the background
     * @Async worker thread can generate the invoice immediately without READ_COMMITTED races.
     */
    public void registerOrderSnapshot(Order order) {
        if (order != null && order.getId() != null) {
            pendingOrderSnapshots.put(order.getId(), order);
        }
    }

    /**
     * Retrieves a cached invoice receipt if already generated in the background.
     */
    public Optional<InvoiceReceiptDTO> getCachedInvoice(Long orderId) {
        return invoiceCache.get(orderId);
    }

    /**
     * Generates an invoice asynchronously in the ShopKart-Async background thread pool.
     *
     * @param orderId ID of the placed order
     * @return CompletableFuture holding the generated InvoiceReceiptDTO
     */
    @Async("shopkartTaskExecutor")
    public CompletableFuture<InvoiceReceiptDTO> generateOrderInvoiceAsync(Long orderId) {
        String threadName = Thread.currentThread().getName();
        log.info("[Async Invoice Worker] Thread [{}] starting invoice generation for Order ID: {}", threadName, orderId);

        if (orderId == null) {
            return CompletableFuture.completedFuture(null);
        }

        try {
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) {
                order = pendingOrderSnapshots.remove(orderId);
            } else {
                pendingOrderSnapshots.remove(orderId);
            }

            if (order == null) {
                for (int attempt = 0; attempt < 2; attempt++) {
                    try {
                        Thread.sleep(15);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                    order = orderRepository.findById(orderId).orElse(null);
                    if (order != null) {
                        break;
                    }
                }
            }

            if (order == null) {
                log.warn("[Async Invoice Worker] Order {} not found for invoice generation", orderId);
                return CompletableFuture.completedFuture(null);
            }

            String invoiceNumber = "INV-" + (order.getOrderNumber() != null ? order.getOrderNumber() : ("ORD-" + orderId));
            int itemCount = (order.getItems() != null) ? order.getItems().size() : 0;
            String buyerEmail = (order.getBuyer() != null) ? order.getBuyer().getEmail() : "customer@shopkart.com";
            String buyerName = (order.getBuyer() != null) ? order.getBuyer().getName() : "Customer";
            String storagePath = "invoices/" + invoiceNumber.toLowerCase() + ".pdf";

            InvoiceReceiptDTO receipt = new InvoiceReceiptDTO(
                    invoiceNumber,
                    order.getId(),
                    order.getOrderNumber(),
                    buyerEmail,
                    buyerName,
                    LocalDateTime.now(),
                    order.getTotalAmount(),
                    order.getFinalAmount(),
                    itemCount,
                    storagePath,
                    threadName,
                    "GENERATED"
            );

            invoiceCache.put(order.getId(), receipt);

            log.info("[Async Invoice Worker] Successfully generated invoice {} on thread [{}] for order {}",
                    invoiceNumber, threadName, order.getOrderNumber());

            return CompletableFuture.completedFuture(receipt);
        } catch (Exception e) {
            log.error("[Async Invoice Worker] Error generating invoice for order {}", orderId, e);
            CompletableFuture<InvoiceReceiptDTO> failed = new CompletableFuture<>();
            failed.completeExceptionally(e);
            return failed;
        }
    }
}
