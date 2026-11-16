package com.chubb.claims.messaging;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ClaimEvent(UUID eventId, String eventType, UUID claimId, String status, String market,
		BigDecimal estimatedLoss, Instant occurredAt) {
}
