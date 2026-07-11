-- Assign leads to a specific agent on the team
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent ON leads(assigned_agent_id) WHERE assigned_agent_id IS NOT NULL;
