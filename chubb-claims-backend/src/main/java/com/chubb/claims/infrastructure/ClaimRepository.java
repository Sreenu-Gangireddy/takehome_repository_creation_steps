package com.chubb.claims.infrastructure;

import com.chubb.claims.domain.Claim;
import com.chubb.claims.domain.ClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClaimRepository extends JpaRepository<Claim, UUID> {

    Page<Claim> findByStatus(ClaimStatus status, Pageable pageable);

    Page<Claim> findByAssignedOfficer(String assignedOfficer, Pageable pageable);

    /** Returns only claims owned by the specified claimant, using a case-insensitive email comparison. */
    Page<Claim> findByClaimantEmailIgnoreCase(String claimantEmail, Pageable pageable);

    /** Returns only claims owned by the specified claimant and matching the requested status. */
    Page<Claim> findByStatusAndClaimantEmailIgnoreCase(
            ClaimStatus status,
            String claimantEmail,
            Pageable pageable);

    /** Scope a single-claim lookup to its claimant to prevent ID-based data disclosure. */
    Optional<Claim> findByIdAndClaimantEmailIgnoreCase(UUID id, String claimantEmail);
}
