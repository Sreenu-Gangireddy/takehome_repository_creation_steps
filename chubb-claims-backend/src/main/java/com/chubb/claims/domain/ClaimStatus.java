package com.chubb.claims.domain;

public enum ClaimStatus {
	SUBMITTED, UNDER_REVIEW, AWAITING_INFORMATION, APPROVED, REJECTED, SETTLED;

	public boolean canTransitionTo(ClaimStatus next) {
		return switch (this) {
		case SUBMITTED -> next == UNDER_REVIEW;
		case UNDER_REVIEW -> next == AWAITING_INFORMATION || next == APPROVED || next == REJECTED;
		case AWAITING_INFORMATION -> next == UNDER_REVIEW;
		case APPROVED -> next == SETTLED;
		case REJECTED, SETTLED -> false;
		};
	}
}
