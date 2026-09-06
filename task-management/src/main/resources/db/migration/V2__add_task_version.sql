-- Migration V2: Add version column to tasks table for Optimistic Locking
ALTER TABLE tasks ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
