package com.chubb.claims.service;

import com.chubb.claims.api.ClaimRequests;
import com.chubb.claims.domain.Claim;
import com.chubb.claims.domain.ClaimStatus;
import com.chubb.claims.infrastructure.ClaimRepository;
import com.chubb.claims.messaging.ClaimEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class ClaimService {

    private final ClaimRepository repository;
    private final ClaimEventPublisher events;

    public ClaimService(ClaimRepository repository, ClaimEventPublisher events) {
        this.repository = repository;
        this.events = events;
    }

    /**
     * Creates a claim. Claimants are always associated with the authenticated account email;
     * officers and managers may submit a claim on behalf of another claimant.
     */
    public Claim submit(ClaimRequests.SubmitClaim request, String authenticatedUsername, boolean staff) {
        String claimantEmail = staff ? request.claimantEmail() : authenticatedUsername;

        Claim saved = repository.save(new Claim(
                request.claimantName(),
                claimantEmail,
                request.claimType(),
                request.market(),
                request.incidentDescription(),
                request.estimatedLoss()));

        events.publish("CLAIM_SUBMITTED", saved);
        return saved;
    }

    /** Unrestricted lookup for trusted internal staff operations after authorization at the API boundary. */
    @Transactional(readOnly = true)
    public Claim get(UUID id) {
        return repository.findById(id).orElseThrow(() -> new ClaimNotFoundException(id));
    }

    /**
     * Claimants can retrieve only their own claims. Returning 404 for another claimant's ID
     * avoids revealing whether another customer's claim exists.
     */
    @Transactional(readOnly = true)
    public Claim getVisibleToUser(UUID id, String authenticatedUsername, boolean staff) {
        if (staff) {
            return get(id);
        }

        return repository.findByIdAndClaimantEmailIgnoreCase(id, authenticatedUsername)
                .orElseThrow(() -> new ClaimNotFoundException(id));
    }

    /** Existing unrestricted list for trusted internal uses. */
    @Transactional(readOnly = true)
    public Page<Claim> list(ClaimStatus status, Pageable pageable) {
        return status == null
                ? repository.findAll(pageable)
                : repository.findByStatus(status, pageable);
    }

    /**
     * Staff can see the complete claims register. Claimants receive a database-filtered,
     * paginated result containing only claims whose claimantEmail matches their login.
     */
    @Transactional(readOnly = true)
    public Page<Claim> listVisibleToUser(
            ClaimStatus status,
            Pageable pageable,
            String authenticatedUsername,
            boolean staff) {

        if (staff) {
            return list(status, pageable);
        }

        if (status == null) {
            return repository.findByClaimantEmailIgnoreCase(authenticatedUsername, pageable);
        }

        return repository.findByStatusAndClaimantEmailIgnoreCase(
                status, authenticatedUsername, pageable);
    }

    public Claim assign(UUID id, String officer) {
        Claim claim = get(id);
        claim.assignTo(officer);
        Claim saved = repository.save(claim);
        events.publish("CLAIM_ASSIGNED", saved);
        return saved;
    }

    public Claim progress(UUID id, ClaimStatus status) {
        Claim claim = get(id);
        claim.transitionTo(status);
        Claim saved = repository.save(claim);
        events.publish("CLAIM_STATUS_CHANGED", saved);
        return saved;
    }

    public Claim decide(UUID id, ClaimRequests.Decision request) {
        Claim claim = get(id);
        ClaimStatus outcome;
        try {
            outcome = ClaimStatus.valueOf(request.outcome().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Outcome must be APPROVED or REJECTED");
        }
        claim.recordDecision(outcome, request.reason());
        Claim saved = repository.save(claim);
        events.publish("CLAIM_DECIDED", saved);
        return saved;
    }
}
