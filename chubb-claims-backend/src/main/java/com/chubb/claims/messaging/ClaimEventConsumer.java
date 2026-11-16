package com.chubb.claims.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class ClaimEventConsumer {
	private static final Logger log = LoggerFactory.getLogger(ClaimEventConsumer.class);

	@KafkaListener(topics = ClaimEventPublisher.TOPIC, groupId = "claims-audit-consumer")
	public void consume(ClaimEvent event) {
		// Replace this demonstration audit log with durable audit/notification
		// persistence.
		log.info("Claim event received: eventId={}, type={}, claimId={}, status={}", event.eventId(), event.eventType(),
				event.claimId(), event.status());
	}
}
