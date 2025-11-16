-- Sync Keycloak test users to database with composite IDs
-- This creates database records for test users that exist in Keycloak

-- Insert test users with composite IDs (keycloak:{sub})
INSERT INTO users (user_id, username, email, clan_id, owner, roles, enabled, created_at, updated_at)
VALUES
  -- testsuperadmin (superadmin, no clan)
  ('keycloak:146aa082-29f1-47dc-8b36-a7655e92c8e3', 'testsuperadmin', 'superadmin@angrybirdman.test', NULL, false, ARRAY['superadmin']::text[], true, NOW(), NOW()),
  
  -- testowner (clan-owner, clan 54 - Angry Avengers)
  ('keycloak:78db651c-cf9f-4248-abbc-2d35c24d926e', 'testowner', 'owner@angrybirdman.test', 54, true, ARRAY['user', 'clan-owner']::text[], true, NOW(), NOW()),
  
  -- testadmin (clan-admin, clan 54 - Angry Avengers)
  ('keycloak:f2b53678-b070-4917-b95c-d3995f7243f1', 'testadmin', 'admin@angrybirdman.test', 54, false, ARRAY['user', 'clan-admin']::text[], true, NOW(), NOW()),
  
  -- testuser (basic user, clan 54 - Angry Avengers)
  ('keycloak:e71f1974-16b8-4e7e-bdf9-438837c3c279', 'testuser', 'user@angrybirdman.test', 54, false, ARRAY['user']::text[], true, NOW(), NOW()),
  
  -- testowner2 (clan-owner, clan 55 - Feather Fury)
  ('keycloak:bd372b93-a9e4-4eaa-90e9-afa1d733fdfa', 'testowner2', 'owner2@angrybirdman.test', 55, true, ARRAY['user', 'clan-owner']::text[], true, NOW(), NOW())

ON CONFLICT (user_id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  clan_id = EXCLUDED.clan_id,
  owner = EXCLUDED.owner,
  roles = EXCLUDED.roles,
  enabled = EXCLUDED.enabled,
  updated_at = NOW();

-- Display created users
SELECT user_id, username, email, clan_id, owner, roles FROM users WHERE user_id LIKE 'keycloak:%' ORDER BY username;
