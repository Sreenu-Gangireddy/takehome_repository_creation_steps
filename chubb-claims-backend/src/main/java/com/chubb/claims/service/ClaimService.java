package com.chubb.claims.service;

import com.chubb.claims.api.ClaimRequests;
import com.chubb.claims.domain.*;
import com.chubb.claims.infrastructure.ClaimRepository;
import com.chubb.claims.messaging.ClaimEventPublisher;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
@Transactional
public class ClaimService {
	private final ClaimRepository repository;
    private final ClaimEventPublisher events;


    public ClaimService(
            ClaimRepository repository,
            ClaimEventPublisher events) {

        this.repository = repository;
        this.events = events;
    }
	public Claim submit(ClaimRequests.SubmitClaim r) {
		Claim saved = repository.save(new Claim(r.claimantName(), r.claimantEmail(), r.claimType(), r.market(),
				r.incidentDescription(), r.estimatedLoss()));
		events.publish("CLAIM_SUBMITTED", saved);
		return saved;
	}

	@Transactional(readOnly = true)
	public Claim get(UUID id) {
		return repository.findById(id).orElseThrow(() -> new ClaimNotFoundException(id));
	}

	@Transactional(readOnly = true)
	public Page<Claim> list(ClaimStatus status, Pageable pageable) {
		return status == null ? repository.findAll(pageable) : repository.findByStatus(status, pageable);
	}

	public Claim assign(UUID id, String officer) {
		Claim c = get(id);
		c.assignTo(officer);
		Claim saved = repository.save(c);
		events.publish("CLAIM_ASSIGNED", saved);
		return saved;
	}

	public Claim progress(UUID id, ClaimStatus status) {
		Claim c = get(id);
		c.transitionTo(status);
		Claim saved = repository.save(c);
		events.publish("CLAIM_STATUS_CHANGED", saved);
		return saved;
	}

	public Claim decide(UUID id, ClaimRequests.Decision request) {
		Claim c = get(id);
		ClaimStatus outcome;
		try {
			outcome = ClaimStatus.valueOf(request.outcome().toUpperCase());
		} catch (IllegalArgumentException ex) {
			throw new IllegalArgumentException("Outcome must be APPROVED or REJECTED");
		}
		c.recordDecision(outcome, request.reason());
		Claim saved = repository.save(c);
		events.publish("CLAIM_DECIDED", saved);
		return saved;
	}
}
