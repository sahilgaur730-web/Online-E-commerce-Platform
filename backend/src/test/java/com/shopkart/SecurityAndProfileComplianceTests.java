package com.shopkart;

import com.shopkart.init.DataInitializer;
import com.shopkart.model.Role;
import com.shopkart.model.User;
import com.shopkart.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.NestedTestConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityAndProfileComplianceTests {

    @Autowired
    private MockMvc mockMvc;

    @Value("${jwt.secret}")
    private String jwtSecret;

    // =========================================================================
    // Helper Methods: Token Generation & Manipulation
    // =========================================================================

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    private String generateValidToken(String subject, Long userId, Role role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + 3600000); // 1 hour ahead
        return Jwts.builder()
                .subject(subject)
                .claim("id", userId)
                .claim("name", "Test User")
                .claim("role", role.name())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    private String generateExpiredToken(String subject, Long userId, Role role) {
        Date now = new Date();
        Date pastExpiry = new Date(now.getTime() - 3600000); // 1 hour ago
        Date pastIssued = new Date(now.getTime() - 7200000); // 2 hours ago
        return Jwts.builder()
                .subject(subject)
                .claim("id", userId)
                .claim("name", "Expired User")
                .claim("role", role.name())
                .issuedAt(pastIssued)
                .expiration(pastExpiry)
                .signWith(getSigningKey())
                .compact();
    }

    private String generateTamperedSignatureToken(String subject, Long userId, Role role) {
        String validToken = generateValidToken(subject, userId, role);
        int lastDot = validToken.lastIndexOf('.');
        int tamperIndex = lastDot + 10;
        char originalChar = validToken.charAt(tamperIndex);
        char replacedChar = (originalChar == 'a') ? 'b' : 'a';
        return validToken.substring(0, tamperIndex) + replacedChar + validToken.substring(tamperIndex + 1);
    }

    private String generateTamperedPayloadToken(String subject, Long userId, Role role) {
        String validToken = generateValidToken(subject, userId, role);
        String[] parts = validToken.split("\\.");
        String payload = parts[1];
        int tamperIndex = payload.length() / 2;
        char originalChar = payload.charAt(tamperIndex);
        char replacedChar = (originalChar == 'a') ? 'b' : 'a';
        String tamperedPayload = payload.substring(0, tamperIndex) + replacedChar + payload.substring(tamperIndex + 1);
        return parts[0] + "." + tamperedPayload + "." + parts[2];
    }

    // =========================================================================
    // Test 1: Unauthenticated Checkout Rejection
    // =========================================================================
    @Test
    @DisplayName("Test 1: Unauthenticated checkout (POST /api/orders) returns 401 Unauthorized")
    void testUnauthenticatedCheckoutReturns401() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shippingAddressId\":1,\"paymentMethod\":\"COD\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/orders"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // Test 2: Unauthenticated Payment Intent Creation Rejection
    // =========================================================================
    @Test
    @DisplayName("Test 2: Unauthenticated payment intent creation (POST /api/payments/create-intent) returns 401 Unauthorized")
    void testUnauthenticatedPaymentIntentReturns401() throws Exception {
        mockMvc.perform(post("/api/payments/create-intent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":1}"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // Test 3: Unauthenticated Payment Verification Rejection
    // =========================================================================
    @Test
    @DisplayName("Test 3: Unauthenticated payment verification (POST /api/payments/verify) returns 401 Unauthorized")
    void testUnauthenticatedPaymentVerifyReturns401() throws Exception {
        mockMvc.perform(post("/api/payments/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":1,\"transactionId\":\"pay_test123456\",\"success\":true}"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // Test 4: Expired JWT Token Rejection
    // =========================================================================
    @Test
    @DisplayName("Test 4: Expired JWT token rejection returns 401 Unauthorized")
    void testExpiredJwtTokenRejected() throws Exception {
        String expiredToken = generateExpiredToken("buyer@shopkart.com", 4L, Role.BUYER);

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + expiredToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shippingAddressId\":1,\"paymentMethod\":\"COD\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/payments/create-intent")
                        .header("Authorization", "Bearer " + expiredToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":1}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // Test 5: Tampered JWT Token Rejection
    // =========================================================================
    @Test
    @DisplayName("Test 5: Tampered JWT token rejection (signature & payload alterations) returns 401 Unauthorized")
    void testTamperedJwtTokenRejected() throws Exception {
        // Vector A: Tampered Signature
        String tamperedSigToken = generateTamperedSignatureToken("buyer@shopkart.com", 4L, Role.BUYER);
        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + tamperedSigToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shippingAddressId\":1,\"paymentMethod\":\"COD\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/payments/create-intent")
                        .header("Authorization", "Bearer " + tamperedSigToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":1}"))
                .andExpect(status().isUnauthorized());

        // Vector B: Tampered Payload
        String tamperedPayloadToken = generateTamperedPayloadToken("buyer@shopkart.com", 4L, Role.BUYER);
        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + tamperedPayloadToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shippingAddressId\":1,\"paymentMethod\":\"COD\"}"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // Test 6: Production Profile Endpoint Restrictions & Component Verification
    // =========================================================================
    @Nested
    @NestedTestConfiguration(NestedTestConfiguration.EnclosingConfiguration.OVERRIDE)
    @SpringBootTest
    @AutoConfigureMockMvc
    @ActiveProfiles("prod")
    @TestPropertySource(properties = {
            "SPRING_DATASOURCE_URL=jdbc:h2:mem:prodtestdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
            "SPRING_DATASOURCE_USERNAME=sa",
            "SPRING_DATASOURCE_PASSWORD=",
            "spring.datasource.url=jdbc:h2:mem:prodtestdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
            "spring.datasource.driverClassName=org.h2.Driver",
            "spring.datasource.driver-class-name=org.h2.Driver",
            "spring.datasource.username=sa",
            "spring.datasource.password=",
            "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
            "spring.jpa.hibernate.ddl-auto=create-drop",
            "spring.flyway.enabled=false",
            "spring.cache.type=simple",
            "REDIS_HOST=localhost",
            "spring.data.redis.host=localhost",
            "jwt.secret=c2hvcGthcnQtcHJvZC1jb21wbGlhbmNlLXRlc3Qtand0LXNlY3JldC0yNTZiaXRzLWtleSE=",
            "jwt.expirationMs=86400000"
    })
    class ProductionProfileComplianceTests {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ApplicationContext applicationContext;

        @Autowired
        private UserRepository userRepository;

        @Value("${jwt.secret}")
        private String prodSecret;

        private String getProdAdminToken() {
            User admin = userRepository.findByEmail("admin@shopkart.com")
                    .orElseGet(() -> userRepository.save(new User("Admin", "admin@shopkart.com", "$2a$10$abcdefghij", Role.ADMIN, "9876543210")));
            SecretKey key = Keys.hmacShaKeyFor(prodSecret.getBytes(StandardCharsets.UTF_8));
            return Jwts.builder()
                    .subject(admin.getEmail())
                    .claim("id", admin.getId())
                    .claim("name", admin.getName())
                    .claim("role", admin.getRole().name())
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + 3600000))
                    .signWith(key)
                    .compact();
        }

        @Test
        @DisplayName("Test 6A: Unauthenticated or authenticated /h2-console is blocked (401/403/404) in prod profile")
        void testH2ConsoleBlockedInProdProfile() throws Exception {
            // Unauthenticated request hits .denyAll() -> AuthenticationEntryPoint sends 401
            mockMvc.perform(get("/h2-console"))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        assertTrue(List.of(401, 403, 404).contains(status),
                                "Expected status 401, 403, or 404 for unauthenticated /h2-console under prod profile, but got: " + status);
                    });

            mockMvc.perform(get("/h2-console/login.jsp"))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        assertTrue(List.of(401, 403, 404).contains(status),
                                "Expected status 401, 403, or 404 for /h2-console subpath under prod profile, but got: " + status);
                    });

            // Authenticated request hits .denyAll() -> AccessDeniedHandler sends 403
            String adminToken = getProdAdminToken();
            mockMvc.perform(get("/h2-console")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        assertTrue(List.of(401, 403, 404).contains(status),
                                "Expected status 401, 403, or 404 for authenticated /h2-console under prod profile, but got: " + status);
                    });
        }

        @Test
        @DisplayName("Test 6B: DataInitializer bean is NOT loaded in ApplicationContext under prod profile")
        void testDataInitializerNotLoadedInProdProfile() {
            assertFalse(applicationContext.containsBean("dataInitializer"),
                    "DataInitializer bean must NOT be present in ApplicationContext when prod profile is active");

            assertThrows(NoSuchBeanDefinitionException.class,
                    () -> applicationContext.getBean(DataInitializer.class),
                    "DataInitializer bean definition must not exist under prod profile");
        }

        @Test
        @DisplayName("Test 6C: FrameOptions are set to SAMEORIGIN in prod profile")
        void testFrameOptionsSameOriginInProdProfile() throws Exception {
            mockMvc.perform(get("/api/products"))
                    .andExpect(header().string("X-Frame-Options", "SAMEORIGIN"));
        }

        @Test
        @DisplayName("Test 6D: Swagger UI endpoints (/swagger-ui/**, /swagger-ui.html) return 401 or 403 under prod profile")
        void testSwaggerUiBlockedInProdProfile() throws Exception {
            // Unauthenticated -> 401 Unauthorized or 403 Forbidden
            mockMvc.perform(get("/swagger-ui.html"))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        assertTrue(List.of(401, 403).contains(status), "Expected 401 or 403, got: " + status);
                    });

            mockMvc.perform(get("/swagger-ui/index.html"))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        assertTrue(List.of(401, 403).contains(status), "Expected 401 or 403, got: " + status);
                    });

            // Authenticated Admin -> 403 Forbidden
            String adminToken = getProdAdminToken();
            mockMvc.perform(get("/swagger-ui.html").header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isForbidden());

            mockMvc.perform(get("/swagger-ui/index.html").header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Test 6E: OpenAPI documentation (/v3/api-docs/**) returns 401 or 403 under prod profile")
        void testOpenApiDocsBlockedInProdProfile() throws Exception {
            // Unauthenticated -> 401 Unauthorized or 403 Forbidden
            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        assertTrue(List.of(401, 403).contains(status), "Expected 401 or 403, got: " + status);
                    });

            mockMvc.perform(get("/v3/api-docs/swagger-config"))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        assertTrue(List.of(401, 403).contains(status), "Expected 401 or 403, got: " + status);
                    });

            // Authenticated Admin -> 403 Forbidden
            String adminToken = getProdAdminToken();
            mockMvc.perform(get("/v3/api-docs").header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Test 6F: Actuator endpoints (/actuator/**) return 401 or 403 under prod profile")
        void testActuatorBlockedInProdProfile() throws Exception {
            // Unauthenticated -> 401 Unauthorized or 403 Forbidden
            mockMvc.perform(get("/actuator"))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        assertTrue(List.of(401, 403).contains(status), "Expected 401 or 403, got: " + status);
                    });

            mockMvc.perform(get("/actuator/health"))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        assertTrue(List.of(401, 403).contains(status), "Expected 401 or 403, got: " + status);
                    });

            mockMvc.perform(get("/actuator/env"))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        assertTrue(List.of(401, 403).contains(status), "Expected 401 or 403, got: " + status);
                    });

            // Authenticated Admin -> 403 Forbidden
            String adminToken = getProdAdminToken();
            mockMvc.perform(get("/actuator").header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get("/actuator/health").header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @NestedTestConfiguration(NestedTestConfiguration.EnclosingConfiguration.OVERRIDE)
    @SpringBootTest
    @AutoConfigureMockMvc
    @ActiveProfiles("dev")
    @TestPropertySource(properties = {
            "jwt.secret=9a3f2c4e6b8a1d0f5e7c2b4a6d8f0e1c3b5a7d9e1f3a5c7b9d1e3f5a7b9c1d3e",
            "jwt.expirationMs=86400000"
    })
    class DevProfileComplianceTests {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ApplicationContext applicationContext;

        @Test
        @DisplayName("Dev Profile: DataInitializer bean IS loaded")
        void testDataInitializerLoadedInDevProfile() {
            assertTrue(applicationContext.containsBean("dataInitializer"),
                    "DataInitializer bean must be present in ApplicationContext under dev profile");
        }

        @Test
        @DisplayName("Dev Profile: Dev endpoints are NOT rejected with 401 or 403 by Security")
        void testDevEndpointsPermittedInDevProfile() throws Exception {
            mockMvc.perform(get("/swagger-ui.html"))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        assertFalse(List.of(401, 403).contains(status),
                                "Dev endpoint should NOT return 401/403 under dev profile, got: " + status);
                    });

            mockMvc.perform(get("/v3/api-docs"))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        assertFalse(List.of(401, 403).contains(status),
                                "OpenAPI docs should NOT return 401/403 under dev profile, got: " + status);
                    });
        }
    }
}
