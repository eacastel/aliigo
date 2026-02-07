-- Add JSONB assistant settings for structured assistant configuration
-- Run in Supabase SQL editor

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS assistant_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Optional: backfill from existing prompts (kept as raw text)
-- You can keep assistant_settings empty and rely on existing system_prompt/knowledge.
