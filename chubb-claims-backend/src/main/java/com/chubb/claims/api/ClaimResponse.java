package com.chubb.claims.api;

import com.chubb.claims.domain.Claim;
import com.chubb.claims.domain.ClaimStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ClaimResponse(UUID id, String claimantName, String claimantEmail, String claimType, String market,
		String incidentDescription, BigDecimal estimatedLoss, ClaimStatus status, String assignedOfficer,
		String decisionReason, Instant createdAt, Instant updatedAt) {
	public static ClaimResponse from(Claim c) {
		return new ClaimResponse(c.getId(), c.getClaimantName(), c.getClaimantEmail(), c.getClaimType(), c.getMarket(),
				c.getIncidentDescription(), c.getEstimatedLoss(), c.getStatus(), c.getAssignedOfficer(),
				c.getDecisionReason(), c.getCreatedAt(), c.getUpdatedAt());
	}
}
