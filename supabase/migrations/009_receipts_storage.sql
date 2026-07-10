-- ============================================================
-- Migration 009: Create Storage Bucket for Receipts
-- Brazos Abiertos con Venezuela — Donation Platform
-- ============================================================

-- Create 'receipts' bucket if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'receipts',
    'receipts',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage.objects for the 'receipts' bucket
-- Note: storage.objects has RLS enabled by default.

-- 1. Anyone can read receipt images (public bucket)
DROP POLICY IF EXISTS "Public Read Access for Receipts" ON storage.objects;
CREATE POLICY "Public Read Access for Receipts"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'receipts');

-- 2. Authenticated admins can insert receipt images
DROP POLICY IF EXISTS "Admins can upload receipts" ON storage.objects;
CREATE POLICY "Admins can upload receipts"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'receipts'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Authenticated admins can update receipt images
DROP POLICY IF EXISTS "Admins can update receipts" ON storage.objects;
CREATE POLICY "Admins can update receipts"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'receipts'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Authenticated admins can delete receipt images
DROP POLICY IF EXISTS "Admins can delete receipts" ON storage.objects;
CREATE POLICY "Admins can delete receipts"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'receipts'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
