package com.shopkart.service;

import com.shopkart.common.BadRequestException;
import com.shopkart.common.ResourceNotFoundException;
import com.shopkart.dto.AddToCartRequest;
import com.shopkart.dto.CartItemDto;
import com.shopkart.dto.CartSummaryDto;
import com.shopkart.model.CartItem;
import com.shopkart.model.Product;
import com.shopkart.model.User;
import com.shopkart.repository.CartItemRepository;
import com.shopkart.repository.ProductRepository;
import com.shopkart.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartService(CartItemRepository cartItemRepository, ProductRepository productRepository, UserRepository userRepository) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public CartSummaryDto getCartSummary(Long userId) {
        List<CartItem> items = cartItemRepository.findByUserIdOrderByCreatedAtDesc(userId);
        CartSummaryDto summary = new CartSummaryDto();
        List<CartItemDto> itemDtos = new ArrayList<>();

        BigDecimal originalTotal = BigDecimal.ZERO;
        BigDecimal finalTotal = BigDecimal.ZERO;
        int totalItemsCount = 0;

        for (CartItem item : items) {
            Product p = item.getProduct();
            CartItemDto dto = new CartItemDto();
            dto.setId(item.getId());
            dto.setProductId(p.getId());
            dto.setTitle(p.getTitle());
            dto.setBrand(p.getBrand());
            dto.setPrice(p.getPrice());
            dto.setOriginalPrice(p.getOriginalPrice() != null ? p.getOriginalPrice() : p.getPrice());
            dto.setDiscountPercentage(p.getDiscountPercentage());
            dto.setQuantity(item.getQuantity());
            dto.setStock(p.getStock());

            String img = (p.getImages() != null && !p.getImages().isEmpty())
                    ? p.getImages().get(0).getImageUrl()
                    : "https://placehold.co/100x100";
            dto.setImageUrl(img);

            BigDecimal linePrice = p.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            BigDecimal lineOriginal = (p.getOriginalPrice() != null ? p.getOriginalPrice() : p.getPrice())
                    .multiply(BigDecimal.valueOf(item.getQuantity()));

            dto.setSubtotal(linePrice);
            itemDtos.add(dto);

            originalTotal = originalTotal.add(lineOriginal);
            finalTotal = finalTotal.add(linePrice);
            totalItemsCount += item.getQuantity();
        }

        BigDecimal discountTotal = originalTotal.subtract(finalTotal);
        if (discountTotal.compareTo(BigDecimal.ZERO) < 0) {
            discountTotal = BigDecimal.ZERO;
        }

        // Flipkart delivery rule: Free over ₹500, else ₹40
        BigDecimal deliveryFee = BigDecimal.ZERO;
        if (finalTotal.compareTo(BigDecimal.ZERO) > 0 && finalTotal.compareTo(BigDecimal.valueOf(500)) < 0) {
            deliveryFee = BigDecimal.valueOf(40);
        }

        summary.setItems(itemDtos);
        summary.setTotalItems(totalItemsCount);
        summary.setOriginalTotal(originalTotal);
        summary.setDiscountTotal(discountTotal);
        summary.setDeliveryFee(deliveryFee);
        summary.setFinalTotal(finalTotal.add(deliveryFee));
        summary.setSavings(discountTotal);

        return summary;
    }

    @Transactional
    public CartSummaryDto addToCart(Long userId, AddToCartRequest req) {
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (product.getStock() <= 0) {
            throw new BadRequestException("This product is currently out of stock");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, req.getProductId())
                .orElse(null);

        if (item != null) {
            int newQty = item.getQuantity() + req.getQuantity();
            if (newQty > product.getStock()) {
                throw new BadRequestException("Cannot add more than available stock (" + product.getStock() + ")");
            }
            item.setQuantity(newQty);
            item.setUpdatedAt(LocalDateTime.now());
            cartItemRepository.save(item);
        } else {
            if (req.getQuantity() > product.getStock()) {
                throw new BadRequestException("Cannot add more than available stock (" + product.getStock() + ")");
            }
            item = new CartItem(user, product, req.getQuantity());
            cartItemRepository.save(item);
        }

        return getCartSummary(userId);
    }

    @Transactional
    public CartSummaryDto updateQuantity(Long userId, Long cartItemId, int quantity) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!item.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to cart item");
        }

        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            if (quantity > item.getProduct().getStock()) {
                throw new BadRequestException("Requested quantity exceeds available stock (" + item.getProduct().getStock() + ")");
            }
            item.setQuantity(quantity);
            item.setUpdatedAt(LocalDateTime.now());
            cartItemRepository.save(item);
        }

        return getCartSummary(userId);
    }

    @Transactional
    public CartSummaryDto removeFromCart(Long userId, Long cartItemId) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!item.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to cart item");
        }

        cartItemRepository.delete(item);
        return getCartSummary(userId);
    }

    @Transactional
    public void clearCart(Long userId) {
        cartItemRepository.deleteByUserId(userId);
    }
}
