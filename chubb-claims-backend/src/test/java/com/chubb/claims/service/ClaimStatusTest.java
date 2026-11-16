package com.chubb.claims.service;

import com.chubb.claims.domain.ClaimStatus;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ClaimStatusTest {
	@Test
	void submittedCanMoveToReview() {
		assertTrue(ClaimStatus.SUBMITTED.canTransitionTo(ClaimStatus.UNDER_REVIEW));
	}

	@Test
	void settledIsTerminal() {
		assertFalse(ClaimStatus.SETTLED.canTransitionTo(ClaimStatus.UNDER_REVIEW));
	}

	@Test
	void reviewCanRequestInformation() {
		assertTrue(ClaimStatus.UNDER_REVIEW.canTransitionTo(ClaimStatus.AWAITING_INFORMATION));
	}
}
