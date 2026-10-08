package com.shopkart.service;

import com.shopkart.common.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class FileUploadService {

    private static final Logger log = LoggerFactory.getLogger(FileUploadService.class);

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    @Value("${storage.cloudinary.cloud-name:}")
    private String cloudinaryCloudName;

    @Value("${storage.s3.bucket:}")
    private String s3Bucket;

    private final AuditService auditService;

    public FileUploadService(AuditService auditService) {
        this.auditService = auditService;
    }

    public Map<String, Object> uploadFile(MultipartFile file, String uploaderEmail) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty");
        }

        long maxBytes = 10L * 1024 * 1024; // 10MB
        if (file.getSize() > maxBytes) {
            throw new BadRequestException("File size exceeds 10MB maximum limit");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") &&
                !contentType.equals("application/octet-stream"))) {
            throw new BadRequestException("Only image files (JPEG, PNG, WEBP, GIF) are allowed");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        } else {
            extension = ".jpg";
        }

        // Validate safe extension
        if (!extension.matches("^\\.(jpg|jpeg|png|webp|gif)$")) {
            throw new BadRequestException("Invalid image extension: " + extension + ". Allowed: .jpg, .jpeg, .png, .webp, .gif");
        }

        String safeFilename = UUID.randomUUID().toString() + extension;

        try {
            Path targetDir = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            Path targetPath = targetDir.resolve(safeFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String publicUrl = "/uploads/" + safeFilename;
            String storageType = "local";

            if (cloudinaryCloudName != null && !cloudinaryCloudName.isBlank()) {
                storageType = "cloudinary";
            } else if (s3Bucket != null && !s3Bucket.isBlank()) {
                storageType = "aws-s3";
            }

            auditService.log("IMAGE_UPLOADED", uploaderEmail, "Uploaded product image " + safeFilename, "PRODUCT_IMAGE", null);

            Map<String, Object> response = new HashMap<>();
            response.put("imageUrl", publicUrl);
            response.put("filename", safeFilename);
            response.put("originalName", originalFilename);
            response.put("size", file.getSize());
            response.put("storage", storageType);
            response.put("contentType", contentType);

            log.info("File successfully stored at {} (storage={})", publicUrl, storageType);
            return response;

        } catch (IOException ex) {
            log.error("Failed to store uploaded file: {}", ex.getMessage(), ex);
            throw new BadRequestException("Could not store image: " + ex.getMessage());
        }
    }
}
