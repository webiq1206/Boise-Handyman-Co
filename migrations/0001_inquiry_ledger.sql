CREATE TABLE IF NOT EXISTS "inquiry_ledger" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "inquiry_id" varchar(100) NOT NULL,
  "contact_fingerprint" varchar(128) NOT NULL,
  "duplicate_key" varchar(128) NOT NULL,
  "route" varchar(40) NOT NULL,
  "accepted_at" timestamp DEFAULT now() NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "inquiry_ledger_inquiry_id_unique" ON "inquiry_ledger" ("inquiry_id");
CREATE UNIQUE INDEX IF NOT EXISTS "inquiry_ledger_duplicate_key_unique" ON "inquiry_ledger" ("duplicate_key");
CREATE INDEX IF NOT EXISTS "inquiry_ledger_contact_fingerprint_idx" ON "inquiry_ledger" ("contact_fingerprint");