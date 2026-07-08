<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { formatCurrency, formatDateTime, getDonorDisplayName, getPaymentMethodLabel } from '$lib/utils/formatters';
	import { getAreaIconName } from '$lib/utils/iconMap';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let activeModal = $state<any | null>(null);
	let adminNotes = $state('');
	let submitting = $state(false);

	const statusOptions = [
		{ value: 'pending', label: '⏳ Pendientes' },
		{ value: 'confirmed', label: '✓ Confirmadas' },
		{ value: 'failed', label: '✕ Fallidas/Rechazadas' },
		{ value: 'all', label: '🔍 Todas' }
	];

	const methodOptions = [
		{ value: '', label: 'Todos los métodos' },
		{ value: 'stripe', label: '💳 Stripe (tarjeta)' },
		{ value: 'pago_movil', label: '📱 Pago Móvil' },
		{ value: 'transferencia', label: '🏦 Transferencia' }
	];

	function statusVariant(s: string): 'success' | 'pending' | 'error' | 'muted' {
		if (s === 'confirmed') return 'success';
		if (s === 'pending') return 'pending';
		if (s === 'failed') return 'error';
		return 'muted';
	}

	function statusLabel(s: string) {
		return { confirmed: '✓ Confirmada', pending: '⏳ Pendiente', failed: '✕ Fallida', refunded: '↩ Reembolsada' }[s] ?? s;
	}

	function applyFilter(key: string, value: string) {
		const url = new URL($page.url);
		if (value) url.searchParams.set(key, value);
		else url.searchParams.delete(key);
		url.searchParams.delete('pagina');
		goto(url.toString());
	}

	function openModal(donation: any) {
		activeModal = donation;
		adminNotes = donation.admin_notes ?? '';
	}

	function closeModal() {
		activeModal = null;
		adminNotes = '';
	}

	// Show toast when action succeeds
	$effect(() => {
		if (form?.success) {
			activeModal = null;
			adminNotes = '';
		}
	});
</script>

<svelte:head>
	<title>Donaciones — Admin Brazos Abiertos</title>
</svelte:head>

