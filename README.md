# ShopKart — Production-Ready Enterprise E-Commerce Platform

A production-ready, fully responsive e-commerce web platform built with a **Java Spring Boot 3.3.4 Modular Monolith** backend, **Relational Database Architecture (PostgreSQL / H2 with HikariCP)**, and a **React 19 (Vite + Tailwind CSS + Lucide Icons)** frontend.

---

## 🚀 Running Application URLs

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend Core REST API**: [http://localhost:8080](http://localhost:8080)
- **Database Console**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
  - **JDBC URL**: `jdbc:h2:mem:shopkartdb`
  - **User**: `sa`
  - **Password**: `password`

---

## 👥 Multi-Role Portals & Demo Accounts

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Buyer** | `buyer@shopkart.com` | `buyer123` | Product browsing, category filtering, cart management, checkout, wishlist, order history & live tracking |
| **Seller** | `seller@shopkart.com` | `seller123` | Seller Studio: Inventory dashboard, product creation & editing, stock alerts, sales performance, vendor packages |
| **Admin** | `admin@shopkart.com` | `admin123` | Admin Console: Platform metrics, user moderation, flash deal management, sitewide catalog controls, audit trails |

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────┐
│            FRONTEND (React 19 SPA + Tailwind CSS)      │
│   Buyer Portal, Seller Studio, Admin Console, Deals    │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS + JSON (Bearer JWT)
┌───────────────────────────▼────────────────────────────┐
│          JAVA BACKEND (Spring Boot 3.3.4)              │
│  Security Filter (JWT HMAC-SHA256, BCrypt, RBAC)       │
│  REST Controllers (Spring MVC)                         │
│  Services (Business Rules & Transactions)              │
│   • Multi-Role Auth (Buyer / Seller / Admin)           │
│   • Dynamic Catalog & Hierarchy (Categories/Products) │
│   • UTC Synchronized Flash Deals Engine                │
│   • Concurrency & Inventory Stock Locks (@Version)     │
│   • Cart & Pricing Calculations (Free > ₹500 rule)     │
│   • Order State Machine (Strict Transitions)           │
│   • Payment Gateway Idempotency Simulation             │
│   • Seller Studio & Admin Telemetry Dashboards         │
│  Repositories (Spring Data JPA / Hibernate 6)          │
│  HikariCP High-Performance Connection Pool             │
└──────────────┬─────────────────────────┬───────────────┘
               │                         │
         ┌─────▼──────────┐        ┌─────▼──────────────────────────┐
         │ Relational DB  │        │ Object Storage & External SDKs │
         │ PostgreSQL/H2  │        │ (Payment / SMS / Cloudinary)   │
         └────────────────┘        └────────────────────────────────┘
```

---

## 📦 Key Functional Modules

1. **Database Architecture & Live Data Integration**:
   - Robust relational schemas for Users, Products, Categories, Orders, Order Items, Sub-Orders, and Flash Deals.
   - Production-grade HikariCP connection pooling (`ShopKartHikariPool`).
   - Optimistic concurrency locking (`@Version`) preventing race conditions and overselling.
2. **Multi-Role Portals & Navigation**:
   - Universal, persistent "Home" button in the global navigation bar.
   - Role-Based Access Control (RBAC) with dedicated portals for Buyers, Sellers, and Platform Administrators.
   - Seller Studio with live stock alerts, sales performance analytics, and full product creation/editing.
   - Admin Console with GMV metrics, user moderation, deal management, and sitewide catalog controls.
3. **Synchronized Countdown Timer**:
   - Flash deal countdown timer synchronized with server-provided UTC timestamps (`/api/deals/active`).
   - Zero layout shifts using fixed tabular numbers (`font-mono tabular-nums`).
   - Automatic deal expiration handling transitioning items to "Deal Expired" once the timer reaches 00:00:00.
4. **Cross-Device Responsive Layout**:
   - Fluid auto-fill CSS Grid (`repeat(auto-fill, minmax(210px, 1fr))`) and Flexbox layouts.
   - Pixel-perfect display across devices from 320px mobile to 4K desktop screens.
   - Graceful placeholder image fallback handling on all product imagery.
5. **Evergreen Branding & Modern UI/UX**:
   - Clean, professional brand identity with consistent design tokens, subtle drop-shadows, and modern typography.
   - Evergreen promotional campaigns ("Mega Deals Festival", "Limited-Time Offers").
