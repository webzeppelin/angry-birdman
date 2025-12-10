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

-- Populate master_battles from existing clan_battles data (if table exists)
-- Extract unique battle IDs and create corresponding master battle entries
-- This is wrapped in a conditional block to handle fresh installations
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clan_battles') THEN
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
    END IF;
END $$;

-- Insert system settings
-- Calculate next battle date as 3 days after the most recent battle
-- If no battles exist, use a default date (3 days from now)
-- This must also be conditional to handle fresh installations
DO $$
DECLARE
    next_battle_date TEXT;
BEGIN
    -- Check if clan_battles exists and has data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clan_battles') THEN
        -- Table exists, try to get the most recent battle date
        SELECT to_json((COALESCE(
            (SELECT MAX(cb.start_date) FROM clan_battles cb),
            CURRENT_DATE
        ) + interval '3 days' + interval '5 hours')::timestamp AT TIME ZONE 'UTC')::text
        INTO next_battle_date;
    ELSE
        -- Table doesn't exist, use default (3 days from now)
        SELECT to_json((CURRENT_DATE + interval '3 days' + interval '5 hours')::timestamp AT TIME ZONE 'UTC')::text
        INTO next_battle_date;
    END IF;
    
    -- Insert the calculated date
    INSERT INTO system_settings (key, value, description, "dataType", created_at, updated_at)
    VALUES (
        'nextBattleStartDate',
        next_battle_date,
        'Next scheduled battle start date in Official Angry Birds Time (EST)',
        'date',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
END $$;

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

-- AddForeignKey (only if clan_battles table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clan_battles') THEN
        ALTER TABLE "clan_battles" ADD CONSTRAINT "clan_battles_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "master_battles"("battle_id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
