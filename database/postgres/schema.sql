-- ============================================================================
-- Angry Birdman PostgreSQL Database Schema
-- ============================================================================
-- This schema defines the complete database structure for the Angry Birdman
-- clan management system. It implements the data model specified in the
-- high-level specification document.
--
-- Design Principles:
-- - Normalized relational design for data integrity
-- - Foreign key constraints enforce referential integrity
-- - Check constraints validate data at database level
-- - Indexes optimize common query patterns
-- - Comments document purpose and relationships
-- ============================================================================

-- Drop existing tables if they exist (for clean reinstall)
-- Order matters due to foreign key dependencies
DROP TABLE IF EXISTS admin_requests CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS yearly_individual_stats CASCADE;
DROP TABLE IF EXISTS yearly_clan_stats CASCADE;
DROP TABLE IF EXISTS monthly_individual_stats CASCADE;
DROP TABLE IF EXISTS monthly_clan_stats CASCADE;
DROP TABLE IF EXISTS battle_nonplayer_stats CASCADE;
DROP TABLE IF EXISTS battle_player_stats CASCADE;
DROP TABLE IF EXISTS clan_battles CASCADE;
DROP TABLE IF EXISTS roster_members CASCADE;
DROP TABLE IF EXISTS clan_admin_users CASCADE;
DROP TABLE IF EXISTS clans CASCADE;
DROP TABLE IF EXISTS action_codes CASCADE;

-- ============================================================================
-- LOOKUP TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- action_codes: Lookup table for post-battle player actions
-- ----------------------------------------------------------------------------
-- After each battle, admins assign action codes to players indicating
-- roster management decisions (hold, warn, kick, reserve, pass).
-- Managed by Superadmin and extensible for future actions.
-- ----------------------------------------------------------------------------
CREATE TABLE action_codes (
    action_code VARCHAR(20) PRIMARY KEY,  -- Concise code (e.g., 'HOLD', 'KICK')
    display_name VARCHAR(100) NOT NULL,   -- User-friendly display name
    description TEXT,                      -- Optional detailed description
    active BOOLEAN NOT NULL DEFAULT true,  -- Allow disabling without deleting
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT action_code_uppercase CHECK (action_code = UPPER(action_code)),
    CONSTRAINT action_code_no_whitespace CHECK (action_code !~ '\s')
);

COMMENT ON TABLE action_codes IS 'Lookup table for post-battle player action codes managed by Superadmin';
COMMENT ON COLUMN action_codes.action_code IS 'Concise uppercase code without whitespace (PK)';
COMMENT ON COLUMN action_codes.display_name IS 'User-friendly name shown in UI';
COMMENT ON COLUMN action_codes.active IS 'Allows soft deletion by disabling codes';

-- Index for active codes (most queries filter by active)
CREATE INDEX idx_action_codes_active ON action_codes(active);

-- ============================================================================
-- CORE ENTITY TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- clans: Registered clans using Angry Birdman
-- ----------------------------------------------------------------------------
-- Each clan represents a team in Angry Birds 2. Multiple clans can be
-- managed independently within the system.
-- ----------------------------------------------------------------------------
CREATE TABLE clans (
    clan_id SERIAL PRIMARY KEY,                 -- Auto-generated unique ID
    rovio_id INTEGER NOT NULL UNIQUE,           -- Rovio's unique clan identifier
    name VARCHAR(100) NOT NULL,                 -- Clan name (unique per requirement)
    country VARCHAR(100) NOT NULL,              -- Country of origin
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE, -- System registration date
    active BOOLEAN NOT NULL DEFAULT true,       -- Active/inactive flag
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT clans_rovio_id_positive CHECK (rovio_id > 0),
    CONSTRAINT clans_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT clans_country_not_empty CHECK (LENGTH(TRIM(country)) > 0)
);

COMMENT ON TABLE clans IS 'Registered clans using Angry Birdman for management';
COMMENT ON COLUMN clans.clan_id IS 'System-generated unique identifier (PK)';
COMMENT ON COLUMN clans.rovio_id IS 'Rovio-assigned clan ID from Angry Birds 2 (unique)';
COMMENT ON COLUMN clans.name IS 'Display name of the clan';
COMMENT ON COLUMN clans.country IS 'Country the clan represents';
COMMENT ON COLUMN clans.registration_date IS 'Date clan registered with Angry Birdman';
COMMENT ON COLUMN clans.active IS 'True if clan is currently active';

-- Indexes for common queries
CREATE INDEX idx_clans_active ON clans(active);
CREATE INDEX idx_clans_name ON clans(name);
CREATE INDEX idx_clans_country ON clans(country);

