CREATE TABLE claims (
  id UUID PRIMARY KEY,
  claimant_name VARCHAR(255) NOT NULL,
  claimant_email VARCHAR(255) NOT NULL,
  claim_type VARCHAR(40) NOT NULL,
  market VARCHAR(2) NOT NULL,
  incident_description VARCHAR(2000) NOT NULL,
  estimated_loss NUMERIC(14,2) NOT NULL,
  status VARCHAR(32) NOT NULL,
  assigned_officer VARCHAR(255),
  decision_reason VARCHAR(2000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  version BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_claims_status_created ON claims(status, created_at DESC);
CREATE INDEX idx_claims_assigned_officer ON claims(assigned_officer);
