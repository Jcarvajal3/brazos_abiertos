-- ─── Migration 005: Helper Functions & RPC ───────────────────────────────────

-- Function: increment_project_amount
-- Called after confirming a manual donation linked to a project.
-- Uses a safe increment to avoid race conditions.
CREATE OR REPLACE FUNCTION increment_project_amount(p_project_id UUID, p_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE projects
  SET current_amount = current_amount + p_amount
  WHERE id = p_project_id;
END;
$$;

-- Grant execute to service role only (called via supabaseAdmin)
REVOKE EXECUTE ON FUNCTION increment_project_amount FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_project_amount TO service_role;

-- ─── Function: set_admin_role ──────────────────────────────────────────────────
-- Convenience function to promote a user to admin.
-- Call this manually via Supabase SQL editor:
--   SELECT set_admin_role('user-uuid-here');

CREATE OR REPLACE FUNCTION set_admin_role(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    '{"roles": ["admin"]}'::jsonb
  WHERE id = target_user_id;
  
  -- Also update the public profile role
  UPDATE profiles
  SET role = 'admin'
  WHERE id = target_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_admin_role FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_admin_role TO service_role;

-- ─── Updated donation_stats view (now includes all confirmed currencies) ───────
DROP VIEW IF EXISTS donation_stats;

CREATE VIEW donation_stats AS
SELECT
  COALESCE(SUM(amount) FILTER (WHERE payment_status = 'confirmed' AND currency = 'USD'), 0) AS total_raised_usd,
  COALESCE(SUM(amount) FILTER (WHERE payment_status = 'confirmed' AND currency = 'VES'), 0) AS total_raised_ves,
  COUNT(DISTINCT CASE
    WHEN donor_profile_id IS NOT NULL THEN donor_profile_id::text
    WHEN donor_email IS NOT NULL THEN donor_email
    ELSE id::text
  END) FILTER (WHERE payment_status = 'confirmed') AS total_donors,
  COUNT(*) FILTER (WHERE payment_status = 'confirmed') AS total_donations,
  NOW() AS last_updated
FROM donations;

-- Grant read access to anon and authenticated roles
GRANT SELECT ON donation_stats TO anon, authenticated;
