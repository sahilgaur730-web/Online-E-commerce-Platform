# ShopKart — Authentic Flipkart Recreation E-Commerce Platform

A production-grade, trustworthy e-commerce web platform inspired by **Flipkart**, built as a **Java Spring Boot Modular Monolith** backend and a **React (Vite + Tailwind CSS + Lucide Icons)** frontend.

---

## 🚀 Running Application URLs

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend Core REST API**: [http://localhost:8080](http://localhost:8080)
- **H2 In-Memory Database Console**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
  - **JDBC URL**: `jdbc:h2:mem:shopkartdb`
  - **User**: `sa`
  - **Password**: `password`

---

## 👥 Demo Accounts (1-Click Switchers in App)

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Buyer** | `buyer@shopkart.com` | `buyer123` | Full shopping, cart, multi-step checkout, wishlist, tracking, reviews |
| **Seller** | `seller@shopkart.com` | `seller123` | Seller Hub, publish products, restock inventory, order fulfilment |
| **Admin** | `admin@shopkart.com` | `admin123` | Central Administration, user roles, GMV metrics, audit trails |

---

## 🏛️ Architecture: Where Java Fits in E-Commerce

```
┌────────────────────────────────────────────────────────┐
│            FRONTEND (React SPA + Tailwind)             │
│   Flipkart UI/UX, Deals, PDP, Cart, 4-Step Checkout    │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS + JSON (Bearer JWT)
┌───────────────────────────▼────────────────────────────┐
│          JAVA BACKEND (Spring Boot 3.3.4)              │
│  Security Filter (JWT, BCrypt, RBAC)                   │
│  REST Controllers (Spring MVC)                         │
│  Services (Business Rules & Transactions)              │
│   • Auth & Roles (Buyer / Seller / Admin)              │
│   • Product Catalog & Category Hierarchy               │
│   • Inventory Concurrency & Stock Locks (@Version)     │
│   • Cart & Pricing Calculations (Free > ₹500 rule)     │
│   • Orders & State Machine (Strict Transitions)        │
│   • Payment Gateway Simulation & Idempotency           │
│   • Notifications & Audit Logging                      │
│   • Admin & Seller Projections / Metrics Dashboards    │
│  Repositories (Spring Data JPA / Hibernate 6)          │
└──────────────┬─────────────────────────┬───────────────┘
               │                         │
         ┌─────▼──────────┐        ┌─────▼──────────────────────────┐
         │ H2 Database    │        │ Object Storage & External SDKs │
         │ (In-Memory/JPA)│        │ (Payment / SMS / Email Mock)   │
         └────────────────┘        └────────────────────────────────┘
```

---

## 📦 Key Functional Modules

1. **Authentication & RBAC**:
   - Spring Security with BCrypt password hashing and HMAC-SHA256 JWT tokens.
   - Distinct roles: `ROLE_BUYER`, `ROLE_SELLER`, `ROLE_ADMIN`.
2. **Catalog & Search**:
   - Structured relational models: Category tree, Products, Images, Specifications.
   - Faceted filtering: Keyword, Brand, Price Range, Customer Ratings, In-Stock.
   - Flipkart sorting tabs: Popularity, Price (Low to High), Price (High to Low), Newest.
3. **Inventory Management & Overselling Prevention**:
   - Optimistic locking (`@Version`) prevents race conditions when two buyers attempt to purchase the last unit.
   - Mandatory transactional stock deduction upon order creation.
   - Automatic stock restoration upon order cancellation.
4. **Cart & Pricing Engine**:
   - Authentic Flipkart delivery rule (Free delivery above ₹500, ₹40 under ₹500).
   - Real-time calculation of List Price, Discount Savings, and Total Payable.
5. **Orders & State Machine**:
   - Strict progression: `PLACED` ➔ `CONFIRMED` ➔ `SHIPPED` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`.
   - Live 5-step Flipkart tracking timeline with timestamped milestones.
   - Cancellation allowed prior to dispatch, triggering real-time stock restoration and audit logging.
6. **Payments & Idempotency**:
   - Payment intent creation with transaction IDs.
   - Support for UPI, Credit/Debit Card, Net Banking, and Cash on Delivery (COD).
7. **Admin & Seller Dashboards**:
   - Aggregated metrics (GMV, order volume, category distribution, low stock warnings).
   - Live audit trail capturing all system events with timestamps.
8. **UI/UX Aesthetics**:
   - Clean Flipkart color palette: Deep Blue (`#0A3B74` / `#2874F0`), Yellow (`#FFE500`), Orange (`#FB641B`), Green (`#388E3C`).
   - Clean Lucide icons with **zero emojis**, **no AI sparkles**, and **no unnatural gradients**.
