package com.shopkart.init;

import com.shopkart.model.*;
import com.shopkart.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderTrackingRepository orderTrackingRepository;
    private final ReviewRepository reviewRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UserRepository userRepository,
            AddressRepository addressRepository,
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            ProductImageRepository productImageRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            OrderTrackingRepository orderTrackingRepository,
            ReviewRepository reviewRepository,
            AuditLogRepository auditLogRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderTrackingRepository = orderTrackingRepository;
        this.reviewRepository = reviewRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            return; // Already seeded
        }

        // 1. Seed Users
        User admin = new User("ShopKart Admin", "admin@shopkart.com", passwordEncoder.encode("admin123"), Role.ADMIN, "9876500001");
        userRepository.save(admin);

        User seller1 = new User("Tech Retail India", "seller@shopkart.com", passwordEncoder.encode("seller123"), Role.SELLER, "9876500002");
        seller1.setStoreName("Tech Retail Hub");
        seller1.setStoreDescription("Authorized seller of top electronics, laptops, and audio gear.");
        userRepository.save(seller1);

        User seller2 = new User("StyleStreet Originals", "fashionhub@shopkart.com", passwordEncoder.encode("seller123"), Role.SELLER, "9876500003");
        seller2.setStoreName("StyleStreet Originals");
        seller2.setStoreDescription("Latest trendy fashion apparel, footwear, and accessories.");
        userRepository.save(seller2);

        User buyer = new User("Rahul Sharma", "buyer@shopkart.com", passwordEncoder.encode("buyer123"), Role.BUYER, "9876543210");
        userRepository.save(buyer);

        // 2. Buyer Address
        Address addr1 = new Address();
        addr1.setUser(buyer);
        addr1.setFullName("Rahul Sharma");
        addr1.setPhone("9876543210");
        addr1.setPincode("560103");
        addr1.setStreetAddress("Flat 402, Green Glen Heights, Outer Ring Road, Bellandur");
        addr1.setCity("Bengaluru");
        addr1.setState("Karnataka");
        addr1.setLandmark("Near Ecospace Tech Park");
        addr1.setAddressType("HOME");
        addr1.setDefault(true);
        addressRepository.save(addr1);

        Address addr2 = new Address();
        addr2.setUser(buyer);
        addr2.setFullName("Rahul Sharma (Office)");
        addr2.setPhone("9876543210");
        addr2.setPincode("560100");
        addr2.setStreetAddress("Building 4A, Embassy TechVillage, Devarabisanahalli");
        addr2.setCity("Bengaluru");
        addr2.setState("Karnataka");
        addr2.setLandmark("Tower 3, 5th Floor");
        addr2.setAddressType("WORK");
        addr2.setDefault(false);
        addressRepository.save(addr2);

        // 3. Seed Categories
        Category catMobiles = new Category("Mobiles & Tablets", "mobiles", "Smartphones, tablets & accessories", "Smartphone", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80", 1);
        Category catElectronics = new Category("Electronics", "electronics", "Laptops, audio, cameras & wearables", "Laptop", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&q=80", 2);
        Category catFashion = new Category("Fashion", "fashion", "Men, Women clothing and footwear", "Shirt", "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&q=80", 3);
        Category catHome = new Category("Home & Kitchen", "home-kitchen", "Furniture, kitchenware & decor", "Home", "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&q=80", 4);
        Category catAppliances = new Category("Appliances", "appliances", "TVs, washing machines, refrigerators", "Tv", "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&q=80", 5);
        Category catSports = new Category("Sports & Fitness", "sports-fitness", "Gym equipment, cycles & sportswear", "Dumbbell", "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&q=80", 6);

        categoryRepository.saveAll(List.of(catMobiles, catElectronics, catFashion, catHome, catAppliances, catSports));

        // 4. Seed Products
        List<Product> products = new ArrayList<>();

        // 1. iPhone 15
        Product p1 = createProduct(
                "Apple iPhone 15 (Blue, 128 GB)",
                "Super Retina XDR display with Dynamic Island. 48MP Main camera with 2x Telephoto. Durable color-infused glass and aluminum design. USB-C charging.",
                "Apple",
                new BigDecimal("69999"),
                new BigDecimal("79900"),
                12,
                45,
                4.6,
                2480,
                384,
                catMobiles,
                seller1,
                true, true, true,
                "Display: 6.1-inch Super Retina XDR\nProcessor: A16 Bionic chip\nCamera: 48MP Main + 12MP Ultra Wide\nBattery: Up to 20 hours video playback\nOS: iOS 17",
                List.of(
                        "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
                        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80"
                )
        );
        products.add(p1);

        // 2. Samsung Galaxy S24 Ultra
        Product p2 = createProduct(
                "SAMSUNG Galaxy S24 Ultra 5G (Titanium Gray, 256 GB)",
                "Galaxy AI is here. Search like never before, get quick language translation, and effortlessly edit your photos. Sturdy titanium frame with built-in S Pen.",
                "Samsung",
                new BigDecimal("121999"),
                new BigDecimal("134999"),
                10,
                28,
                4.7,
                1890,
                295,
                catMobiles,
                seller1,
                true, false, true,
                "Display: 6.8-inch Dynamic AMOLED 2X 120Hz\nProcessor: Snapdragon 8 Gen 3 for Galaxy\nCamera: 200MP + 50MP + 12MP + 10MP\nBattery: 5000 mAh\nStylus: Built-in S Pen",
                List.of(
                        "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
                        "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80"
                )
        );
        products.add(p2);

        // 3. OnePlus 12
        Product p3 = createProduct(
                "OnePlus 12 5G (Silky Black, 256 GB, 12 GB RAM)",
                "Powered by Snapdragon 8 Gen 3 with 4th Gen Hasselblad Camera for Mobile. 5400 mAh Battery with 100W SUPERVOOC fast charging.",
                "OnePlus",
                new BigDecimal("64999"),
                new BigDecimal("69999"),
                7,
                35,
                4.5,
                940,
                142,
                catMobiles,
                seller1,
                false, true, false,
                "Display: 6.82-inch 2K 120Hz ProXDR\nRAM/ROM: 12GB LPDDR5X / 256GB UFS 4.0\nCharging: 100W SuperVOOC\nCamera: 50MP Sony LYT-808",
                List.of(
                        "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&q=80"
                )
        );
        products.add(p3);

        // 4. Apple MacBook Air M3
        Product p4 = createProduct(
                "Apple 2024 MacBook Air 13.6-inch M3 (16GB RAM, 512GB SSD, Space Grey)",
                "Superfast M3 chip with 8-core CPU and 10-core GPU. Strikingly thin design with up to 18 hours of battery life and Liquid Retina display.",
                "Apple",
                new BigDecimal("124990"),
                new BigDecimal("134900"),
                7,
                18,
                4.8,
                620,
                88,
                catElectronics,
                seller1,
                true, false, true,
                "Chip: Apple M3 (8-core CPU, 10-core GPU)\nMemory: 16GB Unified Memory\nStorage: 512GB SSD\nDisplay: 13.6-inch Liquid Retina with True Tone\nBattery: Up to 18 Hours",
                List.of(
                        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
                        "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&q=80"
                )
        );
        products.add(p4);

        // 5. Sony WH-1000XM5 Headphones
        Product p5 = createProduct(
                "Sony WH-1000XM5 Wireless Industry Leading Noise Cancelling Headphones (Silver)",
                "Two processors control 8 microphones for unprecedented noise cancellation. Auto NC Optimizer. Crystal clear hands-free calling with 4 beamforming microphones.",
                "Sony",
                new BigDecimal("26990"),
                new BigDecimal("34990"),
                23,
                50,
                4.7,
                3410,
                510,
                catElectronics,
                seller1,
                true, true, true,
                "Noise Cancellation: Dual Processor V1 & QN1\nBattery: 30 hours with fast charge\nDriver: 30mm carbon fiber\nConnectivity: Multipoint Bluetooth 5.2",
                List.of(
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
                        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80"
                )
        );
        products.add(p5);

        // 6. Asus TUF Gaming A15
        Product p6 = createProduct(
                "ASUS TUF Gaming A15 (2024) AMD Ryzen 7 7735HS (16GB/512GB SSD/RTX 4060)",
                "Geared for serious gaming and real-world durability. Powered by NVIDIA GeForce RTX 4060 GPU and AMD Ryzen 7 processor with 144Hz FHD display.",
                "ASUS",
                new BigDecimal("89990"),
                new BigDecimal("115990"),
                22,
                14,
                4.4,
                480,
                67,
                catElectronics,
                seller1,
                false, true, true,
                "CPU: AMD Ryzen 7 7735HS\nGPU: NVIDIA GeForce RTX 4060 8GB GDDR6\nRAM: 16GB DDR5 4800MHz\nStorage: 512GB PCIe 4.0 NVMe SSD\nScreen: 15.6-inch 144Hz FHD IPS",
                List.of(
                        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80"
                )
        );
        products.add(p6);

        // 7. Nike Air Max 270
        Product p7 = createProduct(
                "Nike Air Max 270 Men's Running Shoes (Black/White)",
                "Nike's first lifestyle Air Max brings you style, comfort and big attitude in the Nike Air Max 270. The design draws inspiration from Air Max icons.",
                "Nike",
                new BigDecimal("11495"),
                new BigDecimal("13995"),
                18,
                30,
                4.5,
                1120,
                198,
                catFashion,
                seller2,
                true, true, false,
                "Outer Material: Breathable Engineered Mesh\nSole: Dual-density foam with Max Air 270 unit\nClosure: Lace-Up\nIdeal For: Men's Athletic & Casual",
                List.of(
                        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
                        "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600&q=80"
                )
        );
        products.add(p7);

        // 8. Levi's 511 Slim Fit Jeans
        Product p8 = createProduct(
                "Levi's Men 511 Slim Fit Mid Rise Stretch Jeans (Dark Indigo)",
                "A modern slim with room to move, the 511 Slim Fit Jeans are a classic since right now. These jeans are cut slim through the thigh with a straight leg.",
                "Levi's",
                new BigDecimal("2199"),
                new BigDecimal("3999"),
                45,
                60,
                4.3,
                2980,
                412,
                catFashion,
                seller2,
                false, true, true,
                "Fabric: 99% Cotton, 1% Elastane\nFit: Slim Fit\nRise: Mid Rise\nWash Care: Machine Wash Cold",
                List.of(
                        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80"
                )
        );
        products.add(p8);

        // 9. Philips Digital Air Fryer
        Product p9 = createProduct(
                "Philips Digital Air Fryer HD9252/90 (4.1 Liter, 1400W)",
                "Rapid Air Technology with unique starfish design swirls hot air to create delicious foods that are crispy on the outside and tender on the inside, with up to 90% less fat.",
                "Philips",
                new BigDecimal("7999"),
                new BigDecimal("11995"),
                33,
                25,
                4.6,
                5120,
                820,
                catHome,
                seller1,
                true, true, true,
                "Capacity: 4.1 Liters\nPower: 1400 Watts\nTouchscreen: 7 Presets\nTechnology: Rapid Air Technology\nWarranty: 2 Years Global Warranty",
                List.of(
                        "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&q=80"
                )
        );
        products.add(p9);

        // 10. LG 55-inch OLED TV
        Product p10 = createProduct(
                "LG 55-inch 4K Ultra HD Smart OLED TV (OLED55C3PSA)",
                "Self-lit OLED pixels bring infinite contrast and 100% color fidelity. α9 AI Processor Gen6 powers enhanced brightness and immersive sound.",
                "LG",
                new BigDecimal("114990"),
                new BigDecimal("174990"),
                34,
                8,
                4.8,
                410,
                73,
                catAppliances,
                seller1,
                true, false, true,
                "Screen Size: 55 Inches\nDisplay Tech: Self-Lit 4K OLED\nRefresh Rate: 120Hz Native\nProcessor: α9 AI Processor Gen6\nAudio: 40W Dolby Atmos",
                List.of(
                        "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&q=80"
                )
        );
        products.add(p10);

        // 5. Initial Seed Order for Buyer with full tracking history
        Order initialOrder = new Order();
        initialOrder.setOrderNumber("OD179124802194821");
        initialOrder.setBuyer(buyer);
        initialOrder.setTotalAmount(new BigDecimal("79900"));
        initialOrder.setDiscountAmount(new BigDecimal("9901"));
        initialOrder.setDeliveryFee(BigDecimal.ZERO);
        initialOrder.setFinalAmount(new BigDecimal("69999"));
        initialOrder.setPaymentMethod("UPI");
        initialOrder.setPaymentStatus(PaymentStatus.PAID);
        initialOrder.setPaymentTransactionId("TXN_UPI89218390192");
        initialOrder.setOrderStatus(OrderStatus.DELIVERED);
        initialOrder.setTrackingNumber("SK904812849");
        initialOrder.setShippingAddressSnapshot("Rahul Sharma, Phone: 9876543210, Flat 402, Green Glen Heights, Bengaluru, Karnataka - 560103 (HOME)");
        initialOrder.setCreatedAt(LocalDateTime.now().minusDays(3));

        Order savedOrder = orderRepository.save(initialOrder);

        OrderItem item1 = new OrderItem(
                savedOrder,
                p1,
                p1.getTitle(),
                p1.getImages().get(0).getImageUrl(),
                p1.getPrice(),
                1,
                p1.getPrice()
        );
        orderItemRepository.save(item1);
        savedOrder.setItems(List.of(item1));

        // Milestones
        OrderTracking t1 = new OrderTracking(savedOrder, OrderStatus.PLACED, "Order Placed", "Your order has been placed.");
        t1.setTimestamp(LocalDateTime.now().minusDays(3));
        OrderTracking t2 = new OrderTracking(savedOrder, OrderStatus.CONFIRMED, "Order Confirmed", "Seller confirmed the item.");
        t2.setTimestamp(LocalDateTime.now().minusDays(3).plusHours(2));
        OrderTracking t3 = new OrderTracking(savedOrder, OrderStatus.SHIPPED, "Shipped", "Dispatched from Bengaluru Fulfilment Center.");
        t3.setTimestamp(LocalDateTime.now().minusDays(2));
        OrderTracking t4 = new OrderTracking(savedOrder, OrderStatus.OUT_FOR_DELIVERY, "Out for Delivery", "Assigned to delivery agent (Arun Kumar).");
        t4.setTimestamp(LocalDateTime.now().minusDays(1).plusHours(4));
        OrderTracking t5 = new OrderTracking(savedOrder, OrderStatus.DELIVERED, "Delivered", "Delivered to recipient with OTP verification.");
        t5.setTimestamp(LocalDateTime.now().minusDays(1).plusHours(8));

        orderTrackingRepository.saveAll(List.of(t1, t2, t3, t4, t5));

        // 6. Seed Reviews
        Review r1 = new Review(p1, buyer, 5, "Exceeded expectations!", "The camera quality on the iPhone 15 is sensational. Delivery was crisp within 2 days. 100% genuine product.", true);
        reviewRepository.save(r1);

        Review r2 = new Review(p5, buyer, 5, "Best noise cancellation ever", "Blocks out office chatter and engine noise completely. Battery easily lasts 3 full days of heavy usage.", true);
        reviewRepository.save(r2);

        // 7. Audit log initial entries
        auditLogRepository.save(new AuditLog("SYSTEM_INITIALIZED", "SYSTEM", "Initial database seeded with Flipkart catalog and users", "SYSTEM", 1L));
        auditLogRepository.save(new AuditLog("ORDER_DELIVERED", "SYSTEM", "Order OD179124802194821 delivered to Rahul Sharma", "ORDER", savedOrder.getId()));
    }

    private Product createProduct(
            String title,
            String desc,
            String brand,
            BigDecimal price,
            BigDecimal origPrice,
            int discount,
            int stock,
            Double rating,
            int ratingCount,
            int reviewCount,
            Category cat,
            User seller,
            boolean featured,
            boolean dealOfTheDay,
            boolean topOffer,
            String specs,
            List<String> imageUrls) {

        Product p = new Product();
        p.setTitle(title);
        p.setDescription(desc);
        p.setBrand(brand);
        p.setPrice(price);
        p.setOriginalPrice(origPrice);
        p.setDiscountPercentage(discount);
        p.setStock(stock);
        p.setRating(rating);
        p.setRatingCount(ratingCount);
        p.setReviewCount(reviewCount);
        p.setCategory(cat);
        p.setSeller(seller);
        p.setFeatured(featured);
        p.setDealOfTheDay(dealOfTheDay);
        p.setTopOffer(topOffer);
        p.setSpecifications(specs);

        Product saved = productRepository.save(p);

        List<ProductImage> imgs = new ArrayList<>();
        for (int i = 0; i < imageUrls.size(); i++) {
            ProductImage img = new ProductImage(saved, imageUrls.get(i), i == 0, i);
            imgs.add(img);
        }
        productImageRepository.saveAll(imgs);
        saved.setImages(imgs);

        return saved;
    }
}
