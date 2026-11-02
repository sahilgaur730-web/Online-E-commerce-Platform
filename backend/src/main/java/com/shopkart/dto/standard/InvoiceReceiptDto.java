package com.shopkart.dto.standard;

import com.shopkart.dto.InvoiceReceiptDTO;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Normalized DTO representing generated invoice receipt details with standard PascalCase naming.
 * Extends {@link InvoiceReceiptDTO} for seamless compatibility across the DTO layer.
 */
public class InvoiceReceiptDto extends InvoiceReceiptDTO {

    public InvoiceReceiptDto() {
        super();
    }

    public InvoiceReceiptDto(String invoiceNumber, Long orderId, String orderNumber,
                             String buyerEmail, String buyerName, LocalDateTime invoiceDate,
                             BigDecimal totalAmount, BigDecimal finalAmount, int itemCount,
                             String storagePath, String generatedByThread, String status) {
        super(invoiceNumber, orderId, orderNumber, buyerEmail, buyerName, invoiceDate,
              totalAmount, finalAmount, itemCount, storagePath, generatedByThread, status);
    }
}
