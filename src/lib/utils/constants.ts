// ─── Areas (Donation Destinations) ───────────────────────────────────────────

export const AREAS_SEED = [
	{
		name: 'Infraestructura',
		slug: 'infraestructura',
		description: 'Reconstrucción de viviendas, puentes, carreteras y edificaciones dañadas.',
		icon: '🏗️',
		color: '#14609A', // primary blue
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

// ─── Currency Options (Step 3 Selector) ───────────────────────────────────────

export type DonorCurrencyOption = 'VES' | 'USD' | 'EUR' | 'USDT';

export const CURRENCY_OPTIONS: Array<{
	id: DonorCurrencyOption;
	label: string;
	flag: string;
	description: string;
}> = [
	{ id: 'USD', label: 'Dólares USD', flag: '🇺🇸', description: 'US Dollar' },
	{ id: 'VES', label: 'Bolívares', flag: '🇻🇪', description: 'Bolívar venezolano' },
	{ id: 'EUR', label: 'Euros', flag: '🇪🇺', description: 'Euro' },
	{ id: 'USDT', label: 'Cripto', flag: '₮', description: 'USDT (Tether)' }
];

// ─── Exchange Rates (fallback fixed rates) ────────────────────────────────────

// EUR to USD fixed rate (updated periodically, or use live API)
export const EUR_TO_USD_RATE = 1.08;
// USDT is pegged 1:1 to USD
export const USDT_TO_USD_RATE = 1.0;

// ─── Payment Methods ──────────────────────────────────────────────────────────

export const PAYMENT_METHODS = {
	stripe: {
		id: 'stripe',
		name: 'Tarjeta de Crédito/Débito',
		description: 'Pago seguro con Stripe',
		icon: 'credit_card'
	},
	zelle: {
		id: 'zelle',
		name: 'Zelle',
		description: 'Transferencia via Zelle',
		icon: 'send_money'
	},
	bizum: {
		id: 'bizum',
		name: 'Bizum',
		description: 'Pago móvil España',
		icon: 'smartphone'
	},
	crypto: {
		id: 'crypto',
		name: 'Cripto (USDt)',
		description: 'Pago en criptomonedas',
		icon: 'currency_bitcoin'
	},
	pago_movil: {
		id: 'pago_movil',
		name: 'Pago Móvil',
		description: 'Transferencia mediante pago móvil (VES)',
		icon: 'smartphone'
	},
	transferencia: {
		id: 'transferencia',
		name: 'Transferencia Bancaria',
		description: 'Transferencia bancaria directa (VES)',
		icon: 'account_balance'
	}
} as const;

// ─── Payment methods available per donor currency ────────────────────────────

export const PAYMENT_METHODS_BY_CURRENCY: Record<DonorCurrencyOption, string[]> = {
	USD:  ['stripe', 'zelle'],
	EUR:  ['stripe', 'bizum'],
	USDT: ['crypto'],
	VES:  ['pago_movil', 'transferencia']
};

// ─── Bank & Payment Details (Placeholders) ────────────────────────────────────

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
	},
	zelle: {
		email: 'donaciones@brazosabiertos.org',
		name: 'Brazos Abiertos con Venezuela'
	},
	bizum: {
		phone: '+34 600 000 000',
		name: 'Brazos Abiertos con Venezuela'
	},
	crypto: {
		network: 'TRC-20 (Tron)',
		symbol: 'USDt',
		address: 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXxx',
		qr_hint: 'Envía únicamente USDt (Tether) en la red TRC-20'
	}
} as const;

// ─── Suggested Donation Amounts ───────────────────────────────────────────────

export const SUGGESTED_AMOUNTS_USD  = [5, 10, 25, 50, 100, 250];
export const SUGGESTED_AMOUNTS_VES  = [5, 10, 25, 50, 100, 250]; // displayed in USD, converted to VES at payment step
export const SUGGESTED_AMOUNTS_EUR  = [5, 10, 25, 50, 100, 250];
export const SUGGESTED_AMOUNTS_USDT = [5, 10, 25, 50, 100, 250];

// ─── Countries List ───────────────────────────────────────────────────────────

export const COUNTRIES = [
	{ code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
	{ code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
	{ code: 'CO', name: 'Colombia', flag: '🇨🇴' },
	{ code: 'PE', name: 'Perú', flag: '🇵🇪' },
	{ code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
	{ code: 'CL', name: 'Chile', flag: '🇨🇱' },
	{ code: 'AR', name: 'Argentina', flag: '🇦🇷' },
	{ code: 'MX', name: 'México', flag: '🇲🇽' },
	{ code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
	{ code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
	{ code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
	{ code: 'BR', name: 'Brasil', flag: '🇧🇷' },
	{ code: 'ES', name: 'España', flag: '🇪🇸' },
	{ code: 'PT', name: 'Portugal', flag: '🇵🇹' },
	{ code: 'IT', name: 'Italia', flag: '🇮🇹' },
	{ code: 'FR', name: 'Francia', flag: '🇫🇷' },
	{ code: 'DE', name: 'Alemania', flag: '🇩🇪' },
	{ code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
	{ code: 'CA', name: 'Canadá', flag: '🇨🇦' },
	{ code: 'AU', name: 'Australia', flag: '🇦🇺' },
	{ code: 'PA', name: 'Panamá', flag: '🇵🇦' },
	{ code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
	{ code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
	{ code: 'HN', name: 'Honduras', flag: '🇭🇳' },
	{ code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
	{ code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
	{ code: 'DO', name: 'Rep. Dominicana', flag: '🇩🇴' },
	{ code: 'CU', name: 'Cuba', flag: '🇨🇺' },
	{ code: 'TT', name: 'Trinidad y Tobago', flag: '🇹🇹' },
	{ code: 'NL', name: 'Países Bajos', flag: '🇳🇱' },
	{ code: 'BE', name: 'Bélgica', flag: '🇧🇪' },
	{ code: 'CH', name: 'Suiza', flag: '🇨🇭' },
	{ code: 'SE', name: 'Suecia', flag: '🇸🇪' },
	{ code: 'NO', name: 'Noruega', flag: '🇳🇴' },
	{ code: 'DK', name: 'Dinamarca', flag: '🇩🇰' },
	{ code: 'JP', name: 'Japón', flag: '🇯🇵' },
	{ code: 'CN', name: 'China', flag: '🇨🇳' },
	{ code: 'KR', name: 'Corea del Sur', flag: '🇰🇷' },
	{ code: 'IL', name: 'Israel', flag: '🇮🇱' },
	{ code: 'AE', name: 'Emiratos Árabes', flag: '🇦🇪' },
	{ code: 'OTHER', name: 'Otro', flag: '🌍' }
] as const;

// ─── App Config ───────────────────────────────────────────────────────────────

export const APP_CONFIG = {
	name: 'Brazos Abiertos Fundacion',
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
