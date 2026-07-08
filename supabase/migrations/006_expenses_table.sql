-- ============================================================
-- Migration 006: Create Expenses Table
-- Brazos Abiertos Fundacion — Expense Tracking
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLE: expenses
-- Tracks all fund disbursements / expenditures.
-- Loaded manually by administrators.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id             UUID NOT NULL REFERENCES public.areas(id) ON DELETE RESTRICT,
    project_id          UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    concept             TEXT NOT NULL,           -- Short description (e.g. "Compra de materiales")
    description         TEXT,                    -- Detailed description
    amount              NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency            TEXT NOT NULL DEFAULT 'USD'
                            CHECK (currency IN ('USD', 'VES')),
    expense_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_image_url   TEXT,                    -- URL to uploaded receipt/invoice image
    receipt_image_urls  TEXT[],                  -- Multiple receipt images (array)
    vendor              TEXT,                    -- Vendor / supplier name
    created_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes               TEXT,                    -- Internal admin notes
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_area ON public.expenses(area_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date DESC);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS expenses_set_updated_at ON public.expenses;
CREATE TRIGGER expenses_set_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- VIEW: expense_stats
-- Aggregated expense statistics for the public dashboard.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.expense_stats AS
SELECT
    COALESCE(SUM(amount) FILTER (WHERE currency = 'USD'), 0) AS total_expenses_usd,
    COALESCE(SUM(amount) FILTER (WHERE currency = 'VES'), 0) AS total_expenses_ves,
    COUNT(*)                                                   AS total_expense_records,
    NOW()                                                      AS last_updated
FROM public.expenses;

-- ─────────────────────────────────────────────────────────────
-- RLS Policies for expenses
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Public can read all expenses (transparency)
CREATE POLICY "Expenses are publicly readable"
    ON public.expenses FOR SELECT
    USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert expenses"
    ON public.expenses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update expenses"
    ON public.expenses FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete expenses"
    ON public.expenses FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
