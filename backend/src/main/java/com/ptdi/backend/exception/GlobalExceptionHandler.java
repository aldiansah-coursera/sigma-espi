package com.ptdi.backend.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Covers both "user not found" (UsernameNotFoundException) and "wrong
     * password" (BadCredentialsException) — both are AuthenticationException
     * subtypes, and both get the SAME generic message on purpose so the API
     * never reveals whether a given email exists in the system.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(AuthenticationException ex) {
        ErrorResponse body = new ErrorResponse(
                Instant.now(),
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                "Email atau password salah"
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    /**
     * Business-rule errors thrown deliberately by controllers/services
     * (duplicate email/NIP on register, akun belum aktif saat login, dst).
     */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex) {
        ErrorResponse body = new ErrorResponse(
                Instant.now(),
                ex.getStatus().value(),
                ex.getStatus().getReasonPhrase(),
                ex.getMessage()
        );
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    /**
     * Jaring pengaman kalau ada operasi delete/save lain yang masih
     * melanggar constraint foreign key di database (mis. mencoba hard-delete
     * baris yang masih direferensikan tabel lain) -- sebelumnya jatuh ke
     * error 500 default Spring tanpa pesan, sehingga di frontend terlihat
     * seperti "tidak terjadi apa-apa".
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        ErrorResponse body = new ErrorResponse(
                Instant.now(),
                HttpStatus.CONFLICT.value(),
                HttpStatus.CONFLICT.getReasonPhrase(),
                "Data tidak dapat dihapus/diubah karena masih terhubung dengan data lain."
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /** Berkas yang diunggah (mis. PDF PKPT/Dokumen Program) melebihi batas ukuran. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        ErrorResponse body = new ErrorResponse(
                Instant.now(),
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Ukuran berkas melebihi batas maksimal yang diizinkan (10MB)."
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /** Request tidak berisi bagian "file" yang diharapkan (mis. Content-Type bukan multipart). */
    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> handleMissingPart(MissingServletRequestPartException ex) {
        ErrorResponse body = new ErrorResponse(
                Instant.now(),
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Berkas tidak diterima server (pastikan mengunggah sebagai file, bukan teks biasa)."
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Jaring pengaman terakhir -- sebelumnya exception yang tidak dikenali
     * jatuh ke halaman error default Spring yang TIDAK menyertakan field
     * "message" (server.error.include-message default-nya "never"), jadi
     * di frontend cuma muncul pesan fallback generik tanpa info nyata.
     * Ditaruh paling bawah supaya handler yang lebih spesifik di atas
     * tetap yang dipakai duluan.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        ErrorResponse body = new ErrorResponse(
                Instant.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                "Terjadi kesalahan tak terduga di server: " + ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
