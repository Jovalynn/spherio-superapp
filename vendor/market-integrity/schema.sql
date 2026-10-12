-- Candidate migration only: no production application authorized.
CREATE TABLE IF NOT EXISTS mi_decisions (
 ledger_key text PRIMARY KEY, authorization_id text UNIQUE NOT NULL,
 chain_id text NOT NULL, account_id text NOT NULL, asset_id text NOT NULL,
 pool_id text, idempotency_key text NOT NULL, intent_digest text NOT NULL,
 policy_version text NOT NULL, status text NOT NULL CHECK(status IN
 ('RESERVED','REJECTED','CONSUMED','BROADCAST','AMBIGUOUS','CONFIRMED','CHAIN_REJECTED','EXPIRED','POLICY_INVALIDATED')),
 decision jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(chain_id,account_id,asset_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS mi_decisions_account_asset ON mi_decisions(chain_id,account_id,asset_id,status);
CREATE INDEX IF NOT EXISTS mi_decisions_pool_pending ON mi_decisions(chain_id,pool_id,status);
CREATE TABLE IF NOT EXISTS mi_decision_events (
 id bigserial PRIMARY KEY, authorization_id text NOT NULL REFERENCES mi_decisions(authorization_id),
 event_type text NOT NULL, evidence jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS mi_decision_events_authorization ON mi_decision_events(authorization_id,id);
CREATE OR REPLACE FUNCTION mi_immutable_audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'MI decision audit is append-only'; END;
$$;
DROP TRIGGER IF EXISTS mi_decision_events_immutable ON mi_decision_events;
CREATE TRIGGER mi_decision_events_immutable BEFORE UPDATE OR DELETE ON mi_decision_events
 FOR EACH ROW EXECUTE FUNCTION mi_immutable_audit();

-- Versioned candidate migration for pre-expiry ledgers. Existing reservations
-- without a recorded expiry are retained for owner reconciliation, never guessed.
ALTER TABLE mi_decisions DROP CONSTRAINT IF EXISTS mi_decisions_status_check;
ALTER TABLE mi_decisions ADD CONSTRAINT mi_decisions_status_check CHECK(status IN ('RESERVED','REJECTED','CONSUMED','BROADCAST','AMBIGUOUS','CONFIRMED','CHAIN_REJECTED','EXPIRED','POLICY_INVALIDATED'));
