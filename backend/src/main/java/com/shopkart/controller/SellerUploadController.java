package com.shopkart.controller;

import com.shopkart.common.ApiResponse;
import com.shopkart.security.UserPrincipal;
import com.shopkart.service.FileUploadService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * REST controller handling media file uploads for product images and store branding.
 * <p>
 * Accessible to authenticated sellers and administrators. Uploads files to configured local storage
 * or cloud object stores (Cloudinary / S3), returning public asset URLs.
 * </p>
 */
@RestController
@RequestMapping("/api/seller")
public class SellerUploadController {

    private final FileUploadService fileUploadService;

    public SellerUploadController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    /**
     * Uploads a multipart product image file and returns the stored file metadata and public URL.
     *
     * @param principal authenticated user principal
     * @param file uploaded {@link MultipartFile}
     * @return response entity containing map with "url", "fileName", and "size" attributes
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadImage(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        Map<String, Object> result = fileUploadService.uploadFile(file, principal != null ? principal.getEmail() : "seller");
        return ResponseEntity.ok(ApiResponse.ok("Product image uploaded successfully", result));
    }
}
