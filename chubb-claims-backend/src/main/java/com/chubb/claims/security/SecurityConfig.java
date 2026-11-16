package com.chubb.claims.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	UserDetailsService userDetailsService(PasswordEncoder encoder) {
		return new InMemoryUserDetailsManager(
				User.withUsername("claimant@chubb.test").password(encoder.encode("Claimant@123")).roles("CLAIMANT")
						.build(),
				User.withUsername("officer@chubb.test").password(encoder.encode("Officer@123")).roles("OFFICER")
						.build(),
				User.withUsername("manager@chubb.test").password(encoder.encode("Manager@123"))
						.roles("MANAGER", "OFFICER").build());
	}

	@Bean
	AuthenticationManager authenticationManager(AuthenticationConfiguration c) throws Exception {
		return c.getAuthenticationManager();
	}

	@Bean
	SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwt) throws Exception {
		return http.csrf(csrf -> csrf.disable()).authorizeHttpRequests(a -> a
				.requestMatchers("/api/v1/auth/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**",
						"/actuator/health")
				.permitAll().requestMatchers(HttpMethod.POST, "/api/v1/claims")
				.hasAnyRole("CLAIMANT", "OFFICER", "MANAGER").requestMatchers(HttpMethod.GET, "/api/v1/claims/**")
				.hasAnyRole("CLAIMANT", "OFFICER", "MANAGER").requestMatchers("/api/v1/claims/**")
				.hasAnyRole("OFFICER", "MANAGER").anyRequest().authenticated())
				.addFilterBefore(jwt, UsernamePasswordAuthenticationFilter.class).build();
	}
}
