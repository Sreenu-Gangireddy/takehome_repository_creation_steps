package com.chubb.claims.messaging;

import com.chubb.claims.domain.Claim;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.UUID;

@Component
public class ClaimEventPublisher {
	public static final String TOPIC = "claims.lifecycle";
	private final KafkaTemplate<String, ClaimEvent> kafka;

	public ClaimEventPublisher(KafkaTemplate<String, ClaimEvent> kafka) {
		this.kafka = kafka;
	}

	public void publish(String type, Claim claim) {
		var event = new ClaimEvent(UUID.randomUUID(), type, claim.getId(), claim.getStatus().name(), claim.getMarket(),
				claim.getEstimatedLoss(), Instant.now());
		kafka.send(TOPIC, claim.getId().toString(), event);
	}
}
