package com.chubb.claims.api;

import com.chubb.claims.domain.IllegalClaimTransitionException;
import com.chubb.claims.service.ClaimNotFoundException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
	@ExceptionHandler(ClaimNotFoundException.class)
	@ResponseStatus(HttpStatus.NOT_FOUND)
	Map<String, Object> notFound(ClaimNotFoundException ex) {
		return body(404, ex.getMessage());
	}

	@ExceptionHandler({ IllegalClaimTransitionException.class, IllegalArgumentException.class })
	@ResponseStatus(HttpStatus.CONFLICT)
	Map<String, Object> conflict(RuntimeException ex) {
		return body(409, ex.getMessage());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	@ResponseStatus(HttpStatus.BAD_REQUEST)
	Map<String, Object> invalid(MethodArgumentNotValidException ex) {
		return body(400, "Request validation failed");
	}

	private Map<String, Object> body(int status, String message) {
		return Map.of("timestamp", Instant.now(), "status", status, "error", message);
	}
}
