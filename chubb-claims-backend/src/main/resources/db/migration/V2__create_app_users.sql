CREATE TABLE app_users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(32) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enforce unique usernames without regard to email-address casing.
CREATE UNIQUE INDEX ux_app_users_username_lower ON app_users (LOWER(username));
CREATE INDEX idx_app_users_role ON app_users(role);
