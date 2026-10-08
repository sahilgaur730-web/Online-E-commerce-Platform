package com.shopkart.service;

import com.shopkart.common.BadRequestException;
import com.shopkart.common.ResourceNotFoundException;
import com.shopkart.dto.ReviewCreateRequest;
import com.shopkart.dto.ReviewDto;
import com.shopkart.model.Product;
import com.shopkart.model.Review;
import com.shopkart.model.User;
import com.shopkart.repository.OrderItemRepository;
import com.shopkart.repository.ProductRepository;
import com.shopkart.repository.ReviewRepository;
import com.shopkart.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            OrderItemRepository orderItemRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderItemRepository = orderItemRepository;
    }

    public List<ReviewDto> getProductReviews(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReviewDto addReview(Long productId, Long userId, ReviewCreateRequest req) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (product.getSeller() != null && product.getSeller().getId().equals(userId)) {
            throw new BadRequestException("Sellers cannot review their own products");
        }

        if (reviewRepository.existsByProductIdAndUserId(productId, userId)) {
            throw new BadRequestException("You have already reviewed this product");
        }

        boolean verifiedPurchase = orderItemRepository.existsByBuyerIdAndProductId(userId, productId);

        Review review = new Review(
                product,
                user,
                req.getRating(),
                req.getTitle(),
                req.getComment(),
                verifiedPurchase
        );
        Review saved = reviewRepository.save(review);

        // Recalculate product rating
        List<Review> allReviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        double avg = allReviews.stream().mapToInt(Review::getRating).average().orElse(4.0);
        product.setRating(Math.round(avg * 10.0) / 10.0);
        product.setRatingCount(product.getRatingCount() + 1);
        product.setReviewCount(allReviews.size());
        productRepository.save(product);

        return toDto(saved);
    }

    private ReviewDto toDto(Review r) {
        ReviewDto dto = new ReviewDto();
        dto.setId(r.getId());
        dto.setProductId(r.getProduct().getId());
        dto.setUserId(r.getUser().getId());
        dto.setUserName(r.getUser().getName());
        dto.setRating(r.getRating());
        dto.setTitle(r.getTitle());
        dto.setComment(r.getComment());
        dto.setVerifiedPurchase(r.isVerifiedPurchase());
        dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }
}
