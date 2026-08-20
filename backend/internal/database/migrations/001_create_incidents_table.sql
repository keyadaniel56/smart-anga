CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(10) PRIMARY KEY,
    title TEXT NOT NULL,
    hazard_type VARCHAR(20) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    location TEXT NOT NULL,
    coordinates DOUBLE PRECISION[] NOT NULL,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    department VARCHAR(50) NOT NULL,
    assigned_to TEXT NOT NULL,
    actions_taken JSONB DEFAULT '[]',
    automated_dispatch_sent BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance as required by the issue
CREATE INDEX IF NOT EXISTS idx_incidents_hazard_type ON incidents(hazard_type);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_at ON incidents(reported_at);
