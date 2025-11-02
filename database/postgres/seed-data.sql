-- ============================================================================
-- Angry Birdman PostgreSQL Seed Data
-- ============================================================================
-- This file contains initial data required for the Angry Birdman system.
-- Run this after schema.sql to populate lookup tables and test data.
-- ============================================================================

-- ============================================================================
-- ACTION CODES LOOKUP DATA
-- ============================================================================

-- Insert initial action codes as specified in high-level-spec.md Section 6
-- These are managed by Superadmin and can be extended in the future
INSERT INTO action_codes (action_code, display_name, description, active) VALUES
    ('HOLD', 'Hold', 'Keep player in clan without any warnings or actions', true),
    ('WARN', 'Warn', 'Issue warning to player about performance or participation', true),
    ('KICK', 'Kick', 'Remove player from clan roster', true),
    ('RESERVE', 'Move to Reserve', 'Move player to reserve status (inactive, low FP)', true),
    ('PASS', 'Pass', 'Give player a pass for this battle - miss does not count against kicking policies', true)
ON CONFLICT (action_code) DO NOTHING;

COMMENT ON TABLE action_codes IS 'Initial action codes loaded from seed-data.sql';

-- ============================================================================
-- DEVELOPMENT/TEST DATA (Optional - remove for production)
-- ============================================================================

-- Uncomment the following sections to load test data for development

/*
-- Test Clan
INSERT INTO clans (rovio_id, name, country, registration_date, active) VALUES
    (123456, 'Test Birds United', 'USA', '2025-01-01', true)
ON CONFLICT (rovio_id) DO NOTHING;

-- Test Admin User (assumes Keycloak user exists with this ID)
-- Note: In real scenario, users are created through Keycloak registration
INSERT INTO clan_admin_users (user_id, username, email, clan_id, is_owner, is_superadmin) VALUES
    ('keycloak-user-id-123', 'testadmin', 'admin@testbirds.com', 1, true, false)
ON CONFLICT (user_id) DO NOTHING;

-- Test Roster Members
INSERT INTO roster_members (clan_id, player_name, active, joined_date) VALUES
    (1, 'BirdMaster', true, '2025-01-01'),
    (1, 'AngryAce', true, '2025-01-05'),
    (1, 'FeatheredFury', true, '2025-01-10'),
    (1, 'WingedWarrior', true, '2025-01-15'),
    (1, 'InactivePlayer', false, '2024-12-01')
ON CONFLICT DO NOTHING;

-- Update inactive player with left date
UPDATE roster_members 
SET left_date = '2025-01-20' 
WHERE player_name = 'InactivePlayer' AND clan_id = 1;

-- Test Battle
INSERT INTO clan_battles (
    clan_id, battle_id, start_date, end_date, result,
    score, fp, baseline_fp, ratio, average_ratio, projected_score,
    opponent_name, opponent_rovio_id, opponent_country, opponent_score, opponent_fp,
    margin_ratio, fp_margin,
    nonplaying_count, nonplaying_fp_ratio, reserve_count, reserve_fp_ratio
) VALUES (
    1, '20250115', '2025-01-15', '2025-01-16', 1,
    45000, 5000, 5500, 81.82, 90.00, 45000,
    'Enemy Eagles', 654321, 'Canada', 42000, 5200,
    7.14, -5.45,
    1, 2.00, 0, 0.00
)
ON CONFLICT (clan_id, battle_id) DO NOTHING;

-- Test Player Stats
INSERT INTO battle_player_stats (
    clan_id, battle_id, player_id,
    rank, score, fp, ratio, ratio_rank,
    action_code
) VALUES
    (1, '20250115', 1, 1, 15000, 1500, 100.00, 1, 'HOLD'),
    (1, '20250115', 2, 2, 14000, 1600, 87.50, 2, 'HOLD'),
    (1, '20250115', 3, 3, 10000, 1200, 83.33, 3, 'HOLD'),
    (1, '20250115', 4, 4, 6000, 800, 75.00, 4, 'WARN')
ON CONFLICT (clan_id, battle_id, player_id) DO NOTHING;

-- Test Non-Player Stats
INSERT INTO battle_nonplayer_stats (
    clan_id, battle_id, player_id,
    fp, reserve, action_code, action_reason
) VALUES
    (1, '20250115', 5, 100, false, 'KICK', 'Inactive for 3+ battles')
ON CONFLICT (clan_id, battle_id, player_id) DO NOTHING;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Uncomment to verify seed data loaded correctly

/*
SELECT 'Action Codes:' AS info;
SELECT action_code, display_name, active FROM action_codes ORDER BY action_code;

SELECT 'Clans:' AS info;
SELECT clan_id, name, rovio_id, country FROM clans ORDER BY clan_id;

SELECT 'Admin Users:' AS info;
SELECT user_id, username, email, clan_id, is_owner FROM clan_admin_users ORDER BY username;

SELECT 'Roster Members:' AS info;
SELECT player_id, clan_id, player_name, active FROM roster_members ORDER BY clan_id, player_id;

SELECT 'Battles:' AS info;
SELECT clan_id, battle_id, start_date, score, opponent_name FROM clan_battles ORDER BY clan_id, battle_id;
*/

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
