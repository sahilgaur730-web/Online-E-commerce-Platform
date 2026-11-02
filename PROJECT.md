# Project: ShopKart E-Commerce Review 2 Remediation & Compliance Verification

## Architecture
ShopKart is a full-stack Spring Boot 3.3.4 (Java 17) and React 19 / Vite 8 e-commerce application. The backend leverages Spring Data JPA with Hibernate, HikariCP connection pooling, H2 for development/testing, PostgreSQL for production, and Spring Security with stateless JWT authentication. The system supports multi-seller catalog management, atomic inventory reservation with optimistic locking, multi-tier checkout calculations, idempotent payment verification with sandbox gateway mocking, and responsive multi-viewport web interfaces.

### Module & Boundary Architecture
- **Web & API Layer**: `com.shopkart.controller.*` (15 REST controllers handling Auth, Cart, Orders, Payments, Inventory, Admin).
- **Security Layer**: `com.shopkart.security.*`, `com.shopkart.config.SecurityConfig` (JWT filter, BCrypt password encoder, role-based authorization, CORS, production lockdown).
- **Service & Domain Layer**: `com.shopkart.service.*` (`OrderService`, `PaymentService`, `InventoryService`, `CartService`, `AuditService`, `AsyncInvoiceGeneratorService`).
- **Data & Repository Layer**: `com.shopkart.repository.*`, `com.shopkart.entity.*` / `com.shopkart.model.*` (JPA Entities with `@Version` optimistic locking, `@Table` indexes, and Bean Validation constraints).
- **DTO Layer**: `com.shopkart.dto.*` (Request/Response Transfer Objects with standardized naming and validation).
- **Exception Layer**: `com.shopkart.exception.*` (`GlobalExceptionHandler`, `BadRequestException`, `ResourceNotFoundException`).
- **Configuration Layer**: `com.shopkart.config.*` (`SecurityConfig`, `AsyncConfig`, `CorsConfig`, `HikariConfig`).
- **Frontend Presentation Layer**: `frontend/` (React 19, Tailwind CSS v4, Lucide icons, responsive Desktop 1440px / Tablet 768px / Mobile 375px).

---

## Feature Inventory
Every feature and gap identified during the Phase 0 Survey has been cataloged and mapped to its assigned milestone.

