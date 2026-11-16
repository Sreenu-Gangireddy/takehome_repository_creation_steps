package com.chubb.claims.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
	private final JwtService jwt;
	private final UserDetailsService users;

	public JwtAuthenticationFilter(JwtService jwt, UserDetailsService users) {
		this.jwt = jwt;
		this.users = users;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
			throws ServletException, IOException {
		String header = req.getHeader("Authorization");
		if (header != null && header.startsWith("Bearer ")) {
			try {
				String username = jwt.extractUsername(header.substring(7));
				if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
					var user = users.loadUserByUsername(username);
					if (jwt.isValid(header.substring(7), user)) {
						var auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
						auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
						SecurityContextHolder.getContext().setAuthentication(auth);
					}
				}
			} catch (RuntimeException ex) {
				SecurityContextHolder.clearContext();
			}
		}
		chain.doFilter(req, res);
	}
}
