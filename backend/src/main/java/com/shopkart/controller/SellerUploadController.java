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

@RestController
@RequestMapping("/api/seller")
public class SellerUploadController {

    private final FileUploadService fileUploadService;

    public SellerUploadController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadImage(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        Map<String, Object> result = fileUploadService.uploadFile(file, principal != null ? principal.getEmail() : "seller");
        return ResponseEntity.ok(ApiResponse.ok("Product image uploaded successfully", result));
    }
}