| # | Feature / Work Item | Description | Milestone | Source |
|---|---------------------|-------------|-----------|--------|
| 1 | Package Organization & Exception Decoupling | Organize into `controller`, `service`, `repository`, `entity`, `dto`, `security`, `config`, `exception`; move exceptions to `com.shopkart.exception` and resolve duplicate `ApiResponse` | M1 | survey_1 |
| 2 | PaymentTransaction JPA Entity & Repository | Create normalized `PaymentTransaction` entity with `@Table(indexes = ...)`, idempotencyKey, status, amount, and repository | M1 | survey_1, prompt_R1 |
| 3 | JPA Entity Normalization & Indexes | Add `@Table(indexes = { @Index(...) })` across `Product`, `Order`, `OrderItem`, `SubOrder`, `CartItem`, `PaymentTransaction` | M1 | survey_1, prompt_R1 |
| 4 | JPA Entity Validation Constraints | Add Bean Validation (`@NotNull`, `@Min`, `@Size`, `@NotBlank`) to `Order`, `OrderItem`, `SubOrder`, `Product`, and `User` | M1 | survey_1, prompt_R1 |
| 5 | Concurrency Safety & Optimistic Locking | Enforce `@Version` on `Product` and concurrency boundaries across inventory deductions and order creation | M1 | survey_1, prompt_R5 |
| 6 | Idempotency Protection on Checkout & Payment | Implement idempotency key validation on `POST /api/orders` and `POST /api/payments/verify` preventing duplicate charges | M1 | survey_1, prompt_R5 |
| 7 | HikariCP & Database Environment Aliases | Bind `${DB_URL:${SPRING_DATASOURCE_URL:...}}`, `${DB_USERNAME:...}`, `${DB_PASSWORD:...}` in YAML configurations and `.env.example` | M1 | survey_1, survey_2, prompt_R1 |
| 8 | OrderService Refactoring | Refactor bloated 162-line `createOrder` method into single-responsibility private helper methods | M1 | survey_1 |
| 9 | Dev Endpoint Lockdown in SecurityFilterChain | Explicitly deny Swagger UI (`/swagger-ui/**`), OpenAPI (`/v3/api-docs/**`), and Actuator (`/actuator/**`) in `SecurityConfig` under `prod` profile | M2 | survey_2, prompt_R2 |
| 10 | Javadoc Documentation Coverage | Add comprehensive Javadoc comments to all classes, REST endpoints, and complex business logic (Checkout, Payment, Inventory) | M2 | survey_1, prompt_R1 |
| 11 | CI/CD GitHub Actions Pipeline | Author `.github/workflows/maven-ci.yml` triggering `./mvnw clean test` on pushes and pull requests to `main` | M2 | survey_2, prompt_R4 |
| 12 | Build Tooling & Environment Template Audit | Verify Maven wrapper, `.gitignore` exclusions (`.env`, `target/`, binaries), and complete `.env.example` template | M2 | survey_2, prompt_R2 |
| 13 | Payment Failure View & Retry CTA | Implement dedicated Payment Failure state view with error description, preserved cart, and "Try Again" CTA in `CheckoutPage.jsx` | M3 | survey_3, prompt_R3 |
| 14 | Payment Processing Modal Overlay | Add secure full-screen payment processing overlay in `CheckoutPage.jsx` protecting against duplicate user clicks | M3 | survey_3, prompt_R3 |
| 15 | Design System & Tailwind v4 Token Binding | Register CSS variables (`--sk-navy`, `--sk-orange`, `--sk-green`, `--sk-surface`) in Tailwind v4 `@theme`, clean `App.css`, replace arbitrary hexes | M3 | survey_3, prompt_R3 |
| 16 | Form Validation Feedback & Viewport Polish | Add visual valid/invalid validation states to checkout address forms; polish 1440px, 768px, 375px responsiveness | M3 | survey_3, prompt_R3 |
| 17 | Payment Sandbox Callback Verification Tests | Author automated unit/integration tests verifying `verifyRazorpaySignature` and `verifyWebhookSignature` (valid, invalid, forged) | M4 | survey_2, prompt_R4 |
| 18 | Checkout MockMvc 400 Rejection Tests | Author MockMvc tests verifying `400 Bad Request` on invalid payload, missing address, empty cart, and tax/total calculations | M4 | survey_2, prompt_R4 |
| 19 | Concurrency & Multithreaded Optimistic Lock Tests | Author multithreaded test verifying optimistic lock rejection and rollback on concurrent checkout oversell attempts | M4 | survey_1, prompt_R5 |
| 20 | Prod Profile Security Lockdown Tests | Author security tests verifying `/swagger-ui/**`, `/v3/api-docs/**`, `/actuator/**`, `/h2-console/**` are rejected under `prod` | M4 | survey_2, prompt_R4 |
| 21 | Full Clean Test Suite Execution | Execute `./mvnw clean test` verifying 100% test pass with zero failures or errors | M4 | survey_2, prompt_R4 |
| 22 | Comprehensive Root README.md | Author README with modular directory tree, Mermaid ER diagram, Mermaid Flow diagram, configuration table, run/test commands, and Invigilator Remediation Summary | M5 | survey_3, prompt_R5 |
| 23 | Review 2 Presentation Guide & Slide Deck | Author `REVIEW_2_PRESENTATION_GUIDE.md` with slide-by-slide bullet points, ER diagrams, 3-viewport screenshot checklist, and Git commit plan | M5 | survey_3, prompt_R5 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Architecture, JPA Entity Normalization, Concurrency & Idempotency Core | Features 1–8: `entity` & `exception` packages, `PaymentTransaction` entity, `@Table` indexes, Bean Validation, `@Version` concurrency, idempotency protection, HikariCP & DB env aliases, `OrderService` refactoring | none | DONE |
| M2 | Security Lockdown, Javadoc Documentation, CI/CD Pipeline & Config Hygiene | Features 9–12: Swagger/OpenAPI/Actuator lockdown in `SecurityConfig`, Javadoc across classes/services/controllers, `.github/workflows/maven-ci.yml`, `.env.example` | M1 | DONE |
| M3 | Responsive Frontend UI/UX, Design Tokens & Payment Views | Features 13–16: Payment failure view, payment processing overlay, Tailwind v4 `@theme` tokens, address form validation, 1440px/768px/375px responsive polish | none | DONE |
| M4 | Automated Integration, Security & Concurrency Test Suite | Features 17–21: Callback signature tests, Checkout 400 MockMvc tests, multithreaded concurrency test, prod security tests, 100% clean `./mvnw clean test` pass | M1, M2 | DONE |
| M5 | Root README, Mermaid Diagrams & Review 2 Presentation Guide | Features 22–23: Root `README.md` with Mermaid ER & Flow diagrams, `REVIEW_2_PRESENTATION_GUIDE.md`, screenshot checklist, modular Git commit plan | M1, M2, M3, M4 | DONE |

---

## Interface Contracts

### Configuration Properties Contract
- `spring.datasource.url`: `${DB_URL:${SPRING_DATASOURCE_URL:jdbc:h2:mem:shopkart_prod}}`
- `spring.datasource.username`: `${DB_USERNAME:${SPRING_DATASOURCE_USERNAME:sa}}`
- `spring.datasource.password`: `${DB_PASSWORD:${SPRING_DATASOURCE_PASSWORD:}}`
- `jwt.secret`: bound to `${JWT_SECRET}` (mandatory in prod; dummy default in `application-test.yml`)
- `jwt.expirationMs`: bound to `${JWT_EXPIRATION_MS:86400000}`
- `payment.sandbox-key`: bound to `${PAYMENT_SANDBOX_KEY:${RAZORPAY_KEY_ID:}}`
- `payment.sandbox-secret`: bound to `${PAYMENT_SANDBOX_SECRET:${RAZORPAY_KEY_SECRET:}}`
- `payment.webhook-secret`: bound to `${PAYMENT_WEBHOOK_SECRET:${RAZORPAY_WEBHOOK_SECRET:}}`

