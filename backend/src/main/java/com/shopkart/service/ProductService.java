package com.shopkart.service;

import com.shopkart.common.BadRequestException;
import com.shopkart.common.ResourceNotFoundException;
import com.shopkart.dto.ProductCreateRequest;
import com.shopkart.dto.ProductDto;
import com.shopkart.model.*;
import com.shopkart.repository.CategoryRepository;
import com.shopkart.repository.ProductImageRepository;
import com.shopkart.repository.ProductRepository;
import com.shopkart.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ProductImageRepository productImageRepository;
    private final AuditService auditService;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository,
            ProductImageRepository productImageRepository,
            AuditService auditService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.productImageRepository = productImageRepository;
        this.auditService = auditService;
    }

    public Page<ProductDto> searchProducts(
            String keyword,
            Long categoryId,
            String brand,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Double minRating,
            String sortBy,
            String sortDir,
            int page,
            int size) {

        Sort sort = Sort.by("id").descending();
        if (sortBy != null && !sortBy.isBlank()) {
            Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
            switch (sortBy.toLowerCase()) {
                case "price_asc":
                    sort = Sort.by(Sort.Direction.ASC, "price");
                    break;
                case "price_desc":
                    sort = Sort.by(Sort.Direction.DESC, "price");
                    break;
                case "rating":
                    sort = Sort.by(Sort.Direction.DESC, "rating");
                    break;
                case "newest":
                    sort = Sort.by(Sort.Direction.DESC, "createdAt");
                    break;
                case "popularity":
                    sort = Sort.by(Sort.Direction.DESC, "ratingCount");
                    break;
                default:
                    sort = Sort.by(direction, sortBy);
                    break;
            }
        }

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Product> productPage = productRepository.searchProducts(
                (keyword != null && !keyword.isBlank()) ? keyword.trim() : null,
                categoryId,
                (brand != null && !brand.isBlank()) ? brand.trim() : null,
                minPrice,
                maxPrice,
                minRating,
                pageable
        );

        return productPage.map(this::toDto);
    }

    public ProductDto getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return toDto(product);
    }

    public List<ProductDto> getFeaturedProducts() {
        return productRepository.findByFeaturedTrue().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ProductDto> getDealsOfTheDay() {
        return productRepository.findByDealOfTheDayTrue().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ProductDto> getTopOffers() {
        return productRepository.findByTopOfferTrue().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ProductDto> getProductsBySeller(Long sellerId) {
        return productRepository.findBySellerIdOrderByCreatedAtDesc(sellerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<String> getBrandsByCategory(Long categoryId) {
        return productRepository.findDistinctBrandsByCategory(categoryId);
    }

    @Transactional
    public ProductDto createProduct(ProductCreateRequest req, Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));

        Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Product product = new Product();
        product.setTitle(req.getTitle());
        product.setDescription(req.getDescription());
        product.setBrand(req.getBrand());
        product.setPrice(req.getPrice());
        product.setOriginalPrice(req.getOriginalPrice() != null ? req.getOriginalPrice() : req.getPrice());

        if (product.getOriginalPrice().compareTo(product.getPrice()) > 0) {
            BigDecimal diff = product.getOriginalPrice().subtract(product.getPrice());
            int discount = diff.multiply(BigDecimal.valueOf(100))
                    .divide(product.getOriginalPrice(), 0, RoundingMode.HALF_UP)
                    .intValue();
            product.setDiscountPercentage(discount);
        } else {
            product.setDiscountPercentage(0);
        }

        product.setStock(req.getStock());
        product.setCategory(category);
        product.setSeller(seller);
        product.setSpecifications(req.getSpecifications());
        product.setFeatured(req.isFeatured());
        product.setDealOfTheDay(req.isDealOfTheDay());
        product.setTopOffer(req.isTopOffer());

        Product saved = productRepository.save(product);

        if (req.getImageUrls() != null && !req.getImageUrls().isEmpty()) {
            List<ProductImage> imageEntities = new ArrayList<>();
            for (int i = 0; i < req.getImageUrls().size(); i++) {
                ProductImage img = new ProductImage(saved, req.getImageUrls().get(i), i == 0, i);
                imageEntities.add(img);
            }
            productImageRepository.saveAll(imageEntities);
            saved.setImages(imageEntities);
        }

        auditService.log("PRODUCT_CREATED", seller.getEmail(), "Created product: " + saved.getTitle(), "PRODUCT", saved.getId());

        return toDto(saved);
    }

    @Transactional
    public ProductDto updateProduct(Long productId, ProductCreateRequest req, Long sellerId, boolean isAdmin) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!isAdmin && !product.getSeller().getId().equals(sellerId)) {
            throw new BadRequestException("You do not have permission to edit this product");
        }

        Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        product.setTitle(req.getTitle());
        product.setDescription(req.getDescription());
        product.setBrand(req.getBrand());
        product.setPrice(req.getPrice());
        product.setOriginalPrice(req.getOriginalPrice() != null ? req.getOriginalPrice() : req.getPrice());

        if (product.getOriginalPrice().compareTo(product.getPrice()) > 0) {
            BigDecimal diff = product.getOriginalPrice().subtract(product.getPrice());
            int discount = diff.multiply(BigDecimal.valueOf(100))
                    .divide(product.getOriginalPrice(), 0, RoundingMode.HALF_UP)
                    .intValue();
            product.setDiscountPercentage(discount);
        }

        product.setStock(req.getStock());
        product.setCategory(category);
        product.setSpecifications(req.getSpecifications());
        product.setFeatured(req.isFeatured());
        product.setDealOfTheDay(req.isDealOfTheDay());
        product.setTopOffer(req.isTopOffer());
        product.setUpdatedAt(LocalDateTime.now());

        if (req.getImageUrls() != null && !req.getImageUrls().isEmpty()) {
            product.getImages().clear();
            for (int i = 0; i < req.getImageUrls().size(); i++) {
                ProductImage img = new ProductImage(product, req.getImageUrls().get(i), i == 0, i);
                product.getImages().add(img);
            }
        }

        Product saved = productRepository.save(product);
        auditService.log("PRODUCT_UPDATED", product.getSeller().getEmail(), "Updated product: " + saved.getTitle(), "PRODUCT", saved.getId());

        return toDto(saved);
    }

    @Transactional
    public void deleteProduct(Long productId, Long sellerId, boolean isAdmin) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!isAdmin && !product.getSeller().getId().equals(sellerId)) {
            throw new BadRequestException("You do not have permission to delete this product");
        }

        auditService.log("PRODUCT_DELETED", product.getSeller().getEmail(), "Deleted product: " + product.getTitle(), "PRODUCT", product.getId());
        productRepository.delete(product);
    }

    @Transactional
    public ProductDto updateProductStock(Long productId, int newStock, Long sellerId, String updaterEmail, boolean isAdmin) {
        if (newStock < 0) {
            throw new BadRequestException("Stock cannot be negative");
        }
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        if (!isAdmin && (product.getSeller() == null || !product.getSeller().getId().equals(sellerId))) {
            throw new BadRequestException("You do not have permission to update stock for this product");
        }

        int oldStock = product.getStock();
        product.setStock(newStock);
        product.setUpdatedAt(LocalDateTime.now());
        Product saved = productRepository.saveAndFlush(product);

        auditService.log("SELLER_STOCK_UPDATE", updaterEmail,
                "Updated stock for " + product.getTitle() + " from " + oldStock + " to " + newStock,
                "PRODUCT", product.getId());

        return toDto(saved);
    }

    public ProductDto toDto(Product p) {
        ProductDto dto = new ProductDto();
        dto.setId(p.getId());
        dto.setTitle(p.getTitle());
        dto.setDescription(p.getDescription());
        dto.setBrand(p.getBrand());
        dto.setPrice(p.getPrice());
        dto.setOriginalPrice(p.getOriginalPrice());
        dto.setDiscountPercentage(p.getDiscountPercentage());
        dto.setStock(p.getStock());
        dto.setInStock(p.getStock() > 0);
        dto.setRating(p.getRating());
        dto.setRatingCount(p.getRatingCount());
        dto.setReviewCount(p.getReviewCount());

        if (p.getCategory() != null) {
            dto.setCategoryId(p.getCategory().getId());
            dto.setCategoryName(p.getCategory().getName());
            dto.setCategorySlug(p.getCategory().getSlug());
        }

        if (p.getSeller() != null) {
            dto.setSellerId(p.getSeller().getId());
            dto.setSellerName(p.getSeller().getStoreName() != null ? p.getSeller().getStoreName() : p.getSeller().getName());
        }

        List<String> urls = new ArrayList<>();
        String primary = null;
        if (p.getImages() != null && !p.getImages().isEmpty()) {
            for (ProductImage img : p.getImages()) {
                urls.add(img.getImageUrl());
                if (img.isPrimary() || primary == null) {
                    primary = img.getImageUrl();
                }
            }
        }
        dto.setImageUrls(urls);
        dto.setPrimaryImage(primary != null ? primary : "https://placehold.co/400x400/png?text=" + p.getTitle());

        dto.setSpecifications(p.getSpecifications());
        dto.setFeatured(p.isFeatured());
        dto.setDealOfTheDay(p.isDealOfTheDay());
        dto.setTopOffer(p.isTopOffer());

        return dto;
    }
}
