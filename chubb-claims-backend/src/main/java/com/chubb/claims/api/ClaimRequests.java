package com.chubb.claims.api;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public final class ClaimRequests {
	private ClaimRequests() {
	}

	public record SubmitClaim(@NotBlank String claimantName, @Email @NotBlank String claimantEmail,
			@NotBlank String claimType, @Pattern(regexp = "[A-Z]{2}") String market,
			@NotBlank @Size(max = 2000) String incidentDescription,
			@NotNull @DecimalMin("0.01") BigDecimal estimatedLoss) {
	}

	public record AssignClaim(@NotBlank String officer) {
	}

	public record Decision(@NotBlank String outcome, @NotBlank @Size(max = 2000) String reason) {
	}
}
