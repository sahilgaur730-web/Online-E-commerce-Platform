-- Flyway Database Migration V1: Initial Baseline Schema for ShopKart E-Commerce
-- PostgreSQL Compatible Schema

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    store_name VARCHAR(255),
    store_description VARCHAR(1000),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    street_address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    landmark VARCHAR(255),
    address_type VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(1000),
    icon_name VARCHAR(255),
    image_url VARCHAR(500),
    display_order INT DEFAULT 0,
    parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(5000),
    brand VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    original_price NUMERIC(12, 2),
    discount_percentage INT DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    version BIGINT DEFAULT 0,
    category_id BIGINT NOT NULL REFERENCES categories(id),
    seller_id BIGINT NOT NULL REFERENCES users(id),
    rating DOUBLE PRECISION DEFAULT 0.0,
    rating_count INT DEFAULT 0,
    review_count INT DEFAULT 0,
    specifications VARCHAR(5000),
    featured BOOLEAN DEFAULT FALSE,
    deal_of_the_day BOOLEAN DEFAULT FALSE,
    top_offer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(1000) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(255) NOT NULL UNIQUE,
    buyer_id BIGINT NOT NULL REFERENCES users(id),
    total_amount NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    delivery_fee NUMERIC(12, 2) DEFAULT 0,
    final_amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) NOT NULL,
    payment_transaction_id VARCHAR(255),
    order_status VARCHAR(50) NOT NULL,
    shipping_address_snapshot VARCHAR(2000),
    tracking_number VARCHAR(255),
    cancellation_reason VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sub_orders (
    id BIGSERIAL PRIMARY KEY,
    sub_order_number VARCHAR(255) NOT NULL UNIQUE,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seller_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    shipping_fee NUMERIC(12, 2) DEFAULT 0,
    tracking_number VARCHAR(255),
    carrier VARCHAR(255),
    cancellation_reason VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sub_order_id BIGINT REFERENCES sub_orders(id) ON DELETE SET NULL,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image_url VARCHAR(1000),
    price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS order_tracking (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sub_order_id BIGINT REFERENCES sub_orders(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL,
    title VARCHAR(255),
    comment VARCHAR(1000) NOT NULL,
    verified_purchase BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_review_product_user UNIQUE (product_id, user_id)
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wishlist_user_product UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(255),
    details VARCHAR(4000),
    entity_type VARCHAR(100),
    entity_id BIGINT,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flash_deals (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    deal_price NUMERIC(12, 2) NOT NULL,
    original_price NUMERIC(12, 2),
    discount_percentage INT DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    stock_limit INT DEFAULT 50,
    sold_count INT DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_order ON sub_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_seller ON sub_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sub_order ON order_items(sub_order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_flash_deals_active_end ON flash_deals(active, end_time);
