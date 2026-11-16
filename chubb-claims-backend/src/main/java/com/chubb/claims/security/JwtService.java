package com.chubb.claims.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
	private final SecretKey key;
	private final long expirationSeconds;

	public JwtService(@Value("${app.jwt.secret}") String secret,
			@Value("${app.jwt.expiration-seconds:3600}") long expirationSeconds) {
		this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.expirationSeconds = expirationSeconds;
	}

	public String generateToken(UserDetails user) {
		Instant now = Instant.now();
		return Jwts.builder().subject(user.getUsername())
				.claim("roles", user.getAuthorities().stream().map(a -> a.getAuthority()).toList())
				.issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(expirationSeconds))).signWith(key)
				.compact();
	}

	public String extractUsername(String token) {
		return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject();
	}

	public boolean isValid(String token, UserDetails user) {
		try {
			return user.getUsername().equals(extractUsername(token));
		} catch (RuntimeException ex) {
			return false;
		}
	}
}
