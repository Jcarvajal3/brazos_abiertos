import { z } from 'zod';

// ─── Donation Form Schema ─────────────────────────────────────────────────────

export const donationSchema = z
	.object({
		area_id: z.string().uuid('Debes seleccionar un área de destino'),
		project_id: z.string().uuid().nullable().optional(),
		donor_name: z
			.string()
			.max(100, 'El nombre no puede superar 100 caracteres')
			.optional()
			.transform((v) => v?.trim() || null),
		donor_email: z
			.string()
			.email('El correo electrónico no es válido')
			.max(254)
			.optional()
			.transform((v) => v?.trim().toLowerCase() || null),
		amount: z
			.number({ error: 'El monto debe ser un número válido' })
			.positive('El monto debe ser mayor a cero')
			.max(100000, 'El monto máximo por donación es 100,000'),
		currency: z.enum(['USD', 'VES']),
		payment_method: z.enum(['stripe', 'pago_movil', 'transferencia']),
		is_anonymous: z.boolean().default(false),
		message: z
			.string()
			.max(500, 'El mensaje no puede superar 500 caracteres')
			.optional()
			.transform((v) => v?.trim() || null),
		// Manual payment fields
		manual_reference: z.string().max(100).optional().transform((v) => v?.trim() || null),
		manual_bank: z.string().max(100).optional().transform((v) => v?.trim() || null)
	})
	.superRefine((data, ctx) => {
		// Stripe only accepts USD
		if (data.payment_method === 'stripe' && data.currency !== 'USD') {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Los pagos con tarjeta solo se aceptan en USD',
				path: ['currency']
			});
		}

		// Manual payments require reference
		if (
			(data.payment_method === 'pago_movil' || data.payment_method === 'transferencia') &&
			!data.manual_reference
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Debes ingresar el número de referencia de la transacción',
				path: ['manual_reference']
			});
		}
	});

export type DonationInput = z.infer<typeof donationSchema>;

// ─── Project Registration Schema ──────────────────────────────────────────────

export const projectRegistrationSchema = z.object({
	area_id: z.string().uuid('Debes seleccionar un área'),
	name: z
		.string()
		.min(3, 'El nombre del proyecto debe tener al menos 3 caracteres')
		.max(200, 'El nombre no puede superar 200 caracteres')
		.transform((v) => v.trim()),
	description: z
		.string()
		.min(50, 'La descripción debe tener al menos 50 caracteres')
		.max(2000, 'La descripción no puede superar 2000 caracteres')
		.transform((v) => v.trim()),
	ong_name: z
		.string()
		.min(2, 'El nombre de la ONG debe tener al menos 2 caracteres')
		.max(200)
		.transform((v) => v.trim()),
	ong_contact_email: z
		.string()
		.email('El correo de contacto no es válido')
		.transform((v) => v.trim().toLowerCase()),
	ong_phone: z
		.string()
		.max(30)
		.optional()
		.transform((v) => v?.trim() || null),
	ong_document: z
		.string()
		.max(50, 'El documento no puede superar 50 caracteres')
		.optional()
		.transform((v) => v?.trim() || null),
	goal_amount: z
		.number()
		.positive('La meta debe ser mayor a cero')
		.max(10_000_000)
		.optional()
		.nullable(),
	website_url: z
		.string()
		.url('La URL del sitio web no es válida')
		.optional()
		.transform((v) => v?.trim() || null)
});

export type ProjectRegistrationInput = z.infer<typeof projectRegistrationSchema>;

// ─── Admin: Confirm Manual Payment ───────────────────────────────────────────

export const confirmPaymentSchema = z.object({
	donation_id: z.string().uuid(),
	action: z.enum(['confirm', 'reject']),
	admin_notes: z.string().max(500).optional().transform((v) => v?.trim() || null)
});

// ─── Admin: Approve/Reject Project ───────────────────────────────────────────

export const reviewProjectSchema = z.object({
	project_id: z.string().uuid(),
	action: z.enum(['approve', 'reject']),
	rejection_reason: z.string().max(500).optional().transform((v) => v?.trim() || null)
});
