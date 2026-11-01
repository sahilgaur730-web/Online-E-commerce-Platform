# Project: ShopKart Java Backend Remediations & Compliance Verification

## Architecture
ShopKart is a modular Spring Boot 3.3.4 (Java 17) e-commerce backend service with JPA, H2 (dev/test), PostgreSQL (prod), and Spring Security with JWT. The system includes multi-seller capabilities, atomic inventory management, checkout calculations, and payment gateway sandbox integration.

### Module & Boundary Architecture
- **Web & API Layer**: `com.shopkart.controller.*` (15 REST controllers handling Auth, Cart, Orders, Payments, Inventory, Admin).
- **Security Layer**: `com.shopkart.security.*`, `com.shopkart.config.SecurityConfig` (JWT filter, BCrypt, Role-based authorization, CORS, Frame options).
- **Domain & Service Layer**: `com.shopkart.service.*` (`InventoryService`, `OrderService`, `CartService`, `PaymentService`, `AuditService`).
- **Data & Repository Layer**: `com.shopkart.repository.*`, `com.shopkart.model.*` (JPA Entities with `@Version` optimistic locking, Flyway migrations).
- **Configuration & Initializer**: `com.shopkart.config.*`, `com.shopkart.init.DataInitializer`.

## Feature Inventory
Every feature and remediation requirement identified during the Step 0 Survey is cataloged below and assigned to a milestone.

| # | Feature / Work Item | Description | Milestone | Source |
|---|---------------------|-------------|-----------|--------|
| 1 | Bundled Maven Removal | Delete `.tools/apache-maven-3.9.6` (89 files, ~10.9 MB) from Git and disk | M1 | survey_3 |
| 2 | Maven Wrapper Standardization | Ensure wrapper scripts (`mvnw`, `mvnw.cmd`, `.mvn/wrapper/`) are fully operational at repo root and backend | M1 | survey_3 |
| 3 | Repository Git Hygiene | Update `.gitignore` (root and backend) to exclude `.env`, `*.env`, `!.env.example`, IDE metadata, binaries, and build targets | M1 | survey_3 |
| 4 | pom.xml Dependencies & Classpath Cleanliness | Verify test dependencies in `backend/pom.xml`, resolve `org.json:json` classpath duplicate warning | M1 | survey_3 |
| 5 | Frontend Isolation Verification | Verify `frontend/` remains clean and completely untouched throughout the lifecycle | M1 | survey_3 |
| 6 | JWT Secret Externalization | Remove hardcoded `9a3f2c4e...` from `application.properties` and `JwtUtils.java` `@Value` fallback; bind `${JWT_SECRET}` | M2 | survey_1 |
| 7 | Payment Sandbox Key Externalization | Remove hardcoded sandbox keys from `application.properties` and `PaymentService.java`; bind `${PAYMENT_SANDBOX_KEY}` | M2 | survey_1 |
| 8 | Multi-Environment Configuration Split | Restructure config into `application.yml`, `application-dev.yml`, and `application-prod.yml` | M2 | survey_1 |
| 9 | Environment Template Provision | Create `.env.example` at repo root and backend root documenting all required environment variables | M2 | survey_1 |
| 10 | Database Seeder Dev Restriction | Annotate `com.shopkart.init.DataInitializer` with `@Profile({"dev", "test"})` to disable in production | M2 | survey_2 |
| 11 | H2 Web Console & Frame Options Hardening | Restrict `/h2-console/**` to dev profile in `SecurityConfig`; enforce `sameOrigin()` frameOptions in prod | M2 | survey_2 |
| 12 | Test Configuration Isolation | Create `backend/src/test/resources/application-test.yml` with safe dummy credentials | M3 | survey_1, survey_3 |
| 13 | Inventory & Checkout Integration Tests | Author integration tests verifying stock deduction, insufficient stock rejection, atomic transaction rollback on failure, cart totals & delivery fee thresholds | M3 | survey_2 |
| 14 | Payment Workflow Integration Tests | Author integration tests verifying sandbox payment success (PLACED -> CONFIRMED), payment failure handling, order cancellation & stock restoration | M3 | survey_2 |
| 15 | Security & Profile Compliance Tests | Author security tests verifying 401/403 on unauthenticated checkout/payment, rejection of expired/tampered JWTs, and dev endpoint/seeder disablement in prod | M3 | survey_2 |
| 16 | Invigilator Compliance Documentation | Author comprehensive `INVIGILATOR_COMPLIANCE_REPORT.md` mapping every review requirement to files changed, tests created, and execution commands | M4 | original_request |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Build Tooling Standardization & Clean Repo | Remove `.tools`, set up Maven wrapper, clean `.gitignore`, verify `pom.xml`, verify `frontend/` untouched | none | DONE |
| M2 | Credential Security & Dev Endpoint Hardening | Externalize JWT & payment keys to `${JWT_SECRET}` & `${PAYMENT_SANDBOX_KEY}`, create YAML configs, `.env.example`, restrict `DataInitializer` & `/h2-console` | M1 | DONE |
| M3 | Automated Integration & Security Testing Suite | Create `application-test.yml`, author Inventory, Checkout, Payment, and Security tests from scratch; pass 100% tests | M2 | DONE |
| M4 | Invigilator Compliance Report & Forensic Audit | Write compliance report, conduct forensic audit, verify all acceptance criteria | M3 | DONE |

