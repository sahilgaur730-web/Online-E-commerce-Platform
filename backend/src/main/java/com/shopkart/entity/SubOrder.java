package com.shopkart.entity;

import java.math.BigDecimal;

/**
 * Entity alias for {@link com.shopkart.model.SubOrder} providing access under com.shopkart.entity.
 */
public class SubOrder extends com.shopkart.model.SubOrder {
    public SubOrder() {
        super();
    }

    public SubOrder(com.shopkart.model.Order order, com.shopkart.model.User seller,
                    String subOrderNumber, BigDecimal subtotal, String trackingNumber) {
        super(order, seller, subOrderNumber, subtotal, trackingNumber);
    }
}