### Endpoint Security & Profile Lockdown Contract
- `/swagger-ui/**`, `/v3/api-docs/**`, `/actuator/**`: permitted only in `dev` profile; explicitly `.denyAll()` in `prod` profile.
- `/h2-console/**`: permitted only in `dev` profile (`isDev == true`); explicitly `.denyAll()` in `prod`.
- `DataInitializer`: active only under `@Profile({"dev", "test"})`; completely disabled in `prod`.
- Protected endpoints (`/api/orders/**`, `/api/payments/**`, `/api/cart/**`): require valid non-expired JWT; return 401 Unauthorized or 403 Forbidden.

### Idempotency Contract
- `POST /api/orders`: supports `Idempotency-Key` or `X-Idempotency-Key` header (or request body field). If a request with the same idempotency key for the same user is currently processing or already completed, returns HTTP 409 Conflict or the previously generated order, preventing duplicate order generation and stock double-deduction.
- `POST /api/payments/verify`: records `PaymentTransaction` by transaction ID. Duplicate verification attempts return the existing transaction record rather than executing duplicate state transitions or duplicate charges.

### Concurrency & Transactional Contract
- `Product.@Version private Long version`: prevents lost updates on concurrent inventory deduction.
- `InventoryService.deductStock`: `@Transactional(propagation = Propagation.MANDATORY)`. Throws `BadRequestException` on insufficient stock.
- `OrderService.createOrder`: `@Transactional(rollbackFor = Exception.class)`. Atomic rollback on any failure.

---

## Code Layout
```
c:\Users\SAHIL GAUR\Desktop\E-COMM\
├── .github/
│   └── workflows/
│       └── maven-ci.yml                       # M2: GitHub Actions CI workflow
├── .gitignore                                 # Excludes .env, target/, binaries, IDE
├── .env.example                               # Externalized environment template
├── mvnw                                       # Maven wrapper script
├── mvnw.cmd                                   # Maven wrapper cmd script
├── .mvn/wrapper/                              # Maven wrapper configuration
├── README.md                                  # M5: Root README with Mermaid ER & Flow
├── REVIEW_2_PRESENTATION_GUIDE.md             # M5: Presentation guide & slide notes
├── backend/
│   ├── pom.xml                                # Cleaned dependencies
│   └── src/
│       ├── main/
│       │   ├── java/com/shopkart/
│       │   │   ├── config/SecurityConfig.java # M2: Dev/debug endpoint lockdown
│       │   │   ├── controller/                # 15 REST controllers with Javadocs
│       │   │   ├── dto/                       # Clean DTOs, Idempotency DTOs
│       │   │   ├── entity/                    # M1: JPA Entities + PaymentTransaction
│       │   │   │   ├── User.java              # Normalized, validated, indexed
│       │   │   │   ├── Product.java           # @Version, @Table(indexes)
│       │   │   │   ├── Order.java             # Validated, indexed
│       │   │   │   ├── OrderItem.java         # Normalized, validated
│       │   │   │   ├── SubOrder.java          # Normalized, validated
│       │   │   │   ├── CartItem.java          # Normalized, validated
│       │   │   │   └── PaymentTransaction.java# M1: Payment transaction entity
│       │   │   ├── exception/                 # M1: GlobalExceptionHandler, BadRequestException
│       │   │   ├── repository/                # Spring Data JPA Repositories
│       │   │   ├── security/                  # JwtUtils, JwtAuthenticationFilter
│       │   │   └── service/                   # Business logic with Javadocs
│       │   │       ├── OrderService.java      # Refactored, @Transactional
│       │   │       ├── PaymentService.java    # Idempotent, callback signatures
│       │   │       └── InventoryService.java  # Concurrency-safe stock deduction
│       │   └── resources/
│       │       ├── application.yml            # Shared baseline config
│       │       ├── application-dev.yml        # Dev profile with H2
│       │       └── application-prod.yml       # Prod profile with PostgreSQL & DB envs
│       └── test/
│           ├── java/com/shopkart/
│           │   ├── InventoryAndCheckoutIntegrationTests.java # M4: Stock, rollback, 400 rejection
│           │   ├── PaymentWorkflowIntegrationTests.java      # M4: Payment states, signatures
│           │   ├── SecurityAndProfileComplianceTests.java    # M4: Auth, prod lockdown
│           │   └── ConcurrencyAndOptimisticLockTests.java    # M4: Multithreaded race test
│           └── resources/
│               └── application-test.yml       # Safe test profile
└── frontend/
    └── src/
        ├── index.css                          # M3: Tailwind v4 @theme design tokens
        ├── pages/
        │   ├── CheckoutPage.jsx               # M3: Payment failure view, processing overlay
        │   └── CatalogPage.jsx                # M3: Responsive catalog polish
        └── components/                        # M3: Reusable UI components
```