## Interface Contracts

### Configuration Properties Contract
- `jwt.secret`: bound to `${JWT_SECRET}` (mandatory in prod; defaults only in `application-test.yml`)
- `jwt.expirationMs`: bound to `${JWT_EXPIRATION_MS:86400000}`
- `payment.sandbox-key`: bound to `${PAYMENT_SANDBOX_KEY:}`
- `razorpay.key.id`: bound to `${PAYMENT_SANDBOX_KEY:${RAZORPAY_KEY_ID:}}`
- `razorpay.key.secret`: bound to `${RAZORPAY_KEY_SECRET:}`
- `razorpay.webhook.secret`: bound to `${RAZORPAY_WEBHOOK_SECRET:}`
- `spring.profiles.active`: defaults to `dev` if unspecified; `prod` in production; `test` in test runs.

### Endpoint Security & Profile Contract
- `/h2-console/**`: permitted ONLY when active profile is `dev` (`@Profile("dev")`); rejected (401/403/404) in `prod`.
- `DataInitializer`: instantiated ONLY under `@Profile({"dev", "test"})`; absent from `ApplicationContext` under `prod`.
- `/api/orders/**`, `/api/payments/**`, `/api/cart/**`: require valid, non-expired, non-tampered JWT bearer token; return 401 Unauthorized if unauthenticated, 403 Forbidden if deactivated.

### Transactional Rollback Contract
- `InventoryService.deductStock`: `@Transactional(propagation = Propagation.MANDATORY)`. Throws `BadRequestException` on insufficient stock.
- `OrderService.createOrder`: `@Transactional`. Iterative deduction across cart items must roll back atomically if any item fails stock deduction.

## Code Layout
```
c:\Users\SAHIL GAUR\Desktop\E-COMM\
├── .gitignore                                 # Updated root git exclusions
├── .env.example                               # Root environment template
├── mvnw                                       # Root Maven wrapper script (invoking backend/pom.xml)
├── mvnw.cmd                                   # Root Maven wrapper cmd script
├── .mvn/wrapper/                              # Root Maven wrapper configuration
├── INVIGILATOR_COMPLIANCE_REPORT.md           # Final compliance report (M4)
├── backend/
│   ├── .gitignore                             # Updated backend git exclusions
│   ├── .env.example                           # Backend environment template
│   ├── mvnw                                   # Backend Maven wrapper script
│   ├── mvnw.cmd                               # Backend Maven wrapper cmd script
│   ├── .mvn/wrapper/                          # Backend wrapper configuration
│   ├── pom.xml                                # Cleaned dependencies
│   └── src/
│       ├── main/
│       │   ├── java/com/shopkart/
│       │   │   ├── config/SecurityConfig.java # Hardened endpoints & frame options
│       │   │   ├── init/DataInitializer.java  # @Profile({"dev", "test"})
│       │   │   ├── security/JwtUtils.java     # Bound @Value("${jwt.secret}")
│       │   │   └── service/PaymentService.java# Bound ${PAYMENT_SANDBOX_KEY}
│       │   └── resources/
│       │       ├── application.yml            # Common configuration
│       │       ├── application-dev.yml        # Development profile (H2)
│       │       └── application-prod.yml       # Production profile (PostgreSQL)
│       └── test/
│           ├── java/com/shopkart/
│           │   ├── InventoryAndCheckoutIntegrationTests.java # M3: Stock, rollback, cart
│           │   ├── PaymentWorkflowIntegrationTests.java      # M3: Payment states & refund
│           │   └── SecurityAndProfileComplianceTests.java    # M3: Auth, tokens, prod profile
│           └── resources/
│               └── application-test.yml       # Safe test profile
└── frontend/                                  # STRICTLY UNTOUCHED
```
