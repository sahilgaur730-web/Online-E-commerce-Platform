package com.shopkart.entity;

import java.math.BigDecimal;

/**
 * Entity alias for {@link com.shopkart.model.OrderItem} providing access under com.shopkart.entity.
 */
public class OrderItem extends com.shopkart.model.OrderItem {
    public OrderItem() {
        super();
    }

    public OrderItem(com.shopkart.model.Order order, com.shopkart.model.Product product,
                     String productName, String productImageUrl, BigDecimal price, int quantity, BigDecimal subtotal) {
        super(order, product, productName, productImageUrl, price, quantity, subtotal);
    }
}
