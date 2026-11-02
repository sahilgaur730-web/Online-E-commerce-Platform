package com.shopkart.dto;

import java.util.List;

/**
 * Reusable generic response wrapper residing in com.shopkart.dto.
 * Extends the canonical {@link com.shopkart.common.ApiResponse} to eliminate class duplication
 * while preserving full backward compatibility across the DTO layer.
 *
 * @param <T> Payload body type
 */
public class ApiResponse<T> extends com.shopkart.common.ApiResponse<T> {

    public ApiResponse() {
        super();
    }

    public ApiResponse(boolean success, String message, T data) {
        super(success, message, data);
    }

    public ApiResponse(boolean success, String message, T data, List<String> details) {
        super(success, message, data, details);
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "Success", data);
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "Success", data);
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }

    public static <T> ApiResponse<T> error(String message, List<String> details) {
        return new ApiResponse<>(false, message, null, details);
    }
}
