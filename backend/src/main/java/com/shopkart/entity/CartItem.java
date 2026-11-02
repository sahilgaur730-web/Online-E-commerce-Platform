package com.shopkart.entity;

/**
 * Entity alias for {@link com.shopkart.model.CartItem} providing access under com.shopkart.entity.
 */
public class CartItem extends com.shopkart.model.CartItem {
    public CartItem() {
        super();
    }

    public CartItem(com.shopkart.model.User user, com.shopkart.model.Product product, int quantity) {
        super(user, product, quantity);
    }
}
