package com.shopkart.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class InvoiceReceiptDTO {
    private String invoiceNumber;
    private Long orderId;
    private String orderNumber;
    private String buyerEmail;
    private String buyerName;
    private LocalDateTime invoiceDate;
    private BigDecimal totalAmount;
    private BigDecimal finalAmount;
    private int itemCount;
    private String storagePath;
    private String generatedByThread;
    private String status;

    public InvoiceReceiptDTO() {
    }

    public InvoiceReceiptDTO(String invoiceNumber, Long orderId, String orderNumber,
                             String buyerEmail, String buyerName, LocalDateTime invoiceDate,
                             BigDecimal totalAmount, BigDecimal finalAmount, int itemCount,
                             String storagePath, String generatedByThread, String status) {
        this.invoiceNumber = invoiceNumber;
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.buyerEmail = buyerEmail;
        this.buyerName = buyerName;
        this.invoiceDate = invoiceDate;
        this.totalAmount = totalAmount;
        this.finalAmount = finalAmount;
        this.itemCount = itemCount;
        this.storagePath = storagePath;
        this.generatedByThread = generatedByThread;
        this.status = status;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getBuyerEmail() {
        return buyerEmail;
    }

    public void setBuyerEmail(String buyerEmail) {
        this.buyerEmail = buyerEmail;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public LocalDateTime getInvoiceDate() {
        return invoiceDate;
    }

    public void setInvoiceDate(LocalDateTime invoiceDate) {
        this.invoiceDate = invoiceDate;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getFinalAmount() {
        return finalAmount;
    }

    public void setFinalAmount(BigDecimal finalAmount) {
        this.finalAmount = finalAmount;
    }

    public int getItemCount() {
        return itemCount;
    }

    public void setItemCount(int itemCount) {
        this.itemCount = itemCount;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public String getGeneratedByThread() {
        return generatedByThread;
    }

    public void setGeneratedByThread(String generatedByThread) {
        this.generatedByThread = generatedByThread;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
