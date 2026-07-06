-- ============================================================
-- Migration 001: Create Tables
-- Brazos Abiertos con Venezuela — Donation Platform
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- TABLE: profiles
-- Extends Supabase auth.users with app-specific data.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT,
    email       TEXT,
    phone       TEXT,
    role        TEXT NOT NULL DEFAULT 'donor' CHECK (role IN ('donor', 'ong', 'admin')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-create profile when a new auth user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'role', 'donor')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- TABLE: areas
-- Donation destination areas (health, infrastructure, etc.)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.areas (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT,
    icon        TEXT NOT NULL DEFAULT '🎯',
    color       TEXT NOT NULL DEFAULT '#F97316',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    active      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: projects
-- ONG/charity projects registered to receive donations.
-- Status: pending → approved/rejected by admin.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ong_profile_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    area_id             UUID NOT NULL REFERENCES public.areas(id) ON DELETE RESTRICT,
    name                TEXT NOT NULL,
    description         TEXT NOT NULL,
    ong_name            TEXT NOT NULL,
    ong_contact_email   TEXT NOT NULL,
    ong_phone           TEXT,
    ong_document        TEXT,  -- RIF or ID document
    status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected')),
    goal_amount         NUMERIC(12, 2),
    current_amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cover_image_url     TEXT,
    website_url         TEXT,
    rejection_reason    TEXT,
    approved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for filtering by area and status
CREATE INDEX IF NOT EXISTS idx_projects_area_status ON public.projects(area_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_set_updated_at ON public.projects;
CREATE TRIGGER projects_set_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- TABLE: donations
-- Central table for all donations (Stripe + manual payments).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.donations (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_profile_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    area_id                     UUID NOT NULL REFERENCES public.areas(id) ON DELETE RESTRICT,
    project_id                  UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    donor_name                  TEXT,           -- Visible name (null = anonymous)
    donor_email                 TEXT,           -- For receipts (not shown publicly)
    amount                      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency                    TEXT NOT NULL DEFAULT 'USD'
                                    CHECK (currency IN ('USD', 'VES')),
    payment_method              TEXT NOT NULL
                                    CHECK (payment_method IN ('stripe', 'pago_movil', 'transferencia')),
    payment_status              TEXT NOT NULL DEFAULT 'pending'
                                    CHECK (payment_status IN ('pending', 'confirmed', 'failed', 'refunded')),
    stripe_payment_intent_id    TEXT UNIQUE,    -- Null for manual payments
    manual_reference            TEXT,           -- Reference number from bank transfer / pago móvil
    manual_bank                 TEXT,           -- Origin bank name
    admin_notes                 TEXT,           -- Admin confirmation notes
    is_anonymous                BOOLEAN NOT NULL DEFAULT false,
    message                     TEXT,           -- Optional public message from donor
    confirmed_at                TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_donations_area ON public.donations(area_id);
CREATE INDEX IF NOT EXISTS idx_donations_project ON public.donations(project_id);
CREATE INDEX IF NOT EXISTS idx_donations_created ON public.donations(created_at DESC);
-- Note: We do not index by auth.uid() directly (volatile function not allowed in indexes).
-- Queries for a donor's own donations will use idx_donations_status or a sequential scan on donor_profile_id.
CREATE INDEX IF NOT EXISTS idx_donations_donor_profile ON public.donations(donor_profile_id)
    WHERE donor_profile_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION: Update project.current_amount when donation confirmed
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_project_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- When a donation is confirmed and has a project_id, increment the project's total
    IF NEW.payment_status = 'confirmed' AND NEW.project_id IS NOT NULL THEN
        -- Only update if status changed to 'confirmed' (not on insert)
        IF TG_OP = 'UPDATE' AND OLD.payment_status != 'confirmed' THEN
            UPDATE public.projects
            SET current_amount = current_amount + NEW.amount
            WHERE id = NEW.project_id;
        ELSIF TG_OP = 'INSERT' AND NEW.payment_status = 'confirmed' THEN
            UPDATE public.projects
            SET current_amount = current_amount + NEW.amount
            WHERE id = NEW.project_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS donation_update_project_amount ON public.donations;
CREATE TRIGGER donation_update_project_amount
    AFTER INSERT OR UPDATE OF payment_status ON public.donations
    FOR EACH ROW EXECUTE FUNCTION public.update_project_amount();

-- ─────────────────────────────────────────────────────────────
-- VIEW: donation_stats
-- Aggregated statistics for the public dashboard.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.donation_stats AS
SELECT
    COALESCE(SUM(amount) FILTER (WHERE currency = 'USD' AND payment_status = 'confirmed'), 0) AS total_raised_usd,
    COALESCE(SUM(amount) FILTER (WHERE currency = 'VES' AND payment_status = 'confirmed'), 0) AS total_raised_ves,
    COUNT(DISTINCT donor_profile_id) FILTER (WHERE payment_status = 'confirmed')              AS total_donors,
    COUNT(*) FILTER (WHERE payment_status = 'confirmed')                                       AS total_donations,
    NOW()                                                                                      AS last_updated
FROM public.donations;
