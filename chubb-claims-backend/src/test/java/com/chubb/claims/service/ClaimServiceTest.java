package com.chubb.claims.service;

import com.chubb.claims.api.ClaimRequests;
import com.chubb.claims.domain.*;
import com.chubb.claims.infrastructure.ClaimRepository;
import com.chubb.claims.messaging.ClaimEventPublisher;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClaimServiceTest {
	@Mock
	ClaimRepository repository;
	@Mock
	ClaimEventPublisher events;
	@InjectMocks
	ClaimService service;

	@Test
	void submitPersistsClaimAndEmitsEvent() {
		when(repository.save(any(Claim.class))).thenAnswer(i -> i.getArgument(0));
		var request = new ClaimRequests.SubmitClaim("A User", "a@example.com", "MOTOR", "SG", "Collision",
				new BigDecimal("500"));
		Claim result = service.submit(request);
		assertEquals(ClaimStatus.SUBMITTED, result.getStatus());
		verify(events).publish("CLAIM_SUBMITTED", result);
	}

	@Test
	void getThrowsWhenClaimMissing() {
		UUID id = UUID.randomUUID();
		when(repository.findById(id)).thenReturn(Optional.empty());
		assertThrows(ClaimNotFoundException.class, () -> service.get(id));
	}
}
