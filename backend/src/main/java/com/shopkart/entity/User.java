package com.shopkart.entity;

/**
 * Entity alias for {@link com.shopkart.model.User} providing access under com.shopkart.entity.
 */
public class User extends com.shopkart.model.User {
    public User() {
        super();
    }

    public User(String name, String email, String password, com.shopkart.model.Role role, String phone) {
        super(name, email, password, role, phone);
    }
}
