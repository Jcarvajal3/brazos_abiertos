// ─── Areas (Donation Destinations) ───────────────────────────────────────────

export const AREAS_SEED = [
	{
		name: 'Infraestructura',
		slug: 'infraestructura',
		description: 'Reconstrucción de viviendas, puentes, carreteras y edificaciones dañadas.',
		icon: '🏗️',
		color: '#F97316', // orange
		sort_order: 1,
		active: true
	},
	{
		name: 'Salud',
		slug: 'salud',
		description: 'Atención médica, medicamentos, equipos hospitalarios y brigadas de salud.',
		icon: '🏥',
		color: '#EF4444', // red
		sort_order: 2,
		active: true
	},
	{
		name: 'Alimentación',
		slug: 'alimentacion',
		description: 'Distribución de alimentos, cocinas comunitarias y nutrición para damnificados.',
		icon: '🍱',
		color: '#EAB308', // yellow
		sort_order: 3,
		active: true
	},
	{
		name: 'Educación',
		slug: 'educacion',
		description: 'Reconstrucción de escuelas, útiles escolares y continuidad educativa.',
		icon: '📚',
		color: '#3B82F6', // blue
		sort_order: 4,
		active: true
	},
	{
		name: 'Mascotas',
		slug: 'mascotas',
		description: 'Atención veterinaria, refugios temporales y rescate de animales afectados.',
		icon: '🐾',
		color: '#A855F7', // purple
		sort_order: 5,
		active: true
	},
	{
		name: 'Albergues',
		slug: 'albergues',
		description: 'Refugios temporales, colchonetas, ropa y artículos de primera necesidad.',
		icon: '🏕️',
		color: '#14B8A6', // teal
		sort_order: 6,
		active: true
	}
] as const;

// ─── Payment Methods ──────────────────────────────────────────────────────────

export const PAYMENT_METHODS = {
	stripe: {
		id: 'stripe',
		name: 'Tarjeta de Crédito/Débito',
		description: 'Pago seguro con Stripe',
		currency: 'USD',
		icon: '💳'
	},
	pago_movil: {
		id: 'pago_movil',
		name: 'Pago Móvil',
		description: 'Transferencia mediante pago móvil (VES)',
		currency: 'VES',
		icon: '📱'
	},
	transferencia: {
		id: 'transferencia',
		name: 'Transferencia Bancaria',
		description: 'Transferencia bancaria directa (VES)',
		currency: 'VES',
		icon: '🏦'
	}
} as const;

// ─── Bank Details (Placeholder) ───────────────────────────────────────────────

export const BANK_DETAILS = {
	pago_movil: {
		bank: 'Banco de Venezuela',
		phone: '0414-000-0000',
		cedula: 'V-00.000.000',
		name: 'Brazos Abiertos con Venezuela'
	},
	transferencia: {
		bank: 'Banco de Venezuela',
		account_type: 'Corriente',
		account_number: '0102-0000-00-0000000000',
		rif: 'J-00000000-0',
		name: 'Brazos Abiertos con Venezuela'
	}
} as const;

// ─── Suggested Donation Amounts ───────────────────────────────────────────────

export const SUGGESTED_AMOUNTS_USD = [5, 10, 25, 50, 100, 250];
export const SUGGESTED_AMOUNTS_VES = [50, 100, 250, 500, 1000, 2500];

// ─── App Config ───────────────────────────────────────────────────────────────

export const APP_CONFIG = {
	name: 'Brazos Abiertos con Venezuela',
	tagline: 'Juntos reconstruimos Venezuela',
	description:
		'Plataforma de donaciones para ayudar a las víctimas del terremoto de Venezuela 2026.',
	email: 'contacto@brazosabiertos.org',
	social: {
		instagram: '@brazosabiertosvenezuela',
		twitter: '@brazosabiertos'
	}
} as const;

// ─── Admin ────────────────────────────────────────────────────────────────────

export const ADMIN_ROLE = 'admin';
export const ADMIN_ROUTES_PREFIX = '/admin';
