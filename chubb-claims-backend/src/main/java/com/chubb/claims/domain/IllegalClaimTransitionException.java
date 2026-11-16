package com.chubb.claims.domain;

public class IllegalClaimTransitionException extends RuntimeException {
	public IllegalClaimTransitionException(ClaimStatus from, ClaimStatus to) {
		super("Claim cannot transition from %s to %s".formatted(from, to));
	}
}
