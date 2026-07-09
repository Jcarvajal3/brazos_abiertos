// ─── Enums & Constants ───────────────────────────────────────────────────────

export type PaymentMethod = 'stripe' | 'pago_movil' | 'transferencia' | 'zelle' | 'bizum' | 'crypto';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';
export type ProjectStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'donor' | 'ong' | 'admin';
export type DonationCurrency = 'USD' | 'VES' | 'EUR' | 'USDT';

// Donor-facing currency selection (the currency the donor chose in the form)
export type DonorCurrency = 'USD' | 'VES' | 'EUR' | 'USDT';

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface Profile {
	id: string;
	full_name: string | null;
	email: string | null;
	phone: string | null;
	role: UserRole;
	created_at: string;
}

export interface Area {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	icon: string;
	color: string;
	sort_order: number;
	active: boolean;
	created_at: string;
}

export interface Project {
	id: string;
	ong_profile_id: string | null;
	area_id: string;
	name: string;
	description: string;
	ong_name: string;
	ong_contact_email: string;
	ong_phone: string | null;
	ong_document: string | null;
	status: ProjectStatus;
	goal_amount: number | null;
	current_amount: number;
	cover_image_url: string | null;
	website_url: string | null;
	rejection_reason: string | null;
	approved_at: string | null;
	created_at: string;
	updated_at: string;
	// Relations
	area?: Area;
}

export interface Donation {
	id: string;
	donor_profile_id: string | null;
	area_id: string;
	project_id: string | null;
	donor_name: string | null;
	donor_email: string | null;
	amount: number;
	currency: DonationCurrency;
	donor_currency: DonorCurrency | null; // Original currency chosen by donor
	country: string | null;               // Donor's country name
	payment_method: PaymentMethod;
	payment_status: PaymentStatus;
	stripe_payment_intent_id: string | null;
	manual_reference: string | null;
	manual_bank: string | null;
	admin_notes: string | null;
	is_anonymous: boolean;
	message: string | null;
	confirmed_at: string | null;
	created_at: string;
	// Relations
	area?: Area;
	project?: Project | null;
}

export interface DonationStats {
	total_raised_usd: number;
	total_raised_ves: number;
	total_raised_eur: number;
	total_raised_usdt: number;
	total_donors: number;
	total_donations: number;
	last_updated: string;
}

export interface Expense {
	id: string;
	area_id: string;
	project_id: string | null;
	concept: string;
	description: string | null;
	amount: number;
	currency: DonationCurrency;
	expense_date: string;
	receipt_image_url: string | null;
	receipt_image_urls: string[] | null;
	vendor: string | null;
	created_by: string | null;
	notes: string | null;
	created_at: string;
	updated_at: string;
	// Relations
	area?: Area;
	project?: Project | null;
}

export interface ExpenseStats {
	total_expenses_usd: number;
	total_expenses_ves: number;
	total_expense_records: number;
	last_updated: string;
}

// ─── Form / UI Types ──────────────────────────────────────────────────────────

export interface DonationFormData {
	area_id: string;
	project_id?: string | null;
	donor_name?: string;
	donor_email?: string;
	amount: number;
	currency: DonationCurrency;
	payment_method: PaymentMethod;
	is_anonymous: boolean;
	message?: string;
	// For manual payments
	manual_reference?: string;
	manual_bank?: string;
}

export interface ProjectRegistrationFormData {
	area_id: string;
	name: string;
	description: string;
	ong_name: string;
	ong_contact_email: string;
	ong_phone?: string;
	ong_document?: string;
	goal_amount?: number;
	website_url?: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
	success: true;
	data: T;
}

export interface ApiError {
	success: false;
	error: string;
	code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Supabase Database Types ──────────────────────────────────────────────────

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: Profile;
				Insert: Omit<Profile, 'created_at'>;
				Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
			};
			areas: {
				Row: Area;
				Insert: Omit<Area, 'id' | 'created_at'>;
				Update: Partial<Omit<Area, 'id' | 'created_at'>>;
			};
			projects: {
				Row: Project;
				Insert: Omit<Project, 'id' | 'current_amount' | 'created_at' | 'updated_at' | 'area'>;
				Update: Partial<Omit<Project, 'id' | 'created_at' | 'area'>>;
			};
			donations: {
				Row: Donation;
				Insert: Omit<
					Donation,
					'id' | 'created_at' | 'confirmed_at' | 'area' | 'project' | 'admin_notes'
				>;
				Update: Partial<
					Omit<Donation, 'id' | 'created_at' | 'area' | 'project'>
				>;
			};
			expenses: {
				Row: Expense;
				Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'area' | 'project'>;
				Update: Partial<Omit<Expense, 'id' | 'created_at' | 'area' | 'project'>>;
			};
		};
		Views: {
			donation_stats: {
				Row: DonationStats;
			};
			expense_stats: {
				Row: ExpenseStats;
			};
		};
	};
}
