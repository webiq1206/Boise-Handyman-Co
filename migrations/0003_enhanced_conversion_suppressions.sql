CREATE TABLE IF NOT EXISTS "enhanced_conversion_suppressions" (
  "id" varchar PRIMARY KEY,
  "kind" varchar(16) NOT NULL,
  "value_hash" varchar(64) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "enhanced_conversion_suppressions_kind_hash_unique" ON "enhanced_conversion_suppressions" ("kind", "value_hash");
