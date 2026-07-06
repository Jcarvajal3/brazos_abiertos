-- ============================================================
-- Migration 003: Seed Data — Areas
-- Brazos Abiertos con Venezuela
-- ============================================================

INSERT INTO public.areas (name, slug, description, icon, color, sort_order, active)
VALUES
    (
        'Infraestructura',
        'infraestructura',
        'Reconstrucción de viviendas, puentes, carreteras y edificaciones dañadas por el terremoto.',
        '🏗️',
        '#F97316',
        1,
        true
    ),
    (
        'Salud',
        'salud',
        'Atención médica de emergencia, medicamentos, equipos hospitalarios y brigadas de salud.',
        '🏥',
        '#EF4444',
        2,
        true
    ),
    (
        'Alimentación',
        'alimentacion',
        'Distribución de alimentos, cocinas comunitarias y atención nutricional para damnificados.',
        '🍱',
        '#EAB308',
        3,
        true
    ),
    (
        'Educación',
        'educacion',
        'Reconstrucción de escuelas, útiles escolares y continuidad de la educación en zonas afectadas.',
        '📚',
        '#3B82F6',
        4,
        true
    ),
    (
        'Mascotas',
        'mascotas',
        'Atención veterinaria, refugios temporales y rescate de animales afectados por el terremoto.',
        '🐾',
        '#A855F7',
        5,
        true
    ),
    (
        'Albergues',
        'albergues',
        'Refugios temporales, colchonetas, ropa y artículos de primera necesidad para damnificados.',
        '🏕️',
        '#14B8A6',
        6,
        true
    )
ON CONFLICT (slug) DO NOTHING;
