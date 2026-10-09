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
    private final SubOrderRepository subOrderRepository;
    private final ReviewRepository reviewRepository;
    private final AuditLogRepository auditLogRepository;
    private final FlashDealRepository flashDealRepository;
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
            SubOrderRepository subOrderRepository,
            ReviewRepository reviewRepository,
            AuditLogRepository auditLogRepository,
            FlashDealRepository flashDealRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderTrackingRepository = orderTrackingRepository;
        this.subOrderRepository = subOrderRepository;
        this.reviewRepository = reviewRepository;
        this.auditLogRepository = auditLogRepository;
        this.flashDealRepository = flashDealRepository;
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

        // 11. Google Pixel 9 Pro
        Product p11 = createProduct(
                "Google Pixel 9 Pro 5G (Obsidian, 256 GB, 16 GB RAM)",
                "Engineered by Google with Tensor G4 processor and Gemini AI built in. Triple pro camera system with 50MP main and 30x Super Res Zoom. 24-hour battery with Extreme Battery Saver.",
                "Google",
                new BigDecimal("109999"),
                new BigDecimal("124999"),
                12,
                22,
                4.7,
                840,
                112,
                catMobiles,
                seller1,
                true, false, true,
                "Display: 6.8-inch Super Actua OLED 1-120Hz\nProcessor: Google Tensor G4 with Titan M2 security\nCamera: 50MP Octa PD + 48MP Quad PD Ultra Wide + 48MP 5x Telephoto\nBattery: 5060 mAh with 45W Fast Charging\nOS: Android 15 with 7 years of OS updates",
                List.of(
                        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
                        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80"
                )
        );
        products.add(p11);

        // 12. Apple AirPods Pro 2
        Product p12 = createProduct(
                "Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)",
                "Up to 2x more Active Noise Cancellation than the previous generation. Transparency mode lets you comfortably hear and interact with the world around you. Personalized Spatial Audio with dynamic head tracking.",
                "Apple",
                new BigDecimal("20999"),
                new BigDecimal("24900"),
                15,
                40,
                4.8,
                4210,
                630,
                catElectronics,
                seller1,
                true, true, true,
                "Chip: Apple H2 headphone chip\nNoise Cancellation: Adaptive Audio & Active Noise Cancellation\nCase: MagSafe Charging Case (USB-C) with speaker and lanyard loop\nBattery Life: Up to 6 hours listening time on single charge, up to 30 hours with case\nWater Resistance: IP54 dust, sweat, and water resistant",
                List.of(
                        "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=80",
                        "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=600&q=80"
                )
        );
        products.add(p12);

        // 13. Bose QuietComfort Ultra
        Product p13 = createProduct(
                "Bose QuietComfort Ultra Wireless Noise Cancelling Headphones (Black)",
                "World-class noise cancellation, quieter than ever before. Breakthrough spatialized audio for more immersive listening that makes music feel more real. CustomTune technology shapes audio to your ears.",
                "Bose",
                new BigDecimal("31999"),
                new BigDecimal("35900"),
                10,
                15,
                4.6,
                920,
                140,
                catElectronics,
                seller1,
                false, false, true,
                "Modes: Quiet, Aware, and Immersion modes\nMicrophones: Advanced microphone array for clear calls\nBattery: Up to 24 hours playback (up to 18 hours with Immersive Audio)\nBluetooth: Bluetooth 5.3 with multipoint connection\nMaterials: Ultra-soft protein leather ear cushions and lightweight aluminum headband",
                List.of(
                        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80"
                )
        );
        products.add(p13);

        // 14. Dell XPS 15
        Product p14 = createProduct(
                "Dell XPS 15 (9530) Intel Core i7-13700H (16GB RAM/1TB SSD/RTX 4050 6GB/OLED 3.5K Touch)",
                "Stunning 15.6-inch 3.5K OLED InfinityEdge touch display with 100% DCI-P3 color gamut. Precision-machined CNC aluminum chassis with carbon-fiber palm rest.",
                "Dell",
                new BigDecimal("184990"),
                new BigDecimal("209990"),
                11,
                8,
                4.7,
                310,
                45,
                catElectronics,
                seller1,
                true, false, false,
                "Processor: 13th Gen Intel Core i7-13700H (14 cores, up to 5.0 GHz)\nGraphics: NVIDIA GeForce RTX 4050 6GB GDDR6\nMemory: 16GB DDR5 4800MHz Dual-Channel\nStorage: 1TB M.2 PCIe NVMe Gen 4 SSD\nDisplay: 15.6\" 3.5K (3456x2160) OLED Touch 400-nit\nWeight: 1.92 kg",
                List.of(
                        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&q=80",
                        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80"
                )
        );
        products.add(p14);

        // 15. Lenovo Legion Pro 5i
        Product p15 = createProduct(
                "Lenovo Legion Pro 5i Gen 9 Intel Core i9-14900HX (32GB/1TB SSD/RTX 4070 8GB/240Hz WQXGA)",
                "Built for hardcore esports and heavy workstation tasks. Features AI-tuned Legion ColdFront 5.0 thermal cooling and Lenovo PureSight 240Hz HDR400 display.",
                "Lenovo",
                new BigDecimal("162990"),
                new BigDecimal("194990"),
                16,
                12,
                4.8,
                520,
                88,
                catElectronics,
                seller1,
                false, true, true,
                "Processor: Intel Core i9-14900HX (24 cores, up to 5.8 GHz)\nGraphics: NVIDIA GeForce RTX 4070 8GB GDDR6 (140W TGP)\nMemory: 32GB (2x 16GB) DDR5 5600MHz\nStorage: 1TB SSD M.2 2280 PCIe Gen4 TLC\nDisplay: 16\" WQXGA (2560x1600) IPS 500nits 240Hz 100% sRGB\nKeyboard: 4-Zone RGB Backlit",
                List.of(
                        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80",
                        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&q=80"
                )
        );
        products.add(p15);

        // 16. Zara Structured Blazer
        Product p16 = createProduct(
                "Zara Men's Tailored Structured Wool-Blend Blazer (Charcoal Navy)",
                "Slim-fit structured blazer featuring a lapel collar, long sleeves with buttoned cuffs, front flap pockets, chest welt pocket, and back vent. Modern formal elegance.",
                "Zara",
                new BigDecimal("6990"),
                new BigDecimal("9990"),
                30,
                35,
                4.4,
                680,
                94,
                catFashion,
                seller2,
                true, false, false,
                "Outer Shell: 55% Wool, 41% Polyester, 4% Elastane\nLining: 100% Viscose\nFit: Contemporary Slim Fit\nClosure: Double button front fastening\nCare: Dry clean only",
                List.of(
                        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
                        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80"
                )
        );
        products.add(p16);

        // 17. Ray-Ban Aviators
        Product p17 = createProduct(
                "Ray-Ban Aviator Classic Polarized Sunglasses (Gold Frame / G-15 Green Lens)",
                "Originally designed for U.S. aviators in 1937. Legendary teardrop shaped pilot frames combined with polarized crystal green G-15 lenses providing 100% UV protection and exceptional optical clarity.",
                "Ray-Ban",
                new BigDecimal("10190"),
                new BigDecimal("12590"),
                19,
                50,
                4.7,
                1840,
                310,
                catFashion,
                seller2,
                false, true, true,
                "Frame Material: High-grade Monel Metal (Polished Gold)\nLens Material: Polarized Mineral Glass (Classic Green G-15)\nLens Width & Bridge: 58mm - 14mm\nTemple Length: 135mm\nUV Protection: 100% UV400 Protection",
                List.of(
                        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80",
                        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80"
                )
        );
        products.add(p17);

        // 18. adidas Ultraboost Light
        Product p18 = createProduct(
                "adidas Ultraboost Light Running Shoes (Core Black / Solar Red)",
                "Experience epic energy in the lightest Ultraboost ever made. Features 30% lighter Light BOOST material engineered with tiny capsules that burst with energy on every stride.",
                "adidas",
                new BigDecimal("13999"),
                new BigDecimal("18999"),
                26,
                28,
                4.6,
                1450,
                220,
                catFashion,
                seller2,
                true, false, true,
                "Upper: adidas PRIMEKNIT+ textile containing 50% Parley Ocean Plastic\nMidsole: Light BOOST cushioning with Linear Energy Push system\nOutsole: Continental Better Rubber for superior grip\nDrop: 10 mm (Heel: 30 mm / Forefoot: 20 mm)\nWeight: 299 g (Size UK 8.5)",
                List.of(
                        "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&q=80",
                        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80"
                )
        );
        products.add(p18);

        // 19. Air Jordan Retro 4 "Bred"
        Product p19 = createProduct(
                "Nike Air Jordan 4 Retro Reimagined 'Bred' (Black/Fire Red/Cement Grey)",
                "The icon returns in premium supple leather, celebrating the 35th anniversary of Michael Jordan's legendary 1989 silhouette with the classic 'Nike Air' heel branding.",
                "Nike",
                new BigDecimal("19995"),
                new BigDecimal("22995"),
                13,
                10,
                4.9,
                780,
                165,
                catFashion,
                seller2,
                true, false, true,
                "Upper: Premium full-grain tumbled leather\nMidsole: Polyurethane with visible Air-Sole unit in heel and encapsulated forefoot unit\nOutsole: Herringbone pattern rubber outsole with flex grooves\nCollar: Padded collar and molded eyelets",
                List.of(
                        "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&q=80",
                        "https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=600&q=80"
                )
        );
        products.add(p19);

        // 20. Dyson V15 Detect
        Product p20 = createProduct(
                "Dyson V15 Detect Absolute Cordless Vacuum Cleaner (Yellow/Iron)",
                "Dyson's most powerful, intelligent cordless vacuum with laser illumination revealing invisible dust on hard floors and piezo sensor that automatically adjusts suction power.",
                "Dyson",
                new BigDecimal("57900"),
                new BigDecimal("65900"),
                12,
                18,
                4.8,
                650,
                95,
                catAppliances,
                seller1,
                true, false, true,
                "Suction Power: 240 AW (Air Watts) Hyperdymium motor\nRun Time: Up to 60 minutes fade-free power\nFiltration: Whole-machine HEPA filtration capturing 99.99% of particles down to 0.1 microns\nDustbin Volume: 0.77 Liters\nWeight: 3.1 kg",
                List.of(
                        "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80"
                )
        );
        products.add(p20);

        // 21. Instant Pot Duo Plus
        Product p21 = createProduct(
                "Instant Pot Duo Plus 9-in-1 Multi-Use Electric Pressure Cooker (5.7 Liter, 1000W)",
                "Replaces 9 kitchen appliances: pressure cooker, slow cooker, rice cooker, yogurt maker, steamer, sauté pan, sous vide, sterilizer, and food warmer. Easy-release steam switch.",
                "Instant Pot",
                new BigDecimal("9499"),
                new BigDecimal("14999"),
                36,
                32,
                4.7,
                3820,
                540,
                catHome,
                seller1,
                false, true, true,
                "Capacity: 5.7 Liters (Serves up to 6 people)\nPower: 1000 Watts\nSmart Programs: 15 one-touch presets\nInner Pot: Food-grade 304 (18/8) stainless steel with tri-ply bottom\nSafety: Over 10 proven safety features including Overheat Protection",
                List.of(
                        "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80",
                        "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&q=80"
                )
        );
        products.add(p21);

        // 22. Samsung 653L Side-by-Side Refrigerator
        Product p22 = createProduct(
                "Samsung 653 L Convertible 5-in-1 Digital Inverter Side-by-Side Refrigerator (Gentle Silver Matte)",
                "AI Energy mode optimizes compressor speed and defrost cycle, saving up to 10% energy. SpaceMax technology creates thinner walls for extra interior capacity without increasing external dimensions.",
                "Samsung",
                new BigDecimal("82990"),
                new BigDecimal("113000"),
                26,
                7,
                4.6,
                410,
                62,
                catAppliances,
                seller1,
                true, false, true,
                "Total Capacity: 653 Liters (Fridge: 409L / Freezer: 244L)\nCompressor: Digital Inverter Compressor with 20 Years Warranty\nCooling: Twin Cooling Plus & Multi Air Flow\nSmart Features: Built-in Wi-Fi & SmartThings app integration\nFinish: Gentle Silver Matte Luxe",
                List.of(
                        "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&q=80"
                )
        );
        products.add(p22);

        // 23. Bowflex SelectTech 552 Dumbbells (Sports & Fitness)
        Product p23 = createProduct(
                "Bowflex SelectTech 552 Adjustable Dumbbells (Pair, 2kg - 24kg)",
                "Combines 15 sets of weights into one with unique dial system. Easily switch from 2 kg to 24 kg with the turn of a dial. Space-efficient and durable molding.",
                "Bowflex",
                new BigDecimal("29999"),
                new BigDecimal("39999"),
                25,
                15,
                4.8,
                840,
                112,
                catSports,
                seller1,
                true, false, true,
                "Weight Range: 2 to 24 kg (5 to 52.5 lbs) per dumbbell\nWeight Settings: 15 increments\nDimensions: 43 x 21 x 23 cm\nMaterial: High-durability steel with thermoplastic rubber coating\nWarranty: 2 Years Manufacturer Warranty",
                List.of(
                        "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&q=80",
                        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=80"
                )
        );
        products.add(p23);

        // 24. Garmin Forerunner 265 (Sports & Fitness)
        Product p24 = createProduct(
                "Garmin Forerunner 265 Running Smartwatch (Black / Powder Grey AMOLED)",
                "Brilliant AMOLED touchscreen display with traditional button controls. Advanced training metrics, recovery insights, Morning Report, and up to 13 days of battery life.",
                "Garmin",
                new BigDecimal("42990"),
                new BigDecimal("50490"),
                15,
                20,
                4.7,
                520,
                78,
                catSports,
                seller1,
                true, true, true,
                "Display: 1.3-inch AMOLED (416 x 416 pixels) with Gorilla Glass 3\nBattery Life: Up to 13 days smartwatch mode / 20 hours GPS mode\nSensors: Multi-band GPS, Wrist-based Heart Rate, Pulse Ox, Barometric Altimeter\nWater Rating: 5 ATM (50 meters)\nWeight: 47 g",
                List.of(
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
                        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&q=80"
                )
        );
        products.add(p24);

        // 25. Decathlon Triban RC 120 Disc Road Bike (Sports & Fitness)
        Product p25 = createProduct(
                "Decathlon Triban RC 120 Disc Road Bike (Navy Blue / Medium Frame)",
                "Versatile road bike designed for long distance touring and fitness riding. Equipped with mechanical disc brakes, ergonomic aluminum frame, and carbon fork for vibration dampening.",
                "Decathlon",
                new BigDecimal("34999"),
                new BigDecimal("39999"),
                13,
                10,
                4.5,
                310,
                45,
                catSports,
                seller2,
                false, false, true,
                "Frame: 6061 T6 Aluminum comfort-oriented geometry\nFork: Carbon blades with aluminum 1-1/8\" headset\nDrivetrain: Microshift 2x8 speed with integrated brake levers\nBrakes: Promax DSK-300R mechanical disc brakes (160mm rotors)\nTires: Triban Resist Protect 700x28c puncture-resistant",
                List.of(
                        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80",
                        "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=600&q=80"
                )
        );
        products.add(p25);

        // 26. Lululemon The Mat 5mm (Sports & Fitness)
        Product p26 = createProduct(
                "Lululemon The Mat 5mm Premium Natural Rubber Yoga Mat (Midnight Shadow)",
                "Designed for yoga and intensive floor workouts. Features a grippy natural rubber base and polyurethane top layer that absorbs sweat for superior traction during sweaty sessions.",
                "Lululemon",
                new BigDecimal("7990"),
                new BigDecimal("9490"),
                16,
                35,
                4.8,
                680,
                92,
                catSports,
                seller2,
                false, true, false,
                "Dimensions: 66 cm x 180 cm (26\" x 71\")\nThickness: 5 mm (extra cushioning for joints)\nMaterial: 61% Natural Rubber, 17% Synthetic Rubber, 15% Polyurethane, 5% Polyester\nFeatures: Anti-microbial additive, reversible textured grip\nWeight: 2.38 kg",
                List.of(
                        "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&q=80",
                        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80"
                )
        );
        products.add(p26);

        // 27. Sony PlayStation 5 Slim (Electronics)
        Product p27 = createProduct(
                "Sony PlayStation 5 Slim Digital Edition Console (1TB SSD, DualSense Wireless)",
                "Slimmed-down design packing powerful gaming performance. Harness the power of a custom CPU, GPU, and ultra-high-speed SSD with integrated I/O that rewrite the rules of what a PlayStation console can do.",
                "Sony",
                new BigDecimal("44990"),
                new BigDecimal("49990"),
                10,
                18,
                4.9,
                2950,
                410,
                catElectronics,
                seller1,
                true, false, true,
                "Storage: 1TB Custom NVMe SSD (up to 5.5GB/s raw)\nResolution: 4K 120Hz output with HDR & Ray Tracing support\nAudio: Tempest 3D AudioTech\nConnectivity: Wi-Fi 6, Gigabit Ethernet, 2x USB-C ports\nIn the Box: PS5 Slim Console, DualSense Wireless Controller, HDMI 2.1 cable",
                List.of(
                        "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&q=80",
                        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&q=80"
                )
        );
        products.add(p27);

        // 28. Apple iPad Air 11-inch M2 (Mobiles & Tablets)
        Product p28 = createProduct(
                "Apple iPad Air 11-inch (M2 Chip, Wi-Fi, 128GB - Space Grey)",
                "Supercharged by the blazing-fast Apple M2 chip. Features an 11-inch Liquid Retina display, landscape 12MP front camera with Center Stage, and support for Apple Pencil Pro.",
                "Apple",
                new BigDecimal("59900"),
                new BigDecimal("64900"),
                8,
                25,
                4.8,
                1120,
                145,
                catMobiles,
                seller1,
                true, false, true,
                "Chip: Apple M2 (8-core CPU, 10-core GPU, 16-core Neural Engine)\nDisplay: 11-inch Liquid Retina with P3 wide color and True Tone\nCamera: 12MP Wide back camera, landscape 12MP Ultra Wide front camera\nSecurity: Touch ID built into top button\nBattery: Up to 10 hours of web surfing on Wi-Fi",
                List.of(
                        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
                        "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&q=80"
                )
        );
        products.add(p28);

        // 29. Philips Hue Gradient Lightstrip (Home & Kitchen)
        Product p29 = createProduct(
                "Philips Hue Play Gradient Smart Lightstrip for 55-65\" TV (RGB Bluetooth + Zigbee)",
                "Takes surround lighting to the next level with seamless gradient color blending. Syncs with screen content and music for an immersive entertainment setup.",
                "Philips",
                new BigDecimal("17999"),
                new BigDecimal("22999"),
                22,
                14,
                4.6,
                390,
                52,
                catHome,
                seller1,
                false, true, false,
                "Compatibility: Designed for 55 to 65 inch TVs\nColor Capabilities: 16 Million Colors + Multiple colors displayed simultaneously\nLifetime: 25,000 hours\nSmart Connectivity: Bluetooth & Philips Hue Bridge (Zigbee)\nPower: 20W LED fixture",
                List.of(
                        "https://images.unsplash.com/photo-1550985616-10810253b84d?w=600&q=80",
                        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80"
                )
        );
        products.add(p29);

        // 30. LG 55\" OLED evo C3 TV (Appliances)
        Product p30 = createProduct(
                "LG 55-inch OLED evo C3 Series 4K Smart TV (OLED55C3PSA, 120Hz, Dolby Vision)",
                "Self-lit OLED pixels with Brightness Booster. α9 AI Processor Gen6 delivers enhanced clarity and depth. Ultra-slim bezel design with native 120Hz refresh rate and 4 HDMI 2.1 ports for pro gaming.",
                "LG",
                new BigDecimal("119990"),
                new BigDecimal("169990"),
                29,
                8,
                4.8,
                880,
                120,
                catAppliances,
                seller1,
                true, false, true,
                "Display: 55-inch 4K Self-Lit OLED evo (3840 x 2160)\nProcessor: α9 AI Processor Gen6 4K\nGaming: 0.1ms response time, NVIDIA G-Sync, AMD FreeSync Premium, 4x HDMI 2.1 (4K@120Hz)\nAudio: 40W 2.2 Channel Dolby Atmos & AI Sound Pro (Virtual 9.1.2 up-mix)\nOS: webOS 23 with ThinQ AI & Magic Remote",
                List.of(
                        "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&q=80",
                        "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=600&q=80"
                )
        );
        products.add(p30);

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

        SubOrder subOrder1 = new SubOrder(savedOrder, seller1, savedOrder.getOrderNumber() + "-PKG1", p1.getPrice(), "PKG904812849");
        subOrder1.setStatus(OrderStatus.DELIVERED);
        subOrderRepository.save(subOrder1);
        item1.setSubOrder(subOrder1);
        orderItemRepository.save(item1);
        subOrder1.setItems(List.of(item1));

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
        auditLogRepository.save(new AuditLog("SYSTEM_INITIALIZED", "SYSTEM", "Initial database seeded with ShopKart catalog and users", "SYSTEM", 1L));
        auditLogRepository.save(new AuditLog("ORDER_DELIVERED", "SYSTEM", "Order OD179124802194821 delivered to Rahul Sharma", "ORDER", savedOrder.getId()));

        // 8. Seed Initial Live Flash Deals synchronized with UTC
        java.time.Instant nowUtc = java.time.Instant.now();
        java.time.Instant dealEndUtc = nowUtc.plus(14, java.time.temporal.ChronoUnit.HOURS)
                .plus(22, java.time.temporal.ChronoUnit.MINUTES)
                .plus(45, java.time.temporal.ChronoUnit.SECONDS);
        List<Product> dealProducts = productRepository.findByDealOfTheDayTrue();
        for (Product dp : dealProducts) {
            FlashDeal fd = new FlashDeal(
                    dp,
                    dp.getPrice(),
                    dp.getOriginalPrice() != null ? dp.getOriginalPrice() : dp.getPrice(),
                    dp.getDiscountPercentage(),
                    nowUtc.minus(2, java.time.temporal.ChronoUnit.HOURS),
                    dealEndUtc,
                    Math.max(dp.getStock(), 30)
            );
            flashDealRepository.save(fd);
        }
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
