package com.chubb.claims.messaging;

import com.chubb.claims.domain.Claim;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;
import static org.mockito.Mockito.*;
import java.math.BigDecimal;

class ClaimEventPublisherTest {
	@Test
	void publishesSubmissionEventToLifecycleTopic() {
		@SuppressWarnings("unchecked")
		KafkaTemplate<String, ClaimEvent> kafka = mock(KafkaTemplate.class);
		Claim claim = new Claim("Test Claimant", "test@example.com", "MOTOR", "SG", "Accident details",
				new BigDecimal("1200.00"));
		new ClaimEventPublisher(kafka).publish("CLAIM_SUBMITTED", claim);
		verify(kafka).send(eq(ClaimEventPublisher.TOPIC), isNull(), argThat(e -> e.eventType().equals("CLAIM_SUBMITTED")
				&& e.status().equals("SUBMITTED") && e.market().equals("SG")));
	}
}
