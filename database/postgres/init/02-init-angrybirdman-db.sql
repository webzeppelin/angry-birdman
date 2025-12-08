-- PostgreSQL Initialization Script for Angry Birdman
-- This script sets up the application database with proper extensions and configuration

-- Connect to the angrybirdman database
\c angrybirdman

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Trigram matching for text search

-- Create a dedicated schema for the application (optional, using public for now)
-- Future: Consider CREATE SCHEMA angrybirdman;

-- Set timezone to UTC for consistent timestamp handling
SET timezone = 'UTC';

-- Configure PostgreSQL settings for optimal performance
ALTER DATABASE angrybirdman SET timezone TO 'UTC';
ALTER DATABASE angrybirdman SET client_encoding TO 'UTF8';
ALTER DATABASE angrybirdman SET lc_messages TO 'en_US.UTF-8';
ALTER DATABASE angrybirdman SET lc_monetary TO 'en_US.UTF-8';
ALTER DATABASE angrybirdman SET lc_numeric TO 'en_US.UTF-8';
ALTER DATABASE angrybirdman SET lc_time TO 'en_US.UTF-8';

-- Create application user (if needed for separation of concerns)
-- DO
-- $do$
-- BEGIN
--    IF NOT EXISTS (
--       SELECT FROM pg_catalog.pg_roles
--       WHERE  rolname = 'angrybirdman_app') THEN
--       CREATE ROLE angrybirdman_app LOGIN PASSWORD 'app_password';
--    END IF;
-- END
-- $do$;

-- Grant necessary permissions to the application user
-- GRANT CONNECT ON DATABASE angrybirdman TO angrybirdman_app;
-- GRANT USAGE ON SCHEMA public TO angrybirdman_app;
-- GRANT CREATE ON SCHEMA public TO angrybirdman_app;

-- Note: Prisma will create the actual table schemas via migrations
-- This script only sets up the database environment

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'Angry Birdman database initialized successfully';
    RAISE NOTICE 'Extensions enabled: uuid-ossp, pg_trgm';
    RAISE NOTICE 'Ready for Prisma migrations';
END $$;
