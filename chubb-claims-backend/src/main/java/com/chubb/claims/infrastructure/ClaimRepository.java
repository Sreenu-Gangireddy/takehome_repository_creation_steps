package com.chubb.claims.infrastructure;

import com.chubb.claims.domain.Claim;
import com.chubb.claims.domain.ClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ClaimRepository extends JpaRepository<Claim, UUID> {
	Page<Claim> findByStatus(ClaimStatus status, Pageable pageable);

	Page<Claim> findByAssignedOfficer(String assignedOfficer, Pageable pageable);
}
