package com.chubb.claims.api;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.chubb.claims.domain.ClaimStatus;
import com.chubb.claims.service.ClaimService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/claims")
public class ClaimController {
	private final ClaimService service;

	public ClaimController(ClaimService service) {
		this.service = service;
	}

	@PostMapping
	public ResponseEntity<ClaimResponse> submit(@Valid @RequestBody ClaimRequests.SubmitClaim request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(ClaimResponse.from(service.submit(request)));
	}

	@GetMapping("/{id}")
	public ClaimResponse get(@PathVariable UUID id) {
		return ClaimResponse.from(service.get(id));
	}

	@GetMapping
	public Page<ClaimResponse> list(@RequestParam(required = false) ClaimStatus status,
			@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
		return service.list(status, pageable).map(ClaimResponse::from);
	}

	@PatchMapping("/{id}/assignment")
	public ClaimResponse assign(@PathVariable UUID id, @Valid @RequestBody ClaimRequests.AssignClaim request) {
		return ClaimResponse.from(service.assign(id, request.officer()));
	}

	@PatchMapping("/{id}/status")
	public ClaimResponse progress(@PathVariable UUID id, @RequestParam ClaimStatus status) {
		return ClaimResponse.from(service.progress(id, status));
	}

	@PostMapping("/{id}/decision")
	public ClaimResponse decide(@PathVariable UUID id, @Valid @RequestBody ClaimRequests.Decision request) {
		return ClaimResponse.from(service.decide(id, request));
	}
}
