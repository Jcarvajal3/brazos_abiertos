-- ============================================================
-- Migration 007: Enable Supabase Realtime for expenses
-- Brazos Abiertos Fundacion
-- ============================================================

-- Add expenses table to realtime publication
-- This allows the public homepage to receive live updates when
-- an admin registers a new expense, keeping the transparency
-- counters up-to-date in real time.
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