-- ----------------------------------------------------------------------------
-- clan_admin_users: Administrative users for clan management
-- ----------------------------------------------------------------------------
-- User accounts are primarily managed by Keycloak IdP, but we maintain
-- a reference table for clan associations and ownership tracking.
-- Note: Passwords are NOT stored here - they're managed by Keycloak.
-- ----------------------------------------------------------------------------
CREATE TABLE clan_admin_users (
    user_id VARCHAR(255) PRIMARY KEY,           -- Keycloak subject ID (immutable)
    username VARCHAR(100) NOT NULL UNIQUE,      -- User-chosen username (can be changed)
    email VARCHAR(255) NOT NULL,                -- Email address
    clan_id INTEGER,                            -- Associated clan (nullable - may not be assigned yet)
    is_owner BOOLEAN NOT NULL DEFAULT false,    -- True if Clan Owner, false if regular admin
    is_superadmin BOOLEAN NOT NULL DEFAULT false, -- True if Superadmin
    account_enabled BOOLEAN NOT NULL DEFAULT true, -- Allows disabling accounts
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_clan_admin_users_clan FOREIGN KEY (clan_id) 
        REFERENCES clans(clan_id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT username_not_empty CHECK (LENGTH(TRIM(username)) > 0),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE clan_admin_users IS 'Admin users with clan associations. Authentication via Keycloak IdP.';
COMMENT ON COLUMN clan_admin_users.user_id IS 'Keycloak subject ID - immutable unique identifier (PK)';
COMMENT ON COLUMN clan_admin_users.username IS 'User-chosen username (unique, can be changed)';
COMMENT ON COLUMN clan_admin_users.email IS 'User email address';
COMMENT ON COLUMN clan_admin_users.clan_id IS 'Associated clan ID (NULL if not yet assigned or Superadmin)';
COMMENT ON COLUMN clan_admin_users.is_owner IS 'True if user is Clan Owner (full clan control)';
COMMENT ON COLUMN clan_admin_users.is_superadmin IS 'True if Superadmin (system-wide access)';
COMMENT ON COLUMN clan_admin_users.account_enabled IS 'Allows account disabling without deletion';

-- Indexes for common queries
CREATE INDEX idx_clan_admin_users_clan ON clan_admin_users(clan_id);
CREATE INDEX idx_clan_admin_users_username ON clan_admin_users(username);
CREATE INDEX idx_clan_admin_users_email ON clan_admin_users(email);
CREATE INDEX idx_clan_admin_users_enabled ON clan_admin_users(account_enabled);

-- ----------------------------------------------------------------------------
-- admin_requests: Pending requests for admin access to clans
-- ----------------------------------------------------------------------------
-- When a registered user wants admin access to a clan, they submit a request.
-- Existing admins of that clan can approve or reject the request.
-- ----------------------------------------------------------------------------
CREATE TABLE admin_requests (
    request_id SERIAL PRIMARY KEY,              -- Auto-generated unique ID
    user_id VARCHAR(255) NOT NULL,              -- User requesting access
    clan_id INTEGER NOT NULL,                   -- Clan they want access to
    request_message TEXT,                       -- Optional message (max 256 chars enforced)
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(255),                   -- Admin who reviewed the request
    reviewed_at TIMESTAMP,                      -- When request was reviewed
    
    -- Foreign keys
    CONSTRAINT fk_admin_requests_user FOREIGN KEY (user_id) 
        REFERENCES clan_admin_users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_admin_requests_clan FOREIGN KEY (clan_id) 
        REFERENCES clans(clan_id) ON DELETE CASCADE,
    CONSTRAINT fk_admin_requests_reviewer FOREIGN KEY (reviewed_by) 
        REFERENCES clan_admin_users(user_id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT admin_request_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    CONSTRAINT admin_request_message_length CHECK (LENGTH(request_message) <= 256),
    CONSTRAINT admin_request_reviewed_consistency CHECK (
        (status = 'PENDING' AND reviewed_by IS NULL AND reviewed_at IS NULL) OR
        (status != 'PENDING' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
    )
);

COMMENT ON TABLE admin_requests IS 'Pending and historical admin access requests';
COMMENT ON COLUMN admin_requests.request_message IS 'Optional message from requestor (max 256 chars)';
COMMENT ON COLUMN admin_requests.status IS 'Request status: PENDING, ACCEPTED, REJECTED';
COMMENT ON COLUMN admin_requests.reviewed_by IS 'Admin user who reviewed the request';

-- Indexes for common queries
CREATE INDEX idx_admin_requests_user ON admin_requests(user_id);
CREATE INDEX idx_admin_requests_clan ON admin_requests(clan_id);
CREATE INDEX idx_admin_requests_status ON admin_requests(status);
CREATE INDEX idx_admin_requests_pending_clan ON admin_requests(clan_id, status) WHERE status = 'PENDING';

-- ----------------------------------------------------------------------------
-- roster_members: Clan member roster (players)
-- ----------------------------------------------------------------------------
-- Each clan maintains a roster of players. Players can be active or inactive.
-- History of joins, departures, and kicks is tracked.
-- ----------------------------------------------------------------------------
CREATE TABLE roster_members (
    player_id SERIAL PRIMARY KEY,               -- Auto-generated unique ID
    clan_id INTEGER NOT NULL,                   -- Clan this player belongs to
    player_name VARCHAR(100) NOT NULL,          -- Player's display name
    active BOOLEAN NOT NULL DEFAULT true,       -- Current active status
    joined_date DATE NOT NULL,                  -- Date joined clan
    left_date DATE,                             -- Date left clan (if applicable)
    kicked_date DATE,                           -- Date kicked from clan (if applicable)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_roster_members_clan FOREIGN KEY (clan_id) 
        REFERENCES clans(clan_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT player_name_not_empty CHECK (LENGTH(TRIM(player_name)) > 0),
    CONSTRAINT left_kicked_exclusive CHECK (
        (left_date IS NULL OR kicked_date IS NULL)  -- Can't have both dates set
    ),
    CONSTRAINT inactive_requires_date CHECK (
        (active = true) OR (left_date IS NOT NULL OR kicked_date IS NOT NULL)
    )
);

COMMENT ON TABLE roster_members IS 'Clan member roster with join/leave/kick tracking';
COMMENT ON COLUMN roster_members.player_id IS 'System-generated unique identifier (PK)';
COMMENT ON COLUMN roster_members.player_name IS 'Display name (can be changed)';
COMMENT ON COLUMN roster_members.active IS 'True if currently active member';
COMMENT ON COLUMN roster_members.joined_date IS 'Date player joined the clan';
COMMENT ON COLUMN roster_members.left_date IS 'Date player voluntarily left (mutually exclusive with kicked_date)';
COMMENT ON COLUMN roster_members.kicked_date IS 'Date player was kicked (mutually exclusive with left_date)';

-- Indexes for common queries
CREATE INDEX idx_roster_members_clan ON roster_members(clan_id);
CREATE INDEX idx_roster_members_active ON roster_members(clan_id, active);
CREATE INDEX idx_roster_members_name ON roster_members(clan_id, player_name);

-- ============================================================================
-- BATTLE DATA TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- clan_battles: Core battle records with clan and opponent performance
-- ----------------------------------------------------------------------------
-- Each battle record captures comprehensive data about a CvC battle event,
-- including clan performance, opponent data, and calculated statistics.
-- Battle ID is generated as YYYYMMDD from start date.
-- ----------------------------------------------------------------------------
CREATE TABLE clan_battles (
    clan_id INTEGER NOT NULL,                   -- Owning clan
    battle_id VARCHAR(8) NOT NULL,              -- YYYYMMDD format from start date
    start_date DATE NOT NULL,                   -- Battle start date
    end_date DATE NOT NULL,                     -- Battle end date (typically start + 1 day)
    
    -- Battle result (-1 = loss, 0 = tie, 1 = win)
    result SMALLINT NOT NULL,
    
    -- Clan performance metrics
    score INTEGER NOT NULL,                     -- Total clan score
    fp INTEGER NOT NULL,                        -- Sum of all FP (players + non-players, excluding reserve)
    baseline_fp INTEGER NOT NULL,               -- Clan's baseline FP for ratio calculation
    ratio DECIMAL(10, 4) NOT NULL,              -- Official clan ratio: (score / baseline_fp) * 10
    average_ratio DECIMAL(10, 4) NOT NULL,      -- Average ratio: (score / fp) * 10
    projected_score DECIMAL(12, 4) NOT NULL,    -- Projected score if all participated
    
    -- Opponent data
    opponent_name VARCHAR(100) NOT NULL,        -- Opponent clan name
    opponent_rovio_id INTEGER NOT NULL,         -- Opponent's Rovio clan ID
    opponent_country VARCHAR(100) NOT NULL,     -- Opponent's country
    opponent_score INTEGER NOT NULL,            -- Opponent's total score
    opponent_fp INTEGER NOT NULL,               -- Opponent's baseline FP
    
    -- Comparative statistics
    margin_ratio DECIMAL(10, 4) NOT NULL,       -- Win/loss margin as % of our score
    fp_margin DECIMAL(10, 4) NOT NULL,          -- FP advantage/disadvantage as %
    
    -- Participation metrics
    nonplaying_count INTEGER NOT NULL DEFAULT 0,           -- Count of non-players (excluding reserve)
    nonplaying_fp_ratio DECIMAL(10, 4) NOT NULL DEFAULT 0, -- Non-player FP as % of total FP
    reserve_count INTEGER NOT NULL DEFAULT 0,              -- Count of reserve players
    reserve_fp_ratio DECIMAL(10, 4) NOT NULL DEFAULT 0,    -- Reserve FP as % of total potential FP
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary key
    PRIMARY KEY (clan_id, battle_id),
    
    -- Foreign keys
    CONSTRAINT fk_clan_battles_clan FOREIGN KEY (clan_id) 
        REFERENCES clans(clan_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT battle_id_format CHECK (battle_id ~ '^\d{8}$'),
    CONSTRAINT result_values CHECK (result IN (-1, 0, 1)),
    CONSTRAINT score_non_negative CHECK (score >= 0),
    CONSTRAINT fp_positive CHECK (fp > 0),
    CONSTRAINT baseline_fp_positive CHECK (baseline_fp > 0),
    CONSTRAINT ratio_positive CHECK (ratio > 0),
    CONSTRAINT average_ratio_positive CHECK (average_ratio > 0),
    CONSTRAINT projected_score_positive CHECK (projected_score > 0),
    CONSTRAINT opponent_rovio_id_positive CHECK (opponent_rovio_id > 0),
    CONSTRAINT opponent_score_non_negative CHECK (opponent_score >= 0),
    CONSTRAINT opponent_fp_positive CHECK (opponent_fp > 0),
    CONSTRAINT nonplaying_count_non_negative CHECK (nonplaying_count >= 0),
    CONSTRAINT nonplaying_fp_ratio_non_negative CHECK (nonplaying_fp_ratio >= 0),
    CONSTRAINT reserve_count_non_negative CHECK (reserve_count >= 0),
    CONSTRAINT reserve_fp_ratio_non_negative CHECK (reserve_fp_ratio >= 0),
    CONSTRAINT end_date_after_start CHECK (end_date >= start_date)
);

COMMENT ON TABLE clan_battles IS 'Core battle records with comprehensive clan and opponent performance metrics';
COMMENT ON COLUMN clan_battles.battle_id IS 'Battle identifier in YYYYMMDD format (composite PK with clan_id)';
COMMENT ON COLUMN clan_battles.result IS 'Battle outcome: -1 = loss, 0 = tie, 1 = win';
COMMENT ON COLUMN clan_battles.ratio IS 'Official clan ratio: (score / baseline_fp) * 10';
COMMENT ON COLUMN clan_battles.average_ratio IS 'Average ratio: (score / fp) * 10';
COMMENT ON COLUMN clan_battles.projected_score IS 'Projected score if all members participated';
COMMENT ON COLUMN clan_battles.margin_ratio IS 'Win/loss margin as percentage of our score';
COMMENT ON COLUMN clan_battles.fp_margin IS 'FP advantage(+)/disadvantage(-) as percentage';
COMMENT ON COLUMN clan_battles.nonplaying_fp_ratio IS 'Non-player FP as % of total FP (excluding reserve)';
COMMENT ON COLUMN clan_battles.reserve_fp_ratio IS 'Reserve FP as % of total potential FP (including reserve)';

-- Indexes for common queries
CREATE INDEX idx_clan_battles_clan ON clan_battles(clan_id);
CREATE INDEX idx_clan_battles_start_date ON clan_battles(clan_id, start_date DESC);
CREATE INDEX idx_clan_battles_battle_id ON clan_battles(battle_id);
CREATE INDEX idx_clan_battles_opponent ON clan_battles(clan_id, opponent_rovio_id);

-- ----------------------------------------------------------------------------
-- battle_player_stats: Individual player performance in battles
-- ----------------------------------------------------------------------------
-- Captures each player's performance in battles they participated in,
-- including score, FP, ratio calculations, and post-battle actions.
-- ----------------------------------------------------------------------------
CREATE TABLE battle_player_stats (
    clan_id INTEGER NOT NULL,                   -- Owning clan
    battle_id VARCHAR(8) NOT NULL,              -- Battle reference
    player_id INTEGER NOT NULL,                 -- Roster member reference
    
    -- Performance metrics
    rank INTEGER NOT NULL,                      -- Score ranking (1 = highest score)
    score INTEGER NOT NULL,                     -- Player's score (can be 0)
    fp INTEGER NOT NULL,                        -- Player's FP during battle
    ratio DECIMAL(10, 4) NOT NULL,              -- Player's ratio: (score / fp) * 10
    ratio_rank INTEGER NOT NULL,                -- Ratio ranking (1 = best ratio)
    
    -- Post-battle action
    action_code VARCHAR(20) NOT NULL,           -- Assigned action (HOLD, KICK, etc.)
    action_reason TEXT,                         -- Optional reason for action
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary key
    PRIMARY KEY (clan_id, battle_id, player_id),
    
    -- Foreign keys
    CONSTRAINT fk_battle_player_stats_battle FOREIGN KEY (clan_id, battle_id) 
        REFERENCES clan_battles(clan_id, battle_id) ON DELETE CASCADE,
    CONSTRAINT fk_battle_player_stats_player FOREIGN KEY (player_id) 
        REFERENCES roster_members(player_id) ON DELETE CASCADE,
    CONSTRAINT fk_battle_player_stats_action FOREIGN KEY (action_code) 
        REFERENCES action_codes(action_code),
    
    -- Constraints
    CONSTRAINT rank_positive CHECK (rank > 0),
    CONSTRAINT score_non_negative CHECK (score >= 0),
    CONSTRAINT fp_positive CHECK (fp > 0),
    CONSTRAINT ratio_non_negative CHECK (ratio >= 0),
    CONSTRAINT ratio_rank_positive CHECK (ratio_rank > 0)
);

COMMENT ON TABLE battle_player_stats IS 'Individual player performance statistics for each battle';
COMMENT ON COLUMN battle_player_stats.rank IS 'Score-based ranking (1 = highest scorer)';
COMMENT ON COLUMN battle_player_stats.score IS 'Player score in battle (can be 0)';
COMMENT ON COLUMN battle_player_stats.ratio IS 'Player ratio: (score / fp) * 10';
COMMENT ON COLUMN battle_player_stats.ratio_rank IS 'Ratio-based ranking (1 = best ratio)';
COMMENT ON COLUMN battle_player_stats.action_code IS 'Post-battle action (HOLD, WARN, KICK, RESERVE, PASS)';

-- Indexes for common queries
CREATE INDEX idx_battle_player_stats_battle ON battle_player_stats(clan_id, battle_id);
CREATE INDEX idx_battle_player_stats_player ON battle_player_stats(player_id);
CREATE INDEX idx_battle_player_stats_ratio_rank ON battle_player_stats(clan_id, battle_id, ratio_rank);

-- ----------------------------------------------------------------------------
-- battle_nonplayer_stats: Non-participating roster members in battles
-- ----------------------------------------------------------------------------
-- Tracks roster members who did not play in a battle, including their FP
-- and reserve status. Used for participation analysis.
-- ----------------------------------------------------------------------------
CREATE TABLE battle_nonplayer_stats (
    clan_id INTEGER NOT NULL,                   -- Owning clan
    battle_id VARCHAR(8) NOT NULL,              -- Battle reference
    player_id INTEGER NOT NULL,                 -- Roster member reference
    
    -- Non-player data
    fp INTEGER NOT NULL,                        -- Player's FP during battle
    reserve BOOLEAN NOT NULL DEFAULT false,     -- True if kept in reserve
    
    -- Post-battle action
    action_code VARCHAR(20) NOT NULL,           -- Assigned action (HOLD, KICK, etc.)
    action_reason TEXT,                         -- Optional reason for action
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary key
    PRIMARY KEY (clan_id, battle_id, player_id),
    
    -- Foreign keys
    CONSTRAINT fk_battle_nonplayer_stats_battle FOREIGN KEY (clan_id, battle_id) 
        REFERENCES clan_battles(clan_id, battle_id) ON DELETE CASCADE,
    CONSTRAINT fk_battle_nonplayer_stats_player FOREIGN KEY (player_id) 
        REFERENCES roster_members(player_id) ON DELETE CASCADE,
    CONSTRAINT fk_battle_nonplayer_stats_action FOREIGN KEY (action_code) 
        REFERENCES action_codes(action_code),
    
    -- Constraints
    CONSTRAINT fp_positive CHECK (fp > 0)
);

COMMENT ON TABLE battle_nonplayer_stats IS 'Non-participating roster members tracked for participation analysis';
COMMENT ON COLUMN battle_nonplayer_stats.fp IS 'Player FP at time of battle';
COMMENT ON COLUMN battle_nonplayer_stats.reserve IS 'True if intentionally held in reserve (excluded from participation stats)';
COMMENT ON COLUMN battle_nonplayer_stats.action_code IS 'Post-battle action assigned to non-player';

-- Indexes for common queries
CREATE INDEX idx_battle_nonplayer_stats_battle ON battle_nonplayer_stats(clan_id, battle_id);
CREATE INDEX idx_battle_nonplayer_stats_player ON battle_nonplayer_stats(player_id);
CREATE INDEX idx_battle_nonplayer_stats_reserve ON battle_nonplayer_stats(clan_id, battle_id, reserve);

-- ============================================================================
-- AGGREGATED STATISTICS TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- monthly_clan_stats: Rolled-up monthly clan performance statistics
-- ----------------------------------------------------------------------------
-- Aggregated statistics for clan performance over a calendar month.
-- Includes battle counts, win/loss records, and averaged metrics.
-- ----------------------------------------------------------------------------
CREATE TABLE monthly_clan_stats (
    clan_id INTEGER NOT NULL,                   -- Owning clan
    month_id VARCHAR(6) NOT NULL,               -- YYYYMM format
    
    -- Battle counts
    battle_count INTEGER NOT NULL,              -- Total battles in month
    won_count INTEGER NOT NULL,                 -- Battles won
    lost_count INTEGER NOT NULL,                -- Battles lost
    tied_count INTEGER NOT NULL,                -- Battles tied
    
    -- Status
    month_complete BOOLEAN NOT NULL DEFAULT false, -- True when month is finalized
    
    -- Averaged performance metrics
    average_fp DECIMAL(12, 4) NOT NULL,         -- Average total FP
    average_baseline_fp DECIMAL(12, 4) NOT NULL, -- Average baseline FP
    average_ratio DECIMAL(10, 4) NOT NULL,      -- Average clan ratio
    average_margin_ratio DECIMAL(10, 4) NOT NULL, -- Average win/loss margin
    average_fp_margin DECIMAL(10, 4) NOT NULL,  -- Average FP advantage/disadvantage
    
    -- Averaged participation metrics
    average_nonplaying_count DECIMAL(10, 4) NOT NULL,      -- Average non-player count
    average_nonplaying_fp_ratio DECIMAL(10, 4) NOT NULL,   -- Average non-player FP ratio
    average_reserve_count DECIMAL(10, 4) NOT NULL,         -- Average reserve count
    average_reserve_fp_ratio DECIMAL(10, 4) NOT NULL,      -- Average reserve FP ratio
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary key
    PRIMARY KEY (clan_id, month_id),
    
    -- Foreign keys
    CONSTRAINT fk_monthly_clan_stats_clan FOREIGN KEY (clan_id) 
        REFERENCES clans(clan_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT month_id_format CHECK (month_id ~ '^\d{6}$'),
    CONSTRAINT battle_count_positive CHECK (battle_count > 0),
    CONSTRAINT won_count_non_negative CHECK (won_count >= 0),
    CONSTRAINT lost_count_non_negative CHECK (lost_count >= 0),
    CONSTRAINT tied_count_non_negative CHECK (tied_count >= 0),
    CONSTRAINT battle_count_sum CHECK (battle_count = won_count + lost_count + tied_count),
    CONSTRAINT average_fp_positive CHECK (average_fp > 0),
    CONSTRAINT average_baseline_fp_positive CHECK (average_baseline_fp > 0),
    CONSTRAINT average_ratio_positive CHECK (average_ratio > 0)
);

COMMENT ON TABLE monthly_clan_stats IS 'Aggregated monthly clan performance statistics';
COMMENT ON COLUMN monthly_clan_stats.month_id IS 'Month identifier in YYYYMM format (composite PK with clan_id)';
COMMENT ON COLUMN monthly_clan_stats.month_complete IS 'True when month is finalized (no more changes expected)';
COMMENT ON COLUMN monthly_clan_stats.average_ratio IS 'Average of clan ratio across all battles in month';

-- Indexes for common queries
CREATE INDEX idx_monthly_clan_stats_clan ON monthly_clan_stats(clan_id);
CREATE INDEX idx_monthly_clan_stats_month ON monthly_clan_stats(month_id);

-- ----------------------------------------------------------------------------
-- monthly_individual_stats: Rolled-up monthly player performance statistics
-- ----------------------------------------------------------------------------
-- Aggregated statistics for individual player performance over a calendar month.
-- Only includes players who participated in 3+ battles during the month.
-- ----------------------------------------------------------------------------
CREATE TABLE monthly_individual_stats (
    clan_id INTEGER NOT NULL,                   -- Owning clan
    month_id VARCHAR(6) NOT NULL,               -- YYYYMM format
    player_id INTEGER NOT NULL,                 -- Roster member reference
    
    -- Participation and averaged metrics
    battles_played INTEGER NOT NULL,            -- Number of battles played (minimum 3)
    average_score DECIMAL(12, 4) NOT NULL,      -- Average score across battles
    average_fp DECIMAL(12, 4) NOT NULL,         -- Average FP across battles
    average_ratio DECIMAL(10, 4) NOT NULL,      -- Average ratio across battles
    average_rank DECIMAL(10, 4) NOT NULL,       -- Average score rank
    average_ratio_rank DECIMAL(10, 4) NOT NULL, -- Average ratio rank
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary key
    PRIMARY KEY (clan_id, month_id, player_id),
    
    -- Foreign keys
    CONSTRAINT fk_monthly_individual_stats_clan_month FOREIGN KEY (clan_id, month_id) 
        REFERENCES monthly_clan_stats(clan_id, month_id) ON DELETE CASCADE,
    CONSTRAINT fk_monthly_individual_stats_player FOREIGN KEY (player_id) 
        REFERENCES roster_members(player_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT battles_played_minimum CHECK (battles_played >= 3),
    CONSTRAINT average_score_non_negative CHECK (average_score >= 0),
    CONSTRAINT average_fp_positive CHECK (average_fp > 0),
    CONSTRAINT average_ratio_positive CHECK (average_ratio > 0),
    CONSTRAINT average_rank_positive CHECK (average_rank > 0),
    CONSTRAINT average_ratio_rank_positive CHECK (average_ratio_rank > 0)
);

COMMENT ON TABLE monthly_individual_stats IS 'Aggregated monthly player statistics (min 3 battles)';
COMMENT ON COLUMN monthly_individual_stats.battles_played IS 'Number of battles played in month (minimum 3 for inclusion)';
COMMENT ON COLUMN monthly_individual_stats.average_ratio IS 'Average of player ratio across all battles played';

-- Indexes for common queries
CREATE INDEX idx_monthly_individual_stats_month ON monthly_individual_stats(clan_id, month_id);
CREATE INDEX idx_monthly_individual_stats_player ON monthly_individual_stats(player_id);

-- ----------------------------------------------------------------------------
-- yearly_clan_stats: Rolled-up yearly clan performance statistics
-- ----------------------------------------------------------------------------
-- Aggregated statistics for clan performance over a calendar year.
-- Structure mirrors monthly stats but aggregates over full year.
-- ----------------------------------------------------------------------------
CREATE TABLE yearly_clan_stats (
    clan_id INTEGER NOT NULL,                   -- Owning clan
    year_id VARCHAR(4) NOT NULL,                -- YYYY format
    
    -- Battle counts
    battle_count INTEGER NOT NULL,              -- Total battles in year
    won_count INTEGER NOT NULL,                 -- Battles won
    lost_count INTEGER NOT NULL,                -- Battles lost
    tied_count INTEGER NOT NULL,                -- Battles tied
    
    -- Status
    year_complete BOOLEAN NOT NULL DEFAULT false, -- True when year is finalized
    
    -- Averaged performance metrics
    average_fp DECIMAL(12, 4) NOT NULL,         -- Average total FP
    average_baseline_fp DECIMAL(12, 4) NOT NULL, -- Average baseline FP
    average_ratio DECIMAL(10, 4) NOT NULL,      -- Average clan ratio
    average_margin_ratio DECIMAL(10, 4) NOT NULL, -- Average win/loss margin
    average_fp_margin DECIMAL(10, 4) NOT NULL,  -- Average FP advantage/disadvantage
    
    -- Averaged participation metrics
    average_nonplaying_count DECIMAL(10, 4) NOT NULL,      -- Average non-player count
    average_nonplaying_fp_ratio DECIMAL(10, 4) NOT NULL,   -- Average non-player FP ratio
    average_reserve_count DECIMAL(10, 4) NOT NULL,         -- Average reserve count
    average_reserve_fp_ratio DECIMAL(10, 4) NOT NULL,      -- Average reserve FP ratio
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary key
    PRIMARY KEY (clan_id, year_id),
    
    -- Foreign keys
    CONSTRAINT fk_yearly_clan_stats_clan FOREIGN KEY (clan_id) 
        REFERENCES clans(clan_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT year_id_format CHECK (year_id ~ '^\d{4}$'),
    CONSTRAINT battle_count_positive CHECK (battle_count > 0),
    CONSTRAINT won_count_non_negative CHECK (won_count >= 0),
    CONSTRAINT lost_count_non_negative CHECK (lost_count >= 0),
    CONSTRAINT tied_count_non_negative CHECK (tied_count >= 0),
    CONSTRAINT battle_count_sum CHECK (battle_count = won_count + lost_count + tied_count),
    CONSTRAINT average_fp_positive CHECK (average_fp > 0),
    CONSTRAINT average_baseline_fp_positive CHECK (average_baseline_fp > 0),
    CONSTRAINT average_ratio_positive CHECK (average_ratio > 0)
);

COMMENT ON TABLE yearly_clan_stats IS 'Aggregated yearly clan performance statistics';
COMMENT ON COLUMN yearly_clan_stats.year_id IS 'Year identifier in YYYY format (composite PK with clan_id)';
COMMENT ON COLUMN yearly_clan_stats.year_complete IS 'True when year is finalized (no more changes expected)';

-- Indexes for common queries
CREATE INDEX idx_yearly_clan_stats_clan ON yearly_clan_stats(clan_id);
CREATE INDEX idx_yearly_clan_stats_year ON yearly_clan_stats(year_id);

-- ----------------------------------------------------------------------------
-- yearly_individual_stats: Rolled-up yearly player performance statistics
-- ----------------------------------------------------------------------------
-- Aggregated statistics for individual player performance over a calendar year.
-- Only includes players who participated in 3+ battles during the year.
-- ----------------------------------------------------------------------------
CREATE TABLE yearly_individual_stats (
    clan_id INTEGER NOT NULL,                   -- Owning clan
    year_id VARCHAR(4) NOT NULL,                -- YYYY format
    player_id INTEGER NOT NULL,                 -- Roster member reference
    
    -- Participation and averaged metrics
    battles_played INTEGER NOT NULL,            -- Number of battles played (minimum 3)
    average_score DECIMAL(12, 4) NOT NULL,      -- Average score across battles
    average_fp DECIMAL(12, 4) NOT NULL,         -- Average FP across battles
    average_ratio DECIMAL(10, 4) NOT NULL,      -- Average ratio across battles
    average_rank DECIMAL(10, 4) NOT NULL,       -- Average score rank
    average_ratio_rank DECIMAL(10, 4) NOT NULL, -- Average ratio rank
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary key
    PRIMARY KEY (clan_id, year_id, player_id),
    
    -- Foreign keys
    CONSTRAINT fk_yearly_individual_stats_clan_year FOREIGN KEY (clan_id, year_id) 
        REFERENCES yearly_clan_stats(clan_id, year_id) ON DELETE CASCADE,
    CONSTRAINT fk_yearly_individual_stats_player FOREIGN KEY (player_id) 
        REFERENCES roster_members(player_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT battles_played_minimum CHECK (battles_played >= 3),
    CONSTRAINT average_score_non_negative CHECK (average_score >= 0),
    CONSTRAINT average_fp_positive CHECK (average_fp > 0),
    CONSTRAINT average_ratio_positive CHECK (average_ratio > 0),
    CONSTRAINT average_rank_positive CHECK (average_rank > 0),
    CONSTRAINT average_ratio_rank_positive CHECK (average_ratio_rank > 0)
);

COMMENT ON TABLE yearly_individual_stats IS 'Aggregated yearly player statistics (min 3 battles)';
COMMENT ON COLUMN yearly_individual_stats.battles_played IS 'Number of battles played in year (minimum 3 for inclusion)';

-- Indexes for common queries
CREATE INDEX idx_yearly_individual_stats_year ON yearly_individual_stats(clan_id, year_id);
CREATE INDEX idx_yearly_individual_stats_player ON yearly_individual_stats(player_id);

-- ============================================================================
-- AUDIT AND ADMINISTRATIVE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- audit_log: System audit trail for administrative actions
-- ----------------------------------------------------------------------------
-- Tracks all significant administrative actions for security and troubleshooting.
-- Immutable after creation - updates and deletes should be prevented.
-- ----------------------------------------------------------------------------
CREATE TABLE audit_log (
    log_id BIGSERIAL PRIMARY KEY,              -- Auto-generated unique ID
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- When action occurred
    user_id VARCHAR(255),                       -- User who performed action (NULL for system)
    action_type VARCHAR(50) NOT NULL,           -- Type of action (e.g., 'USER_CREATED', 'CLAN_UPDATED')
    entity_type VARCHAR(50),                    -- Affected entity type (e.g., 'USER', 'CLAN', 'BATTLE')
    entity_id VARCHAR(255),                     -- Affected entity ID
    clan_id INTEGER,                            -- Related clan (if applicable)
    description TEXT,                           -- Human-readable action description
    metadata JSONB,                             -- Additional structured data
    ip_address INET,                            -- IP address of requestor
    user_agent TEXT,                            -- User agent string
    
    -- Foreign keys (using SET NULL to preserve audit trail if entities deleted)
    CONSTRAINT fk_audit_log_user FOREIGN KEY (user_id) 
        REFERENCES clan_admin_users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_log_clan FOREIGN KEY (clan_id) 
        REFERENCES clans(clan_id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT action_type_not_empty CHECK (LENGTH(TRIM(action_type)) > 0)
);

COMMENT ON TABLE audit_log IS 'Immutable audit trail of administrative actions';
COMMENT ON COLUMN audit_log.action_type IS 'Action category (e.g., USER_CREATED, BATTLE_UPDATED, CLAN_DELETED)';
COMMENT ON COLUMN audit_log.entity_type IS 'Type of entity affected (USER, CLAN, BATTLE, etc.)';
COMMENT ON COLUMN audit_log.entity_id IS 'ID of affected entity (flexible string for different ID types)';
COMMENT ON COLUMN audit_log.metadata IS 'Additional structured data in JSON format';

-- Indexes for common queries
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_action_type ON audit_log(action_type);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_clan ON audit_log(clan_id);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at column on row modification';

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_action_codes_updated_at BEFORE UPDATE ON action_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clans_updated_at BEFORE UPDATE ON clans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clan_admin_users_updated_at BEFORE UPDATE ON clan_admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roster_members_updated_at BEFORE UPDATE ON roster_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clan_battles_updated_at BEFORE UPDATE ON clan_battles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_battle_player_stats_updated_at BEFORE UPDATE ON battle_player_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_battle_nonplayer_stats_updated_at BEFORE UPDATE ON battle_nonplayer_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_clan_stats_updated_at BEFORE UPDATE ON monthly_clan_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_individual_stats_updated_at BEFORE UPDATE ON monthly_individual_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yearly_clan_stats_updated_at BEFORE UPDATE ON yearly_clan_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yearly_individual_stats_updated_at BEFORE UPDATE ON yearly_individual_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS (adjust as needed for your deployment)
-- ============================================================================

-- Example permissions for application database user
-- Uncomment and adjust username as needed for your environment
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO angrybirdman_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO angrybirdman_app;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
