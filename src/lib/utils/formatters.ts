import type { DonationCurrency, PaymentMethod } from '$lib/types';

// ─── Currency Formatters ──────────────────────────────────────────────────────

/**
 * Format a monetary amount based on currency.
 */
export function formatCurrency(amount: number, currency: DonationCurrency): string {
	if (currency === 'USD') {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	}

	// Venezuelan Bolívar
	return new Intl.NumberFormat('es-VE', {
		style: 'currency',
		currency: 'VES',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(amount);
}

/**
 * Format USD amount for Stripe (converts to cents).
 */
export function toStripeCents(usdAmount: number): number {
	return Math.round(usdAmount * 100);
}

// ─── Date Formatters ──────────────────────────────────────────────────────────

/**
 * Format a date string as a relative time (e.g. "hace 2 minutos").
 */
export function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSecs = Math.floor(diffMs / 1000);
	const diffMins = Math.floor(diffSecs / 60);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSecs < 60) return 'hace un momento';
	if (diffMins < 60) return `hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
	if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
	if (diffDays < 7) return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;

	return new Intl.DateTimeFormat('es-VE', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	}).format(date);
}

/**
 * Format a date string as a full datetime.
 */
export function formatDateTime(dateString: string): string {
	return new Intl.DateTimeFormat('es-VE', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(dateString));
}

// ─── Payment Method Labels ────────────────────────────────────────────────────

export function getPaymentMethodLabel(method: PaymentMethod): string {
	const labels: Record<PaymentMethod, string> = {
		stripe: 'Tarjeta de Crédito/Débito',
		pago_movil: 'Pago Móvil',
		transferencia: 'Transferencia Bancaria'
	};
	return labels[method];
}

// ─── Donation Donor Name ──────────────────────────────────────────────────────

/**
 * Returns display name for a donation, respecting anonymous preference.
 */
export function getDonorDisplayName(
	isAnonymous: boolean,
	donorName: string | null
): string {
	if (isAnonymous || !donorName?.trim()) return 'Donante anónimo';
	return donorName.trim();
}

// ─── Number Formatting ────────────────────────────────────────────────────────

/**
 * Format a large number with commas (e.g. 1234567 → "1,234,567").
 */
export function formatNumber(num: number): string {
	return new Intl.NumberFormat('es-VE').format(num);
}

/**
 * Truncate text to a max length with ellipsis.
 */
export function truncate(text: string, maxLength: number = 100): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength).trim() + '…';
}

// ─── Slugify ──────────────────────────────────────────────────────────────────

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-');
}
