package com.chubb.claims.api;

import com.chubb.claims.security.JwtService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
	private final AuthenticationManager manager;
	private final UserDetailsService users;
	private final JwtService jwt;

	public AuthController(AuthenticationManager manager, UserDetailsService users, JwtService jwt) {
		this.manager = manager;
		this.users = users;
		this.jwt = jwt;
	}

	@PostMapping("/login")
	public TokenResponse login(@Valid @RequestBody LoginRequest req) {
		try {
			manager.authenticate(new UsernamePasswordAuthenticationToken(req.username(), req.password()));
			return new TokenResponse(jwt.generateToken(users.loadUserByUsername(req.username())), "Bearer", 3600);
		} catch (AuthenticationException ex) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
		}
	}

	public record LoginRequest(@NotBlank String username, @NotBlank String password) {

	}

	public record TokenResponse(String accessToken, String tokenType, long expiresInSeconds) {

	}
}
