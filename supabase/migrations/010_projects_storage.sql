-- ============================================================
-- Migration 010: Create Storage Bucket for Project Covers
-- Brazos Abiertos con Venezuela — Donation Platform
-- ============================================================

-- Create 'projects' bucket if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'projects',
    'projects',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage.objects for the 'projects' bucket
-- Note: storage.objects has RLS enabled by default.

-- 1. Anyone can read project cover images (public bucket)
DROP POLICY IF EXISTS "Public Read Access for Projects" ON storage.objects;
CREATE POLICY "Public Read Access for Projects"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'projects');

-- 2. Authenticated admins can insert project covers
DROP POLICY IF EXISTS "Admins can upload project covers" ON storage.objects;
CREATE POLICY "Admins can upload project covers"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'projects'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Authenticated admins can update project covers
DROP POLICY IF EXISTS "Admins can update project covers" ON storage.objects;
CREATE POLICY "Admins can update project covers"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'projects'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Authenticated admins can delete project covers
DROP POLICY IF EXISTS "Admins can delete project covers" ON storage.objects;
CREATE POLICY "Admins can delete project covers"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'projects'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
