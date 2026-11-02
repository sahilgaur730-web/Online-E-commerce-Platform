package com.shopkart.repository;

import com.shopkart.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for {@link PaymentTransaction}.
 */
@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    /**
     * Finds a payment transaction by its unique idempotency key.
     *
     * @param idempotencyKey unique key from request
     * @return optional containing matching {@link PaymentTransaction} if found
     */
    Optional<PaymentTransaction> findByIdempotencyKey(String idempotencyKey);

    /**
     * Finds a payment transaction by its gateway payment ID.
     *
     * @param gatewayPaymentId gateway payment identifier
     * @return optional containing matching {@link PaymentTransaction}
     */
    Optional<PaymentTransaction> findByGatewayPaymentId(String gatewayPaymentId);

    /**
     * Finds a payment transaction by its gateway transaction ID.
     *
     * @param gatewayTransactionId transaction ID
     * @return optional containing matching {@link PaymentTransaction}
     */
    Optional<PaymentTransaction> findByGatewayTransactionId(String gatewayTransactionId);

    /**
     * Retrieves all payment transactions linked to a specific order ID.
     *
     * @param orderId order primary key ID
     * @return list of payment transactions
     */
    List<PaymentTransaction> findByOrderId(Long orderId);

    /**
     * Checks if a transaction with the specified idempotency key exists.
     *
     * @param idempotencyKey idempotency key string
     * @return true if exists
     */
    boolean existsByIdempotencyKey(String idempotencyKey);
}
