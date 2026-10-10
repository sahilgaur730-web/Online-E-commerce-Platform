# ShopKart — Enterprise Multi-Role E-Commerce Platform

[![Java](https://img.shields.io/badge/Java-17%2B-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

ShopKart is a modular, production-grade e-commerce application engineered with Spring Boot, robust relational data persistence, and a responsive web client. The platform features strict Role-Based Access Control (RBAC), optimistic locking for zero-overselling inventory management, asynchronous workers for non-blocking task processing, and dual-layer data access (Spring Data JPA paired with raw JDBC analytics).

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Database & Data Access Architecture](#-database--data-access-architecture)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Core Engineering Highlights](#-core-engineering-highlights)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Testing & Quality Assurance](#-testing--quality-assurance)

---

## ⚡ Key Features

- **Multi-Role Portals:** Discrete, isolated views and workflows for **Buyers**, **Sellers**, and **Admins**.
- **Real-Time Deals Engine:** Server-synchronized UTC countdown timers for flash sales with automatic deal expiration handling.
- **Deterministic Order State Machine:** Transactional progression through `ORDERED` ➔ `PACKED` ➔ `SHIPPED` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`.
- **Concurrency & Stock Protection:** Optimistic locking (`@Version`) prevents race conditions during high-volume checkout.
- **Engagement & Gamification:** Streak coins, check-in loyalty ledger, and post-order rewards.
- **Zero CLS Responsive UI:** Fully responsive interface tested across 360px mobile viewports through 4K displays.

---

## 🏗 Architecture & Tech Stack

### Backend
- **Core:** Java 17+, Spring Boot 3.x (Spring MVC, Spring Security, Spring Data JPA)
- **Servlet Engine:** Embedded Apache Tomcat 10.x with front-controller pattern (`DispatcherServlet`)
- **Security:** Stateless JWT authentication filter extending `OncePerRequestFilter`, BCrypt password hashing
- **Concurrency:** Thread-pool task executor with `@Async` and `CompletableFuture<T>`

### Persistence & Storage
- **Primary Database:** PostgreSQL 15+ (production/containerized), H2 (in-memory testing)
- **Connection Pooling:** HikariCP
- **Migrations:** Flyway database versioning
- **Data Access:** Spring Data JPA / Hibernate combined with pure `java.sql.*` JDBC DAOs

### Frontend
- **Interface:** Modern HTML5, Responsive CSS Grid / Flexbox, Vanilla JavaScript / Modern frontend assets (React 19, Vite, Tailwind CSS v4)
- **UX Stability:** Touch-scrolling category navigation, isolated carousel controls, zero layout shifts

---

## 🗄 Database & Data Access Architecture

ShopKart implements a hybrid data access layer:

1. **Declarative ORM Tier (Spring Data JPA):** Manages standard CRUD lifecycles, entity relationships (`@OneToMany`, `@ManyToMany`), and dirty-checking transactions.
2. **High-Performance Reporting Tier (Raw JDBC):** A dedicated `SalesAnalyticsJdbcDao` utilizing `java.sql.Connection`, `PreparedStatement`, and `ResultSet` with `try-with-resources` to execute native analytical aggregations without ORM overhead.

```text
         ┌────────────────────────────┐
         │      Application Tier      │
         └──────┬──────────────┬──────┘
                │              │
  ┌─────────────▼────┐    ┌────▼─────────────────┐
  │ Spring Data JPA  │    │ SalesAnalyticsJdbcDao│
  │  (ORM Entities)  │    │   (Raw java.sql.*)   │
  └─────────────┬────┘    └────┬─────────────────┘
                │              │
                └──────┬───────┘
                       │ (HikariCP Pool)
                ┌──────▼───────┐
                │  PostgreSQL  │
                └──────────────┘
```

---

## 👥 Role-Based Access Control (RBAC)

| Role | Available Views & Routes | Key Permissions |
| :--- | :--- | :--- |
| **Buyer** | `/home`, `/products/**`, `/cart`, `/checkout`, `/buyer/orders` | Search catalog, maintain cart state, place orders, claim streak coins. |
| **Seller** | `/seller/dashboard`, `/seller/products`, `/seller/orders` | List products, adjust inventory quantities, update shipment statuses. |
| **Admin** | `/admin/dashboard`, `/admin/reports`, `/admin/users`, `/admin/deals` | Sitewide revenue analytics (via JDBC DAO), user role moderation, deal activation. |

---

## 💡 Core Engineering Highlights

### 1. Concurrency & Asynchronous Invoicing
Order creation transactions remain lightweight by offloading PDF generation and notification dispatches to background worker threads:

```java
@Async("shopkartTaskExecutor")
public CompletableFuture<InvoiceReceiptDTO> generateOrderInvoiceAsync(Long orderId) {
    // Generates invoice off the main HTTP request thread
    InvoiceReceiptDTO receipt = invoiceEngine.compile(orderId);
    return CompletableFuture.completedFuture(receipt);
}
```

### 2. Standardized Type-Safe API Responses
All endpoints wrap outputs using a custom generic response contract:

```java
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    // Static factory methods: ApiResponse.success(data, msg) & ApiResponse.error(msg)
}
```

### 3. Inventory Race-Condition Defense
Products leverage `@Version` columns to ensure that concurrent transactions attempting to acquire the final item result in a controlled `OptimisticLockException` rather than overselling.

---

## 📁 Project Directory Structure

```text
shopkart/
├── backend/
│   ├── src/main/java/com/shopkart/
│   │   ├── config/        # AsyncConfig, SecurityConfig, WebMvcConfig
│   │   ├── controller/    # Buyer, Seller, and Admin REST Controllers
│   │   ├── dto/           # Request/Response payloads, generic ApiResponse<T>
│   │   ├── model/         # JPA Entities (User, Product, Order, FlashDeal)
│   │   ├── common/        # Custom exceptions & @RestControllerAdvice handler
│   │   ├── repository/    # Spring Data JPA Repositories
│   │   │   └── jdbc/      # Raw JDBC DAOs (SalesAnalyticsJdbcDao)
│   │   ├── service/       # Core business logic & Async workers
│   │   └── util/          # GenericCache<K, V>, PaginatedResult<T>
│   └── src/main/resources/
│       ├── db/migration/  # Flyway SQL migration scripts
│       └── application.properties # Environment and database configurations
├── frontend/              # Client-side views, responsive stylesheets, scripts
├── docker-compose.yml     # Container configuration for PostgreSQL
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- JDK 17 or higher
- Maven 3.8+
- Docker & Docker Compose (for persistent PostgreSQL)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/sahilgaur730-web/Online-E-commerce-Platform.git
cd Online-E-commerce-Platform
```

### 2. Start PostgreSQL Container
```bash
docker-compose up -d
```

### 3. Configure Database Credentials
Verify `backend/src/main/resources/application-postgres.properties` (or set environment variables):
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/shopkartdb
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=validate
```

### 4. Build and Run
```bash
# Run unit & integration tests
cd backend
./mvnw clean test

# Start the backend application
./mvnw spring-boot:run
```
The backend API server starts on `http://localhost:8080`, and the frontend web client runs on `http://localhost:5173`.

---

## 📡 API Reference

### Public / Buyer Endpoints
- `POST /api/auth/register` — Create account (`BUYER` / `SELLER`)
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET /api/products` — Retrieve paginated catalog with category filters
- `POST /api/cart/items` — Add product to active cart
- `POST /api/orders` — Execute checkout transaction
- `GET /api/orders/{id}/invoice` — Retrieve asynchronously generated order invoice

### Seller Endpoints (`ROLE_SELLER`)
- `GET /api/seller/products` — List seller-owned items
- `POST /api/seller/products` — Create new product listing
- `PUT /api/seller/sub-orders/{id}/status` — Update order shipment stage

### Admin Endpoints (`ROLE_ADMIN`)
- `GET /api/admin/reports/jdbc-sales-summary` — Native JDBC revenue analysis report
- `POST /api/admin/deals` — Create and schedule live flash sales
- `GET /api/admin/users` — Manage platform users and roles

---

## 🧪 Testing & Quality Assurance

Run the test suite to verify data integrity, optimistic locking, raw JDBC queries, and asynchronous services:

```bash
# Execute standard test suite
./mvnw test

# Package artifact with complete verification
./mvnw clean verify
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
