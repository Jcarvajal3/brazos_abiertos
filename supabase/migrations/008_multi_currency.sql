-- ============================================================
-- Migration 008: Multi-Currency Support
-- Brazos Abiertos con Venezuela — Donation Platform
-- ============================================================
-- Adds:
--   • country column on donations (optional, donor's country)
--   • donor_currency column (original currency chosen by donor)
--   • EUR and USDT support in currency CHECK
--   • zelle, bizum, crypto support in payment_method CHECK
--   • Updated donation_stats view with EUR and USDT totals
-- ============================================================

-- ─── 1. Add country column ───────────────────────────────────
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS country TEXT;

-- ─── 2. Add donor_currency column ───────────────────────────
-- Stores the currency the donor selected (may differ from
-- stored currency if we normalise e.g. Bs → USD amounts)
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS donor_currency TEXT;

-- ─── 3. Update currency CHECK to include EUR and USDT ────────
-- Drop and recreate the constraint
ALTER TABLE public.donations
  DROP CONSTRAINT IF EXISTS donations_currency_check;

ALTER TABLE public.donations
  ADD CONSTRAINT donations_currency_check
    CHECK (currency IN ('USD', 'VES', 'EUR', 'USDT'));

-- ─── 4. Update payment_method CHECK to include new methods ───
ALTER TABLE public.donations
  DROP CONSTRAINT IF EXISTS donations_payment_method_check;

ALTER TABLE public.donations
  ADD CONSTRAINT donations_payment_method_check
    CHECK (payment_method IN (
      'stripe', 'pago_movil', 'transferencia',
      'zelle', 'bizum', 'crypto'
    ));

-- ─── 5. Update donation_stats view ───────────────────────────
DROP VIEW IF EXISTS public.donation_stats;

CREATE OR REPLACE VIEW public.donation_stats AS
SELECT
  COALESCE(SUM(amount) FILTER (WHERE payment_status = 'confirmed' AND currency = 'USD'),  0) AS total_raised_usd,
  COALESCE(SUM(amount) FILTER (WHERE payment_status = 'confirmed' AND currency = 'VES'),  0) AS total_raised_ves,
  COALESCE(SUM(amount) FILTER (WHERE payment_status = 'confirmed' AND currency = 'EUR'),  0) AS total_raised_eur,
  COALESCE(SUM(amount) FILTER (WHERE payment_status = 'confirmed' AND currency = 'USDT'), 0) AS total_raised_usdt,
  COUNT(DISTINCT CASE
    WHEN donor_profile_id IS NOT NULL THEN donor_profile_id::text
    WHEN donor_email     IS NOT NULL THEN donor_email
    ELSE id::text
  END) FILTER (WHERE payment_status = 'confirmed') AS total_donors,
  COUNT(*) FILTER (WHERE payment_status = 'confirmed')                                     AS total_donations,
  NOW()                                                                                     AS last_updated
FROM public.donations;

-- Re-grant access (anon and authenticated can read stats)
GRANT SELECT ON public.donation_stats TO anon, authenticated;
