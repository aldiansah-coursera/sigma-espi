package com.ptdi.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * Generic "business rule" error with an explicit HTTP status, so a
 * controller can throw a single exception type instead of building
 * ResponseEntity error bodies by hand everywhere. Caught centrally by
 * GlobalExceptionHandler.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
