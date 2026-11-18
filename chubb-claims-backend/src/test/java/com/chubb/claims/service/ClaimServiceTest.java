package com.chubb.claims.service;

import com.chubb.claims.api.ClaimRequests;
import com.chubb.claims.domain.Claim;
import com.chubb.claims.domain.ClaimStatus;
import com.chubb.claims.infrastructure.ClaimRepository;
import com.chubb.claims.messaging.ClaimEventPublisher;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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
    void claimantSubmissionUsesAuthenticatedUsernameAsClaimOwner() {
        when(repository.save(any(Claim.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClaimRequests.SubmitClaim request = new ClaimRequests.SubmitClaim(
                "Alex Tan", "someone-else@example.com", "MOTOR", "SG",
                "Collision damage", new BigDecimal("500.00"));

        Claim result = service.submit(request, "alex@example.com", false);

        assertEquals(ClaimStatus.SUBMITTED, result.getStatus());
        assertEquals("Alex Tan", result.getClaimantName());
        assertEquals("alex@example.com", result.getClaimantEmail());
        verify(repository).save(any(Claim.class));
        verify(events).publish("CLAIM_SUBMITTED", result);
    }

    @Test
    void staffCanSubmitClaimOnBehalfOfAnotherClaimant() {
        when(repository.save(any(Claim.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClaimRequests.SubmitClaim request = new ClaimRequests.SubmitClaim(
                "Alex Tan", "alex@example.com", "MOTOR", "SG",
                "Collision damage", new BigDecimal("500.00"));

        Claim result = service.submit(request, "officer@chubb.test", true);

        assertEquals("alex@example.com", result.getClaimantEmail());
    }

    @Test
    void claimantListIsScopedToAuthenticatedEmail() {
        var pageable = PageRequest.of(0, 20);
        when(repository.findByClaimantEmailIgnoreCase("alex@example.com", pageable))
                .thenReturn(Page.empty(pageable));

        Page<Claim> result = service.listVisibleToUser(null, pageable, "alex@example.com", false);

        assertTrue(result.isEmpty());
        verify(repository).findByClaimantEmailIgnoreCase("alex@example.com", pageable);
        verify(repository, never()).findAll(any(org.springframework.data.domain.Pageable.class));
    }

    @Test
    void claimantListWithStatusIsScopedToAuthenticatedEmailAndStatus() {
        var pageable = PageRequest.of(0, 20);
        when(repository.findByStatusAndClaimantEmailIgnoreCase(
                ClaimStatus.SUBMITTED, "alex@example.com", pageable))
                .thenReturn(Page.empty(pageable));

        service.listVisibleToUser(ClaimStatus.SUBMITTED, pageable, "alex@example.com", false);

        verify(repository).findByStatusAndClaimantEmailIgnoreCase(
                ClaimStatus.SUBMITTED, "alex@example.com", pageable);
    }

    @Test
    void staffListReturnsAllClaims() {
        var pageable = PageRequest.of(0, 20);
        when(repository.findAll(pageable)).thenReturn(Page.empty(pageable));

        service.listVisibleToUser(null, pageable, "manager@chubb.test", true);

        verify(repository).findAll(pageable);
        verify(repository, never()).findByClaimantEmailIgnoreCase(anyString(), any());
    }

    @Test
    void claimantCanRetrieveOnlyOwnClaim() {
        UUID id = UUID.randomUUID();
        Claim ownedClaim = newClaim("alex@example.com");
        when(repository.findByIdAndClaimantEmailIgnoreCase(id, "alex@example.com"))
                .thenReturn(Optional.of(ownedClaim));

        Claim result = service.getVisibleToUser(id, "alex@example.com", false);

        assertSame(ownedClaim, result);
        verify(repository).findByIdAndClaimantEmailIgnoreCase(id, "alex@example.com");
        verify(repository, never()).findById(id);
    }

    @Test
    void claimantCannotRetrieveAnotherUsersClaim() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndClaimantEmailIgnoreCase(id, "alex@example.com"))
                .thenReturn(Optional.empty());

        assertThrows(ClaimNotFoundException.class,
                () -> service.getVisibleToUser(id, "alex@example.com", false));
    }

    @Test
    void staffCanRetrieveAnyClaimById() {
        UUID id = UUID.randomUUID();
        Claim claim = newClaim("someone@example.com");
        when(repository.findById(id)).thenReturn(Optional.of(claim));

        assertSame(claim, service.getVisibleToUser(id, "manager@chubb.test", true));
        verify(repository).findById(id);
    }

    @Test
    void internalGetThrowsWhenClaimDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ClaimNotFoundException.class, () -> service.get(id));
    }

    @Test
    void assignPersistsOfficerAndPublishesAssignmentEvent() {
        UUID id = UUID.randomUUID();
        Claim claim = newClaim("alex@example.com");
        when(repository.findById(id)).thenReturn(Optional.of(claim));
        when(repository.save(claim)).thenReturn(claim);

        Claim result = service.assign(id, "officer@chubb.test");

        assertEquals("officer@chubb.test", result.getAssignedOfficer());
        verify(events).publish("CLAIM_ASSIGNED", result);
    }

    @Test
    void progressPersistsStatusAndPublishesStatusEvent() {
        UUID id = UUID.randomUUID();
        Claim claim = newClaim("alex@example.com");
        when(repository.findById(id)).thenReturn(Optional.of(claim));
        when(repository.save(claim)).thenReturn(claim);

        Claim result = service.progress(id, ClaimStatus.UNDER_REVIEW);

        assertEquals(ClaimStatus.UNDER_REVIEW, result.getStatus());
        verify(events).publish("CLAIM_STATUS_CHANGED", result);
    }

    @Test
    void decideApprovesClaimAndPublishesDecisionEvent() {
        UUID id = UUID.randomUUID();
        Claim claim = newClaim("alex@example.com");
        claim.transitionTo(ClaimStatus.UNDER_REVIEW);
        when(repository.findById(id)).thenReturn(Optional.of(claim));
        when(repository.save(claim)).thenReturn(claim);

        ClaimRequests.Decision decision = new ClaimRequests.Decision("APPROVED", "Evidence verified");
        Claim result = service.decide(id, decision);

        assertEquals(ClaimStatus.APPROVED, result.getStatus());
        assertEquals("Evidence verified", result.getDecisionReason());
        verify(events).publish("CLAIM_DECIDED", result);
    }

    @Test
    void decideRejectsUnsupportedOutcome() {
        UUID id = UUID.randomUUID();
        Claim claim = newClaim("alex@example.com");
        claim.transitionTo(ClaimStatus.UNDER_REVIEW);
        when(repository.findById(id)).thenReturn(Optional.of(claim));

        ClaimRequests.Decision decision = new ClaimRequests.Decision("PENDING", "Not a decision");
        assertThrows(IllegalArgumentException.class, () -> service.decide(id, decision));
        verify(repository, never()).save(any(Claim.class));
        verify(events, never()).publish(anyString(), any(Claim.class));
    }

    private Claim newClaim(String claimantEmail) {
        return new Claim("Alex Tan", claimantEmail, "MOTOR", "SG",
                "Collision damage", new BigDecimal("500.00"));
    }
}
