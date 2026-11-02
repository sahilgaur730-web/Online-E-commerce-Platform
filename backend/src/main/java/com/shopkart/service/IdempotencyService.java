package com.shopkart.service;

import com.shopkart.dto.OrderDto;
import com.shopkart.dto.PaymentResponse;
import com.shopkart.entity.PaymentTransaction;
import com.shopkart.repository.PaymentTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Service providing idempotency management for checkout and payment operations.
 * Protects against duplicate charges, race conditions, and duplicate order generation.
 */
@Service
public class IdempotencyService {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyService.class);

    private final PaymentTransactionRepository paymentTransactionRepository;

    // In-memory cache for fast idempotent lookups across active cluster/worker threads
    private final ConcurrentMap<String, OrderDto> orderCache = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, PaymentResponse> paymentCache = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Boolean> inFlightKeys = new ConcurrentHashMap<>();

    public IdempotencyService(PaymentTransactionRepository paymentTransactionRepository) {
        this.paymentTransactionRepository = paymentTransactionRepository;
    }

    /**
     * Checks if an order was already processed for the given user and idempotency key.
     *
     * @param userId         User ID
     * @param idempotencyKey Idempotency key from header or payload
     * @return Cached OrderDto if present, else empty
     */
    public Optional<OrderDto> getExistingOrder(Long userId, String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }
        String cacheKey = "ORDER:" + userId + ":" + idempotencyKey.trim();
        return Optional.ofNullable(orderCache.get(cacheKey));
    }

    /**
     * Records a completed order against the idempotency key.
     *
     * @param userId         User ID
     * @param idempotencyKey Idempotency key
     * @param orderDto       Order DTO
     */
    public void recordOrder(Long userId, String idempotencyKey, OrderDto orderDto) {
        if (idempotencyKey == null || idempotencyKey.isBlank() || orderDto == null) {
            return;
        }
        String cacheKey = "ORDER:" + userId + ":" + idempotencyKey.trim();
        orderCache.put(cacheKey, orderDto);
        releaseKey(cacheKey);
        log.info("Recorded idempotency receipt for key [{}] order [{}]", idempotencyKey, orderDto.getOrderNumber());
    }

    /**
     * Checks if a payment was already processed for the given idempotency key.
     * Checks both memory cache and PaymentTransaction database repository.
     *
     * @param idempotencyKey Idempotency key
     * @return Cached PaymentResponse if present, else empty
     */
    public Optional<PaymentResponse> getExistingPayment(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }
        String cleanKey = idempotencyKey.trim();
        PaymentResponse cached = paymentCache.get("PAYMENT:" + cleanKey);
        if (cached != null) {
            return Optional.of(cached);
        }

        // Fallback to database lookup
        return paymentTransactionRepository.findByIdempotencyKey(cleanKey)
                .map(pt -> new PaymentResponse(
                        pt.getGatewayTransactionId(),
                        pt.getOrderId(),
                        null,
                        pt.getAmount(),
                        pt.getStatus(),
                        null,
                        null,
                        pt.getGatewayPaymentId()
                ));
    }

    /**
     * Records a payment response against the idempotency key in memory.
     *
     * @param idempotencyKey  Idempotency key
     * @param paymentResponse Payment response
     */
    public void recordPayment(String idempotencyKey, PaymentResponse paymentResponse) {
        if (idempotencyKey == null || idempotencyKey.isBlank() || paymentResponse == null) {
            return;
        }
        String cacheKey = "PAYMENT:" + idempotencyKey.trim();
        paymentCache.put(cacheKey, paymentResponse);
        releaseKey(cacheKey);
        log.info("Recorded idempotency receipt for payment key [{}] txn [{}]", idempotencyKey, paymentResponse.getTransactionId());
    }

    /**
     * Attempts to acquire an in-flight processing lock for the given key.
     *
     * @param lockKey Key to lock
     * @return true if acquired successfully, false if another thread is currently processing
     */
    public boolean acquireLock(String lockKey) {
        return inFlightKeys.putIfAbsent(lockKey, Boolean.TRUE) == null;
    }

    /**
     * Releases an in-flight processing lock.
     *
     * @param lockKey Key to release
     */
    public void releaseKey(String lockKey) {
        inFlightKeys.remove(lockKey);
    }
}
