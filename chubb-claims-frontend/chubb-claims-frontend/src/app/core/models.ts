export type UserRole = 'ROLE_CLAIMANT' | 'ROLE_OFFICER' | 'ROLE_MANAGER';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface AuthUser {
  username: string;
  roles: string[];
}

export type ClaimStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'AWAITING_INFORMATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'SETTLED';

export interface ClaimRequest {
  claimantName: string;
  claimantEmail: string;
  claimType: string;
  market: string;
  incidentDescription: string;
  estimatedLoss: number;
}

export interface AssignClaimRequest {
  officer: string;
}

export interface DecisionRequest {
  outcome: 'APPROVED' | 'REJECTED';
  reason: string;
}

export interface Claim {
  id: string;
  claimantName: string;
  claimantEmail: string;
  claimType: string;
  market: string;
  incidentDescription: string;
  estimatedLoss: number;
  status: ClaimStatus;
  assignedOfficer: string | null;
  decisionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export const CLAIM_STATUSES: ClaimStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'AWAITING_INFORMATION',
  'APPROVED',
  'REJECTED',
  'SETTLED'
];
