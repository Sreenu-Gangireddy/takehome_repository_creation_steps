package com.chubb.claims.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "claims")
public class Claim {
	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;
	@Column(nullable = false)
	private String claimantName;
	@Column(nullable = false)
	private String claimantEmail;
	@Column(nullable = false, length = 40)
	private String claimType;
	@Column(nullable = false, length = 2)
	private String market;
	@Column(nullable = false, length = 2000)
	private String incidentDescription;
	@Column(nullable = false, precision = 14, scale = 2)
	private BigDecimal estimatedLoss;
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private ClaimStatus status;
	private String assignedOfficer;
	@Column(length = 2000)
	private String decisionReason;
	@Column(nullable = false)
	private Instant createdAt;
	@Column(nullable = false)
	private Instant updatedAt;
	@Version
	private long version;

	protected Claim() {
	}

	public Claim(String claimantName, String claimantEmail, String claimType, String market, String incidentDescription,
			BigDecimal estimatedLoss) {
		this.claimantName = claimantName;
		this.claimantEmail = claimantEmail;
		this.claimType = claimType;
		this.market = market;
		this.incidentDescription = incidentDescription;
		this.estimatedLoss = estimatedLoss;
		this.status = ClaimStatus.SUBMITTED;
		this.createdAt = Instant.now();
		this.updatedAt = this.createdAt;
	}

	public void transitionTo(ClaimStatus next) {
		if (!status.canTransitionTo(next))
			throw new IllegalClaimTransitionException(status, next);
		status = next;
		updatedAt = Instant.now();
	}

	public void assignTo(String officer) {
		this.assignedOfficer = officer;
		this.updatedAt = Instant.now();
	}

	public void recordDecision(ClaimStatus decision, String reason) {
		if (decision != ClaimStatus.APPROVED && decision != ClaimStatus.REJECTED)
			throw new IllegalArgumentException("Decision must be APPROVED or REJECTED");
		transitionTo(decision);
		this.decisionReason = reason;
	}

	public UUID getId() {
		return id;
	}

	public String getClaimantName() {
		return claimantName;
	}

	public String getClaimantEmail() {
		return claimantEmail;
	}

	public String getClaimType() {
		return claimType;
	}

	public String getMarket() {
		return market;
	}

	public String getIncidentDescription() {
		return incidentDescription;
	}

	public BigDecimal getEstimatedLoss() {
		return estimatedLoss;
	}

	public ClaimStatus getStatus() {
		return status;
	}

	public String getAssignedOfficer() {
		return assignedOfficer;
	}

	public String getDecisionReason() {
		return decisionReason;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
