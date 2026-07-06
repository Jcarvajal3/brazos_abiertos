-- ============================================================
-- Migration 004: Enable Supabase Realtime
-- Brazos Abiertos con Venezuela
-- ============================================================

-- Enable Realtime publication for tables that need live updates.
-- This allows clients to subscribe to INSERT/UPDATE/DELETE events.

-- Add donations table to realtime publication
-- (Clients will subscribe to confirmed donation inserts for the live feed)
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;

-- Add projects table to realtime publication
-- (Admins can see new project registrations in real time)
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- Note: The 'areas' table changes rarely, so it does NOT need realtime.
-- Note: The 'profiles' table contains sensitive data — do NOT add to realtime.