<div class="admin-donations">
	<!-- Header -->
	<div class="page-header">
		<div>
			<h1 class="page-title">Donaciones</h1>
			<p class="page-subtitle">{data.count} {data.count === 1 ? 'donación' : 'donaciones'} encontradas</p>
		</div>
	</div>

	<!-- Action feedback -->
	{#if form?.success}
		<div class="feedback-banner success" role="alert">✅ {form.message}</div>
	{/if}
	{#if form?.error}
		<div class="feedback-banner error" role="alert">⚠ {form.error}</div>
	{/if}

	<!-- Filters -->
	<div class="filters-bar">
		<div class="filter-group">
			<label class="filter-label">Estado:</label>
			<div class="filter-chips">
				{#each statusOptions as opt}
					<button
						class="filter-chip"
						class:active={data.statusFilter === opt.value || (!data.statusFilter && opt.value === 'pending')}
						onclick={() => applyFilter('estado', opt.value)}
						id="filter-status-{opt.value}"
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>
		<div class="filter-group">
			<label class="filter-label" for="method-filter">Método:</label>
			<select
				id="method-filter"
				class="filter-select"
				value={data.methodFilter}
				onchange={(e) => applyFilter('metodo', (e.target as HTMLSelectElement).value)}
			>
				{#each methodOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Table -->
	{#if data.donations.length === 0}
		<div class="empty-card">
			<p class="empty-icon">🎉</p>
			<p class="empty-text">No hay donaciones con este filtro.</p>
		</div>
	{:else}
		<div class="table-card">
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th>Donante</th>
							<th>Área / Proyecto</th>
							<th>Monto</th>
							<th>Método</th>
							<th>Referencia</th>
							<th>Estado</th>
							<th>Fecha</th>
							<th>Acciones</th>
						</tr>
					</thead>
					<tbody>
						{#each data.donations as donation (donation.id)}
							<tr class:row-pending={donation.payment_status === 'pending' && donation.payment_method !== 'stripe'}>
								<td class="td-name">
									<p class="donor-name">{getDonorDisplayName(donation.is_anonymous, donation.donor_name)}</p>
									{#if donation.donor_email}
										<p class="donor-email">{donation.donor_email}</p>
									{/if}
								</td>
								<td>
									<p class="td-area"><span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;">{getAreaIconName(donation.area?.icon)}</span> {donation.area?.name}</p>
									{#if donation.project}
										<p class="td-project">{donation.project.name}</p>
									{/if}
								</td>
								<td class="td-amount">{formatCurrency(donation.amount, donation.currency)}</td>
								<td class="td-method">{getPaymentMethodLabel(donation.payment_method)}</td>
								<td class="td-ref">
									{#if donation.manual_reference}
										<code class="ref-code">{donation.manual_reference}</code>
									{:else}
										<span class="no-ref">—</span>
									{/if}
								</td>
								<td>
									<Badge variant={statusVariant(donation.payment_status)}>
										{statusLabel(donation.payment_status)}
									</Badge>
								</td>
								<td class="td-date">{formatDateTime(donation.created_at)}</td>
								<td>
									{#if donation.payment_status === 'pending' && donation.payment_method !== 'stripe'}
										<button
											class="action-btn primary"
											onclick={() => openModal(donation)}
											id="review-{donation.id}"
										>
											Revisar
										</button>
									{:else}
										<button
											class="action-btn ghost"
											onclick={() => openModal(donation)}
											id="view-{donation.id}"
										>
											Ver
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			{#if data.totalPages > 1}
				<div class="pagination">
					{#if data.page > 1}
						<a
							href="?{new URLSearchParams({ estado: data.statusFilter, metodo: data.methodFilter, pagina: String(data.page - 1) }).toString()}"
							class="page-btn"
						>
							← Anterior
						</a>
					{/if}
					<span class="page-info">Página {data.page} de {data.totalPages}</span>
					{#if data.page < data.totalPages}
						<a
							href="?{new URLSearchParams({ estado: data.statusFilter, metodo: data.methodFilter, pagina: String(data.page + 1) }).toString()}"
							class="page-btn"
						>
							Siguiente →
						</a>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Donation Review Modal -->
{#if activeModal}
	<div class="modal-backdrop" onclick={closeModal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
		<div class="modal-box" onclick={(e) => e.stopPropagation()} role="document">
			<div class="modal-header">
				<h2 id="modal-title" class="modal-title">
					{activeModal.payment_status === 'pending' && activeModal.payment_method !== 'stripe' ? '🔍 Revisar donación' : '📋 Detalle de donación'}
				</h2>
				<button class="modal-close" onclick={closeModal} aria-label="Cerrar">✕</button>
			</div>

			<div class="modal-body">
				<!-- Donation details -->
				<div class="detail-grid">
					<div class="detail-row">
						<span class="detail-label">Donante</span>
						<span class="detail-val">{getDonorDisplayName(activeModal.is_anonymous, activeModal.donor_name)}</span>
					</div>
					{#if activeModal.donor_email}
						<div class="detail-row">
							<span class="detail-label">Email</span>
							<span class="detail-val">{activeModal.donor_email}</span>
						</div>
					{/if}
					<div class="detail-row">
						<span class="detail-label">Área</span>
						<span class="detail-val"><span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;">{getAreaIconName(activeModal.area?.icon)}</span> {activeModal.area?.name}</span>
					</div>
					{#if activeModal.project}
						<div class="detail-row">
							<span class="detail-label">Proyecto</span>
							<span class="detail-val">{activeModal.project.name}</span>
						</div>
					{/if}
					<div class="detail-row">
						<span class="detail-label">Monto</span>
						<span class="detail-val amount-val">{formatCurrency(activeModal.amount, activeModal.currency)}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Método</span>
						<span class="detail-val">{getPaymentMethodLabel(activeModal.payment_method)}</span>
					</div>
					{#if activeModal.manual_reference}
						<div class="detail-row">
							<span class="detail-label">Referencia</span>
							<span class="detail-val"><code>{activeModal.manual_reference}</code></span>
						</div>
					{/if}
					{#if activeModal.manual_bank}
						<div class="detail-row">
							<span class="detail-label">Banco/Fuente</span>
							<span class="detail-val">{activeModal.manual_bank}</span>
						</div>
					{/if}
					<div class="detail-row">
						<span class="detail-label">Estado</span>
						<span class="detail-val">
							<Badge variant={statusVariant(activeModal.payment_status)}>
								{statusLabel(activeModal.payment_status)}
							</Badge>
						</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Fecha</span>
						<span class="detail-val">{formatDateTime(activeModal.created_at)}</span>
					</div>
					{#if activeModal.message}
						<div class="detail-row detail-row-full">
							<span class="detail-label">Mensaje del donante</span>
							<p class="detail-message">"{activeModal.message}"</p>
						</div>
					{/if}
					{#if activeModal.admin_notes}
						<div class="detail-row detail-row-full">
							<span class="detail-label">Notas admin previas</span>
							<p class="detail-message">{activeModal.admin_notes}</p>
						</div>
					{/if}
				</div>

				<!-- Actions (only for pending manual payments) -->
				{#if activeModal.payment_status === 'pending' && activeModal.payment_method !== 'stripe'}
					<div class="modal-actions-section">
						<label class="form-label" for="admin-notes-input">Notas (opcional):</label>
						<textarea
							id="admin-notes-input"
							class="form-textarea"
							rows="2"
							placeholder="Ej: Referencia verificada en sistema bancario…"
							bind:value={adminNotes}
						></textarea>

						<div class="modal-action-btns">
							<form
								method="POST"
								action="?/confirm"
								use:enhance={() => {
									submitting = true;
									return async ({ update }) => {
										submitting = false;
										await update();
									};
								}}
							>
								<input type="hidden" name="donation_id" value={activeModal.id} />
								<input type="hidden" name="action" value="confirm" />
								<input type="hidden" name="admin_notes" value={adminNotes} />
								<button
									type="submit"
									class="btn btn-success modal-action-btn"
									id="confirm-donation-{activeModal.id}"
									disabled={submitting}
								>
									{submitting ? 'Procesando…' : '✅ Confirmar donación'}
								</button>
							</form>

							<form
								method="POST"
								action="?/confirm"
								use:enhance={() => {
									submitting = true;
									return async ({ update }) => {
										submitting = false;
										await update();
									};
								}}
							>
								<input type="hidden" name="donation_id" value={activeModal.id} />
								<input type="hidden" name="action" value="reject" />
								<input type="hidden" name="admin_notes" value={adminNotes} />
								<button
									type="submit"
									class="btn btn-danger modal-action-btn"
									id="reject-donation-{activeModal.id}"
									disabled={submitting}
								>
									{submitting ? 'Procesando…' : '✕ Rechazar donación'}
								</button>
							</form>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.admin-donations { display: flex; flex-direction: column; gap: var(--space-5); max-width: 1400px; }

	.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); }
	.page-title { font-size: var(--text-3xl); font-weight: 900; letter-spacing: -0.03em; }
	.page-subtitle { font-size: var(--text-sm); color: var(--text-muted); margin-top: var(--space-1); }

	.feedback-banner {
		padding: var(--space-4) var(--space-5);
		border-radius: 0;
		font-size: var(--text-sm);
		font-weight: 500;
		animation: slide-up 0.3s var(--ease-out);
	}
	.feedback-banner.success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); color: #4ade80; }
	.feedback-banner.error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #f87171; }

	/* Filters */
	.filters-bar { display: flex; gap: var(--space-6); align-items: center; flex-wrap: wrap; }
	.filter-group { display: flex; align-items: center; gap: var(--space-3); }
	.filter-label { font-size: var(--text-sm); color: var(--text-muted); font-weight: 600; white-space: nowrap; }
	.filter-chips { display: flex; gap: var(--space-2); flex-wrap: wrap; }
	.filter-chip {
		padding: var(--space-1-5) var(--space-3);
		border-radius: var(--radius-full);
		font-size: var(--text-xs);
		font-weight: 600;
		font-family: var(--font-body);
		background: var(--bg-elevated);
		border: 1px solid var(--border-subtle);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--duration-fast);
		white-space: nowrap;
	}
	.filter-chip:hover { border-color: var(--color-accent); color: var(--text-primary); }
	.filter-chip.active { background: rgba(20,96,154,0.12); border-color: var(--blue-500); color: var(--blue-400); }
	.filter-select { font-size: var(--text-sm); padding: var(--space-2) var(--space-3); }

	/* Table */
	.table-card {
		background: var(--bg-elevated);
		border: 1px solid var(--border-subtle);
		border-radius: 0;
		overflow: hidden;
	}

	.row-pending { background: rgba(20, 96, 154, 0.03); }
	.td-name .donor-name { font-weight: 600; color: var(--text-primary); font-size: var(--text-sm); }
	.td-name .donor-email { font-size: var(--text-xs); color: var(--text-muted); margin-top: 2px; }
	.td-area { font-size: var(--text-sm); }
	.td-project { font-size: var(--text-xs); color: var(--text-muted); }
	.td-amount { font-family: var(--font-display); font-weight: 700; color: var(--blue-400); white-space: nowrap; }
	.td-method { font-size: var(--text-xs); color: var(--text-secondary); }
	.td-ref { font-size: var(--text-xs); }
	.ref-code { font-family: monospace; background: var(--bg-base); padding: 2px 6px; border-radius: 0; font-size: 0.7rem; }
	.no-ref { color: var(--text-muted); }
	.td-date { font-size: var(--text-xs); color: var(--text-muted); white-space: nowrap; }

	.action-btn {
		padding: var(--space-1-5) var(--space-3);
		border-radius: var(--radius-md);
		font-size: var(--text-xs);
		font-weight: 700;
		font-family: var(--font-body);
		cursor: pointer;
		border: 1px solid;
		transition: all var(--duration-fast);
	}
	.action-btn.primary { background: rgba(20,96,154,0.15); border-color: var(--blue-500); color: var(--blue-400); }
	.action-btn.primary:hover { background: rgba(20,96,154,0.25); }
	.action-btn.ghost { background: transparent; border-color: var(--border-subtle); color: var(--text-muted); }
	.action-btn.ghost:hover { border-color: var(--text-muted); color: var(--text-primary); }

	/* Pagination */
	.pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-4); padding: var(--space-5); border-top: 1px solid var(--border-subtle); }
	.page-btn { font-size: var(--text-sm); color: var(--color-accent); text-decoration: none; font-weight: 600; }
	.page-btn:hover { color: var(--text-primary); }
	.page-info { font-size: var(--text-sm); color: var(--text-muted); }

	/* Empty */
	.empty-card { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-16); background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 0; }
	.empty-icon { font-size: 3rem; }
	.empty-text { font-size: var(--text-base); color: var(--text-muted); }

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		backdrop-filter: blur(4px);
		animation: fade-in 0.2s var(--ease-out);
	}
	.modal-box {
		background: var(--bg-surface);
		border: 1px solid var(--border-default);
		border-radius: 0;
		width: 100%;
		max-width: 560px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: var(--shadow-xl);
		animation: scale-in 0.25s var(--ease-out);
	}
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-6);
		border-bottom: 1px solid var(--border-subtle);
	}
	.modal-title { font-size: var(--text-xl); font-weight: 700; }
	.modal-close { background: none; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; padding: var(--space-1); border-radius: var(--radius-md); transition: all var(--duration-fast); }
	.modal-close:hover { background: var(--bg-elevated); color: var(--text-primary); }
	.modal-body { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-6); }

	.detail-grid { display: flex; flex-direction: column; gap: var(--space-3); }
	.detail-row { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--border-subtle); }
	.detail-row:last-child { border-bottom: none; padding-bottom: 0; }
	.detail-row-full { flex-direction: column; gap: var(--space-2); }
	.detail-label { font-size: var(--text-sm); color: var(--text-muted); flex-shrink: 0; }
	.detail-val { font-size: var(--text-sm); font-weight: 500; color: var(--text-primary); text-align: right; }
	.detail-val.amount-val { font-family: var(--font-display); font-size: var(--text-lg); font-weight: 700; color: var(--blue-400); }
	.detail-message { font-size: var(--text-sm); color: var(--text-secondary); font-style: italic; line-height: 1.6; padding: var(--space-3); background: var(--bg-base); border-radius: 0; }

	.modal-actions-section { display: flex; flex-direction: column; gap: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border-subtle); }
	.modal-action-btns { display: flex; gap: var(--space-3); }
	.modal-action-btns form { flex: 1; }
	.modal-action-btn { width: 100%; justify-content: center; }
	.btn-success { background: rgba(34,197,94,0.15) !important; border: 1px solid rgba(34,197,94,0.4) !important; color: #4ade80 !important; font-family: var(--font-body); cursor: pointer; padding: var(--space-3) var(--space-5); border-radius: var(--radius-md); font-weight: 700; font-size: var(--text-sm); transition: all var(--duration-fast); }
	.btn-success:hover { background: rgba(34,197,94,0.25) !important; }
	.btn-danger { background: rgba(239,68,68,0.12) !important; border: 1px solid rgba(239,68,68,0.3) !important; color: #f87171 !important; font-family: var(--font-body); cursor: pointer; padding: var(--space-3) var(--space-5); border-radius: var(--radius-md); font-weight: 700; font-size: var(--text-sm); transition: all var(--duration-fast); }
	.btn-danger:hover { background: rgba(239,68,68,0.25) !important; }
	.btn-success:disabled, .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
