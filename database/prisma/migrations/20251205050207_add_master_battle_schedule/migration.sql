-- CreateTable
CREATE TABLE "system_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "dataType" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "master_battles" (
    "battle_id" VARCHAR(8) NOT NULL,
    "start_timestamp" TIMESTAMP(3) NOT NULL,
    "end_timestamp" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_battles_pkey" PRIMARY KEY ("battle_id")
);

-- CreateIndex
CREATE INDEX "idx_master_battle_start" ON "master_battles"("start_timestamp");

-- Populate master_battles from existing clan_battles data
-- Extract unique battle IDs and create corresponding master battle entries
INSERT INTO master_battles (battle_id, start_timestamp, end_timestamp, created_by, notes, created_at, updated_at)
SELECT DISTINCT
    cb.battle_id,
    -- Convert start_date (DATE) to timestamp at midnight GMT
    cb.start_date::timestamp AT TIME ZONE 'GMT',
    -- Convert end_date (DATE) to timestamp at 23:59:59 GMT
    (cb.end_date::timestamp + interval '23 hours 59 minutes 59 seconds') AT TIME ZONE 'GMT',
    NULL as created_by, -- NULL indicates these are historical/migrated battles
    'Migrated from existing clan battle data' as notes,
    CURRENT_TIMESTAMP as created_at,
    CURRENT_TIMESTAMP as updated_at
FROM clan_battles cb
ORDER BY cb.battle_id;

-- Insert system settings
-- Calculate next battle date as 3 days after the most recent battle
-- If no battles exist, use a default date
INSERT INTO system_settings (key, value, description, "dataType", created_at, updated_at)
VALUES (
    'nextBattleStartDate',
    -- Format as ISO 8601 string: most recent battle + 3 days at midnight EST
    -- EST is UTC-5 (never EDT), so we need to add 5 hours to get EST midnight in GMT
    (
        SELECT COALESCE(
            to_json((MAX(cb.start_date) + interval '3 days' + interval '5 hours')::timestamp AT TIME ZONE 'UTC')::text,
            to_json((CURRENT_DATE + interval '3 days' + interval '5 hours')::timestamp AT TIME ZONE 'UTC')::text
        )
        FROM clan_battles cb
    ),
    'Next scheduled battle start date in Official Angry Birds Time (EST)',
    'date',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Also insert the scheduler enabled setting
INSERT INTO system_settings (key, value, description, "dataType", created_at, updated_at)
VALUES (
    'schedulerEnabled',
    'true',
    'Enable/disable automatic battle creation via scheduler',
    'boolean',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- AddForeignKey
ALTER TABLE "clan_battles" ADD CONSTRAINT "clan_battles_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "master_battles"("battle_id") ON DELETE RESTRICT ON UPDATE CASCADE;
