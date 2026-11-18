package com.chubb.claims.api;

import com.chubb.claims.domain.ClaimStatus;
import com.chubb.claims.service.ClaimService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/claims")
public class ClaimController {

    private static final Set<String> STAFF_AUTHORITIES = Set.of("ROLE_OFFICER", "ROLE_MANAGER");

    private final ClaimService service;

    public ClaimController(ClaimService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ClaimResponse> submit(
            @Valid @RequestBody ClaimRequests.SubmitClaim request,
            Authentication authentication) {

        ClaimResponse response = ClaimResponse.from(service.submit(
                request,
                authentication.getName(),
                isStaff(authentication)));

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ClaimResponse get(@PathVariable UUID id, Authentication authentication) {
        return ClaimResponse.from(service.getVisibleToUser(
                id,
                authentication.getName(),
                isStaff(authentication)));
    }

    @GetMapping
    public Page<ClaimResponse> list(
            @RequestParam(required = false) ClaimStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication) {

        return service.listVisibleToUser(
                        status,
                        pageable,
                        authentication.getName(),
                        isStaff(authentication))
                .map(ClaimResponse::from);
    }

    @PatchMapping("/{id}/assignment")
    public ClaimResponse assign(
            @PathVariable UUID id,
            @Valid @RequestBody ClaimRequests.AssignClaim request) {
        return ClaimResponse.from(service.assign(id, request.officer()));
    }

    @PatchMapping("/{id}/status")
    public ClaimResponse progress(@PathVariable UUID id, @RequestParam ClaimStatus status) {
        return ClaimResponse.from(service.progress(id, status));
    }

    @PostMapping("/{id}/decision")
    public ClaimResponse decide(
            @PathVariable UUID id,
            @Valid @RequestBody ClaimRequests.Decision request) {
        return ClaimResponse.from(service.decide(id, request));
    }

    private boolean isStaff(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(STAFF_AUTHORITIES::contains);
    }
}
