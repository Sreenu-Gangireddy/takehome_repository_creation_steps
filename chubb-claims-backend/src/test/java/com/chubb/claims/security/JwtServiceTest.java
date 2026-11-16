package com.chubb.claims.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
	private final JwtService jwt = new JwtService("test-secret-key-must-be-at-least-32-bytes-long", 60);

	@Test
	void createsTokenAndExtractsSubject() {
		var user = User.withUsername("officer@chubb.test").password("x").roles("OFFICER").build();
		String token = jwt.generateToken(user);
		assertEquals(user.getUsername(), jwt.extractUsername(token));
		assertTrue(jwt.isValid(token, user));
	}

	@Test
	void rejectsTamperedToken() {
		var user = User.withUsername("officer@chubb.test").password("x").roles("OFFICER").build();
		String token = jwt.generateToken(user);
		assertFalse(jwt.isValid(token + "tampered", user));
	}

	@Test
	void rejectsDifferentUser() {
		var user = User.withUsername("officer@chubb.test").password("x").roles("OFFICER").build();
		var other = User.withUsername("manager@chubb.test").password("x").roles("MANAGER").build();
		assertFalse(jwt.isValid(jwt.generateToken(user), other));
	}
}
