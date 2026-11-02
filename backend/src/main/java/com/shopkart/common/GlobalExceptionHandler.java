package com.shopkart.common;

/**
 * Backward-compatibility wrapper for {@link com.shopkart.exception.GlobalExceptionHandler}.
 * Re-exports the exception handling capabilities for legacy imports.
 */
public class GlobalExceptionHandler extends com.shopkart.exception.GlobalExceptionHandler {

    public GlobalExceptionHandler() {
        super();
    }
}
