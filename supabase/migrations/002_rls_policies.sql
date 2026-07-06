-- ============================================================
-- Migration 002: Row Level Security (RLS) Policies
-- Brazos Abiertos con Venezuela
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Enable RLS on all tables
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- Helper: Check if current user is admin
-- Uses app_metadata.roles which is only settable by service_role
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN 'admin' = ANY(
        ARRAY(
            SELECT jsonb_array_elements_text(
                (auth.jwt() -> 'app_metadata' -> 'roles')
            )
        )
    );
EXCEPTION
    WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────────────────────
-- TABLE: profiles
-- ─────────────────────────────────────────────────────────────

-- Users can read their own profile; admins can read all
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (
        (SELECT auth.uid()) = id OR public.is_admin()
    );

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- Admins can update any profile (e.g., set role)
CREATE POLICY "profiles_update_admin" ON public.profiles
    FOR UPDATE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- TABLE: areas
-- ─────────────────────────────────────────────────────────────

-- Everyone can read active areas (public data)
CREATE POLICY "areas_select_public" ON public.areas
    FOR SELECT USING (active = true OR public.is_admin());

-- Only admins can insert/update/delete areas
CREATE POLICY "areas_all_admin" ON public.areas
    FOR ALL USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- TABLE: projects
-- ─────────────────────────────────────────────────────────────

-- Public: anyone can view approved projects
CREATE POLICY "projects_select_approved" ON public.projects
    FOR SELECT USING (
        status = 'approved' OR public.is_admin()
    );

-- ONGs can view their own projects (all statuses)
CREATE POLICY "projects_select_own" ON public.projects
    FOR SELECT USING (
        ong_profile_id = (SELECT auth.uid())
    );

-- Authenticated users and anonymous can submit projects (INSERT)
CREATE POLICY "projects_insert_any" ON public.projects
    FOR INSERT WITH CHECK (true);

-- ONGs can update their own pending projects (before approval)
CREATE POLICY "projects_update_own_pending" ON public.projects
    FOR UPDATE USING (
        ong_profile_id = (SELECT auth.uid()) AND status = 'pending'
    );

-- Admins can update any project (to approve/reject)
CREATE POLICY "projects_update_admin" ON public.projects
    FOR UPDATE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- TABLE: donations
-- ─────────────────────────────────────────────────────────────

-- Public: anyone can view confirmed donations (for the public feed)
-- BUT sensitive fields (email) are excluded via the view
CREATE POLICY "donations_select_confirmed_public" ON public.donations
    FOR SELECT USING (
        payment_status = 'confirmed' OR
        donor_profile_id = (SELECT auth.uid()) OR
        public.is_admin()
    );

-- Anyone can insert a donation (anonymous or authenticated)
CREATE POLICY "donations_insert_any" ON public.donations
    FOR INSERT WITH CHECK (true);

-- Only admins can update donations (to confirm/reject manual payments)
CREATE POLICY "donations_update_admin" ON public.donations
    FOR UPDATE USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Secure the donation_stats view: accessible by all
-- ─────────────────────────────────────────────────────────────
-- (Views inherit RLS from underlying tables, but SELECT from
--  donation_stats is safe as it only exposes aggregates)
GRANT SELECT ON public.donation_stats TO anon, authenticated;
GRANT SELECT ON public.areas TO anon, authenticated;
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT SELECT ON public.donations TO anon, authenticated;
GRANT INSERT ON public.donations TO anon, authenticated;
GRANT INSERT ON public.projects TO anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
