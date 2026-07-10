<script lang="ts">
	import { enhance } from '$app/forms';
	import { createSupabaseClient } from '$lib/supabase';
	import { toast } from '$lib/stores/toast';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { formatCurrency, formatDateTime } from '$lib/utils/formatters';
	import { getAreaIconName } from '$lib/utils/iconMap';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Supabase Client for storage upload
	const supabase = createSupabaseClient();

	// Modals State
	let showCreateModal = $state(false);
	let activeDetailsModal = $state<any | null>(null);
	let submitting = $state(false);

	// Form State
	let concept = $state('');
	let description = $state('');
	let amount = $state('');
	let currency = $state('USD');
	let areaId = $state('');
	let expenseDate = $state(new Date().toISOString().split('T')[0]);
	let vendor = $state('');
	let notes = $state('');

	// Upload State
	let uploadedUrls = $state<string[]>([]);
	let uploadProgress = $state<Record<string, number>>({});
	let isUploading = $state(false);
	let uploadError = $state<string | null>(null);

	// Derived statistics
	const totalUSD = $derived(
		data.expenses
			.filter((e) => e.currency === 'USD')
			.reduce((acc, curr) => acc + Number(curr.amount), 0)
	);

	const totalVES = $derived(
		data.expenses
			.filter((e) => e.currency === 'VES')
			.reduce((acc, curr) => acc + Number(curr.amount), 0)
	);

	function openCreateModal() {
		concept = '';
		description = '';
		amount = '';
		currency = 'USD';
		areaId = data.areas[0]?.id || '';
		expenseDate = new Date().toISOString().split('T')[0];
		vendor = '';
		notes = '';
		uploadedUrls = [];
		uploadProgress = {};
		uploadError = null;
		showCreateModal = true;
	}

	function closeCreateModal() {
		showCreateModal = false;
	}

	function openDetails(expense: any) {
		activeDetailsModal = expense;
	}

	function closeDetails() {
		activeDetailsModal = null;
	}

	async function handleFilesUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		isUploading = true;
		uploadError = null;
		const filesToUpload = Array.from(input.files);

		for (const file of filesToUpload) {
			// Basic client-side validation
			if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
				toast.error('Archivo no admitido', `${file.name} no es una imagen o PDF.`);
				continue;
			}
			if (file.size > 10 * 1024 * 1024) {
				toast.error('Archivo muy grande', `${file.name} supera el límite de 10MB.`);
				continue;
			}

			const fileId = crypto.randomUUID();
			const fileExt = file.name.split('.').pop();
			const filePath = `${fileId}.${fileExt}`;
			
			uploadProgress[file.name] = 10; // Start progress indicator

			try {
				const { error } = await supabase.storage
					.from('receipts')
					.upload(filePath, file, {
						cacheControl: '3600',
						upsert: false
					});

				if (error) throw error;

				const { data: { publicUrl } } = supabase.storage
					.from('receipts')
					.getPublicUrl(filePath);

				uploadedUrls = [...uploadedUrls, publicUrl];
				uploadProgress[file.name] = 100;
			} catch (e: any) {
				console.error('Error uploading file:', e);
				uploadError = `Error al subir ${file.name}.`;
				toast.error('Error de carga', `No se pudo subir ${file.name}`);
			}
		}

		isUploading = false;
	}

	function removeUploadedImage(url: string) {
		uploadedUrls = uploadedUrls.filter((u) => u !== url);
	}
</script>

<svelte:head>
	<title>Egresos — Admin Brazos Abiertos</title>
</svelte:head>

<div class="admin-expenses">
	<!-- Header -->
	<div class="page-header">
		<div>
			<h1 class="page-title">Egresos / Salidas</h1>
			<p class="page-subtitle">Registra y administra los pagos y salidas de fondos.</p>
		</div>
		<button class="btn btn-primary btn-sm" onclick={openCreateModal}>
			<span>➕</span> Registrar Egreso
		</button>
	</div>

	<!-- Action feedback -->
	{#if form?.success}
		<div class="feedback-banner success" role="alert">✅ {form.message}</div>
	{/if}
	{#if form?.error}
		<div class="feedback-banner error" role="alert">⚠ {form.error}</div>
	{/if}

	<!-- Stats Summary Bar -->
	<div class="stats-bar">
		<div class="stat-card">
			<span class="stat-label">Total Egresos (USD)</span>
			<span class="stat-value text-red">{formatCurrency(totalUSD, 'USD')}</span>
		</div>
		<div class="stat-card">
			<span class="stat-label">Total Egresos (VES)</span>
			<span class="stat-value text-orange">{formatCurrency(totalVES, 'VES')}</span>
		</div>
		<div class="stat-card">
			<span class="stat-label">Transacciones de Egreso</span>
			<span class="stat-value">{data.expenses.length}</span>
		</div>
	</div>

	<!-- Table / List -->
	{#if data.expenses.length === 0}
		<div class="empty-card">
			<p class="empty-icon">💸</p>
			<p class="empty-text">No se han registrado egresos aún.</p>
			<button class="btn btn-outline btn-sm" onclick={openCreateModal}>Registrar el primero</button>
		</div>
	{:else}
		<div class="table-card">
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th>Fecha</th>
							<th>Concepto / Título</th>
							<th>Área</th>
							<th>Proveedor</th>
							<th>Monto</th>
							<th>Comprobantes</th>
							<th>Acciones</th>
						</tr>
					</thead>
					<tbody>
						{#each data.expenses as expense (expense.id)}
							<tr>
								<td class="td-date">{expense.expense_date}</td>
								<td class="td-concept">
									<p class="concept-title">{expense.concept}</p>
									{#if expense.description}
										<p class="concept-desc">{expense.description}</p>
									{/if}
								</td>
								<td>
									<span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;color:var(--text-muted);">
										{getAreaIconName(expense.area?.icon)}
									</span>
									<span class="area-name">{expense.area?.name || 'General'}</span>
								</td>
								<td class="td-vendor">
									{#if expense.vendor}
										<span>{expense.vendor}</span>
									{:else}
										<span class="no-ref">—</span>
									{/if}
								</td>
								<td class="td-amount amount-expense">
									-{formatCurrency(expense.amount, expense.currency)}
								</td>
								<td>
									{#if expense.receipt_image_urls && expense.receipt_image_urls.length > 0}
										<button class="receipt-badge-btn" onclick={() => openDetails(expense)}>
											<span class="receipt-badge">📂 {expense.receipt_image_urls.length} img</span>
										</button>
									{:else if expense.receipt_image_url}
										<button class="receipt-badge-btn" onclick={() => openDetails(expense)}>
											<span class="receipt-badge">📂 1 img</span>
										</button>
									{:else}
										<span class="no-receipt">Sin comprobante</span>
									{/if}
								</td>
								<td>
									<button class="action-btn ghost" onclick={() => openDetails(expense)}>
										Detalles
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<!-- CREATE EXPENSE MODAL -->
{#if showCreateModal}
	<div class="modal-backdrop" onclick={closeCreateModal} role="presentation">
		<div class="modal-box" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
			<div class="modal-header">
				<h2 class="modal-title" id="modal-title">Registrar Egreso</h2>
				<button class="modal-close" onclick={closeCreateModal} aria-label="Cerrar">×</button>
			</div>

			<form
				method="POST"
				action="?/addExpense"
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						submitting = false;
						if (result.type === 'success') {
							showCreateModal = false;
							toast.success('Egreso registrado', 'El egreso ha sido registrado exitosamente.');
							await update();
						} else if (result.type === 'failure') {
							const errMessage = (result.data as any)?.error || 'Error desconocido';
							toast.error('Error al registrar', errMessage);
						}
					};
				}}
				class="modal-body"
			>
				<!-- Hidden field for receipt image urls -->
				<input type="hidden" name="receipt_image_urls" value={JSON.stringify(uploadedUrls)} />

				<div class="form-group">
					<label class="form-label" for="exp-concept">Concepto / Título <span class="required">*</span></label>
					<input
						type="text"
						id="exp-concept"
						name="concept"
						class="form-input"
						placeholder="Ej: Retiro para pago de infraestructura"
						bind:value={concept}
						required
					/>
				</div>

				<div class="form-row-2">
					<div class="form-group">
						<label class="form-label" for="exp-amount">Monto <span class="required">*</span></label>
						<input
							type="number"
							id="exp-amount"
							name="amount"
							class="form-input"
							step="0.01"
							min="0.01"
							placeholder="5000"
							bind:value={amount}
							required
						/>
					</div>

					<div class="form-group">
						<label class="form-label" for="exp-currency">Moneda <span class="required">*</span></label>
						<select id="exp-currency" name="currency" class="form-select" bind:value={currency}>
							<option value="USD">USD ($)</option>
							<option value="VES">VES (Bs.)</option>
						</select>
					</div>
				</div>

				<div class="form-row-2">
					<div class="form-group">
						<label class="form-label" for="exp-area">Área / Categoría <span class="required">*</span></label>
						<select id="exp-area" name="area_id" class="form-select" bind:value={areaId} required>
							<option value="" disabled>Selecciona un área</option>
							{#each data.areas as area}
								<option value={area.id}>{area.icon} {area.name}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label class="form-label" for="exp-date">Fecha del Egreso <span class="required">*</span></label>
						<input
							type="date"
							id="exp-date"
							name="expense_date"
							class="form-input"
							bind:value={expenseDate}
							required
						/>
					</div>
				</div>

				<div class="form-group">
					<label class="form-label" for="exp-vendor">Proveedor / Destinatario (Opcional)</label>
					<input
						type="text"
						id="exp-vendor"
						name="vendor"
						class="form-input"
						placeholder="Ej: Ferretería El Tornillo C.A."
						bind:value={vendor}
					/>
				</div>

				<div class="form-group">
					<label class="form-label" for="exp-desc">Descripción (Opcional)</label>
					<textarea
						id="exp-desc"
						name="description"
						class="form-textarea"
						rows="2"
						placeholder="Describe en qué se usó el dinero..."
						bind:value={description}
					></textarea>
				</div>

				<div class="form-group">
					<label class="form-label" for="exp-notes">Notas Internas (Opcional)</label>
					<textarea
						id="exp-notes"
						name="notes"
						class="form-textarea"
						rows="2"
						placeholder="Notas privadas para la administración..."
						bind:value={notes}
					></textarea>
				</div>

				<!-- Upload Section -->
				<div class="form-group upload-section">
					<span class="form-label">Adjuntar Imágenes / Comprobantes</span>
					<div class="upload-dropzone">
						<input
							type="file"
							id="receipt-files"
							multiple
							accept="image/*,application/pdf"
							class="hidden-file-input"
							onclick={(e) => {
								// Prevent submission triggering
							}}
							onchange={handleFilesUpload}
						/>
						<label for="receipt-files" class="upload-zone-label">
							<span class="upload-icon">📷</span>
							<span class="upload-text-main">Haga clic aquí para subir imágenes</span>
							<span class="upload-text-sub">Admite JPG, PNG, WEBP, PDF de hasta 10MB</span>
						</label>
					</div>

					{#if isUploading}
						<div class="upload-status text-blue">Subiendo archivos...</div>
					{/if}

					{#if uploadError}
						<div class="upload-status text-red">{uploadError}</div>
					{/if}

					<!-- Preview of uploaded files -->
					{#if uploadedUrls.length > 0}
						<div class="uploaded-previews">
							{#each uploadedUrls as url}
								<div class="preview-card">
									{#if url.toLowerCase().endsWith('.pdf')}
										<div class="pdf-preview-icon">📄 PDF</div>
									{:else}
										<img src={url} alt="Comprobante" class="preview-img" />
									{/if}
									<button
										type="button"
										class="remove-preview-btn"
										onclick={() => removeUploadedImage(url)}
										title="Remover"
									>
										×
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<div class="modal-actions">
					<button type="button" class="btn btn-outline" onclick={closeCreateModal}>Cancelar</button>
					<button
						type="submit"
						class="btn btn-primary"
						disabled={submitting || isUploading}
					>
						{#if submitting}
							Registrando...
						{:else}
							Guardar Egreso
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- DETAILS MODAL -->
{#if activeDetailsModal}
	{@const exp = activeDetailsModal}
	{@const imagesList = exp.receipt_image_urls || (exp.receipt_image_url ? [exp.receipt_image_url] : [])}
	<div class="modal-backdrop" onclick={closeDetails} role="presentation">
		<div class="modal-box details-box" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="detail-title">
			<div class="modal-header">
				<h2 class="modal-title" id="detail-title">Detalles del Egreso</h2>
				<button class="modal-close" onclick={closeDetails} aria-label="Cerrar">×</button>
			</div>

			<div class="modal-body">
				<div class="detail-grid">
					<div class="detail-row">
						<span class="detail-label">Concepto</span>
						<span class="detail-val font-bold">{exp.concept}</span>
					</div>

					<div class="detail-row">
						<span class="detail-label">Monto</span>
						<span class="detail-val amount-val text-red font-bold">
							-{formatCurrency(exp.amount, exp.currency)}
						</span>
					</div>

					<div class="detail-row">
						<span class="detail-label">Área / Categoría</span>
						<span class="detail-val">
							<span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;color:var(--text-muted);">
								{getAreaIconName(exp.area?.icon)}
							</span>
							{exp.area?.name || 'General'}
						</span>
					</div>

					<div class="detail-row">
						<span class="detail-label">Fecha</span>
						<span class="detail-val">{exp.expense_date}</span>
					</div>

					<div class="detail-row">
						<span class="detail-label">Proveedor / Destinatario</span>
						<span class="detail-val">{exp.vendor || 'No especificado'}</span>
					</div>

					{#if exp.description}
						<div class="detail-row detail-row-full">
							<span class="detail-label">Descripción</span>
							<p class="detail-message">{exp.description}</p>
						</div>
					{/if}

					{#if exp.notes}
						<div class="detail-row detail-row-full">
							<span class="detail-label">Notas Internas (Admin)</span>
							<p class="detail-message notes-message">{exp.notes}</p>
						</div>
					{/if}

					<!-- Receipts Gallery -->
					<div class="detail-row detail-row-full">
						<span class="detail-label">Comprobantes Adjuntos</span>
						{#if imagesList.length > 0}
							<div class="receipts-gallery">
								{#each imagesList as url}
									<a href={url} target="_blank" rel="noopener noreferrer" class="gallery-item">
										{#if url.toLowerCase().endsWith('.pdf')}
											<div class="pdf-gallery-box">📄 Ver PDF</div>
										{:else}
											<img src={url} alt="Comprobante Egreso" class="gallery-img" />
										{/if}
									</a>
								{/each}
							</div>
						{:else}
							<p class="empty-gallery">No se adjuntaron comprobantes.</p>
						{/if}
					</div>
				</div>

				<div class="modal-actions-section" style="padding-top: 1rem; border-top: 1px solid var(--border-subtle)">
					<button type="button" class="btn btn-outline modal-action-btn" onclick={closeDetails}>
						Cerrar detalles
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.admin-expenses {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 1200px;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.page-title {
		font-size: var(--text-3xl);
		font-weight: 900;
		letter-spacing: -0.03em;
	}

	.page-subtitle {
		font-size: var(--text-sm);
		color: var(--text-muted);
		margin-top: var(--space-1);
	}

	/* Feedback banner */
	.feedback-banner {
		padding: var(--space-3) var(--space-4);
		border-radius: 8px;
		font-size: var(--text-sm);
		font-weight: 500;
	}
	.feedback-banner.success {
		background: rgba(34,197,94,0.1);
		color: #16a34a;
		border: 1px solid rgba(34,197,94,0.2);
	}
	.feedback-banner.error {
		background: rgba(239,68,68,0.1);
		color: #dc2626;
		border: 1px solid rgba(239,68,68,0.2);
	}

	/* Stats Bar */
	.stats-bar {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-4);
	}
	.stat-card {
		background: #ffffff;
		border: 1px solid var(--border-subtle);
		border-radius: 12px;
		padding: var(--space-5);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		box-shadow: var(--shadow-sm);
	}
	.stat-label {
		font-size: var(--text-xs);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}
	.stat-value {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: 800;
		color: var(--text-primary);
	}
	.text-red { color: #dc2626; }
	.text-orange { color: #f97316; }

	/* Empty State */
	.empty-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-16) var(--space-6);
		background: #ffffff;
		border: 1px solid var(--border-subtle);
		border-radius: 12px;
		text-align: center;
	}
	.empty-icon { font-size: 3rem; margin: 0; }
	.empty-text { font-size: var(--text-base); color: var(--text-muted); margin: 0; }

	/* Table Card */
	.table-card {
		background: #ffffff;
		border: 1px solid var(--border-subtle);
		border-radius: 12px;
		box-shadow: var(--shadow-sm);
		overflow: hidden;
	}
	.admin-table-wrap {
		width: 100%;
		overflow-x: auto;
	}
	.admin-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}
	.admin-table th {
		background: var(--bg-secondary);
		padding: var(--space-4) var(--space-5);
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid var(--border-subtle);
	}
	.admin-table td {
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--border-subtle);
		vertical-align: middle;
		font-size: var(--text-sm);
		color: var(--text-primary);
	}
	.admin-table tr:last-child td {
		border-bottom: none;
	}
	.td-date {
		font-family: var(--font-display);
		font-weight: 500;
		color: var(--text-secondary);
		white-space: nowrap;
	}
	.td-concept {
		max-width: 320px;
	}
	.concept-title {
		font-weight: 600;
		color: var(--text-primary);
	}
	.concept-desc {
		font-size: var(--text-xs);
		color: var(--text-muted);
		margin-top: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.area-name {
		font-weight: 500;
		margin-left: var(--space-1);
	}
	.td-vendor {
		color: var(--text-secondary);
	}
	.td-amount.amount-expense {
		font-family: var(--font-display);
		font-weight: 700;
		color: #dc2626;
		white-space: nowrap;
	}
	.no-ref { color: var(--text-muted); font-style: italic; }

	.receipt-badge-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		outline: none;
	}
	.receipt-badge {
		font-size: var(--text-xs);
		font-weight: 600;
		background: var(--blue-50);
		color: var(--blue-600);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-md);
		border: 1px solid rgba(20, 96, 154, 0.15);
		transition: all var(--duration-fast);
	}
	.receipt-badge:hover {
		background: var(--blue-100);
	}
	.no-receipt {
		font-size: var(--text-xs);
		color: var(--text-muted);
		background: var(--bg-secondary);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-md);
		border: 1px solid transparent;
	}

	.action-btn {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 600;
		padding: var(--space-1-5) var(--space-3);
		border-radius: var(--radius-md);
		border: 1px solid transparent;
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	.action-btn.ghost {
		background: transparent;
		border-color: var(--border-subtle);
		color: var(--text-muted);
	}
	.action-btn.ghost:hover {
		border-color: var(--text-muted);
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	/* Modal styling */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(8px);
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
	}
	.modal-box {
		background: #ffffff;
		border: 1px solid var(--border-subtle);
		border-radius: 16px;
		width: 100%;
		max-width: 580px;
		max-height: 92vh;
		overflow-y: auto;
		box-shadow: var(--shadow-xl);
		display: flex;
		flex-direction: column;
	}
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid var(--border-subtle);
	}
	.modal-title { font-size: var(--text-lg); font-weight: 700; }
	.modal-close { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; line-height: 1; }
	.modal-close:hover { color: var(--text-primary); }

	.modal-body {
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.form-row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	/* Upload styles */
	.upload-section {
		background: var(--bg-secondary);
		padding: var(--space-4);
		border-radius: 8px;
		border: 1px dashed var(--border-default);
	}
	.upload-dropzone {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: var(--space-5);
		border: 2px dashed var(--border-default);
		border-radius: 6px;
		background: #ffffff;
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	.upload-dropzone:hover {
		border-color: var(--blue-400);
		background: var(--blue-50)/10;
	}
	.hidden-file-input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}
	.upload-zone-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		text-align: center;
		cursor: pointer;
	}
	.upload-icon { font-size: 1.5rem; }
	.upload-text-main { font-size: var(--text-sm); font-weight: 600; color: var(--blue-600); }
	.upload-text-sub { font-size: var(--text-xs); color: var(--text-muted); }

	.upload-status {
		font-size: var(--text-xs);
		font-weight: 500;
		margin-top: var(--space-1);
	}
	.text-blue { color: var(--blue-600); }

	.uploaded-previews {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin-top: var(--space-3);
	}
	.preview-card {
		position: relative;
		width: 72px;
		height: 72px;
		border: 1px solid var(--border-subtle);
		border-radius: 6px;
		overflow: hidden;
		background: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.preview-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.pdf-preview-icon {
		font-size: 10px;
		font-weight: bold;
		color: #dc2626;
		text-align: center;
	}
	.remove-preview-btn {
		position: absolute;
		top: 2px;
		right: 2px;
		width: 16px;
		height: 16px;
		background: rgba(0, 0, 0, 0.6);
		color: #ffffff;
		border: none;
		border-radius: 50%;
		font-size: 11px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}
	.remove-preview-btn:hover {
		background: rgba(220, 38, 38, 0.9);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		margin-top: var(--space-3);
		padding-top: var(--space-4);
		border-top: 1px solid var(--border-subtle);
	}

	/* Details Modal customizations */
	.details-box {
		max-width: 520px;
	}
	.detail-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-4);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
	}
	.detail-row-full {
		flex-direction: column;
		gap: var(--space-2);
		align-items: stretch;
	}
	.detail-label {
		font-size: var(--text-sm);
		color: var(--text-muted);
		flex-shrink: 0;
	}
	.detail-val {
		font-size: var(--text-sm);
		color: var(--text-primary);
		text-align: right;
	}
	.detail-val.amount-val {
		font-family: var(--font-display);
		font-size: var(--text-base);
	}
	.detail-message {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		line-height: 1.6;
		padding: var(--space-3);
		background: var(--bg-secondary);
		border-radius: 8px;
		margin: 0;
	}
	.notes-message {
		background: rgba(249, 115, 22, 0.05);
		border: 1px solid rgba(249, 115, 22, 0.1);
		color: #c2410c;
	}
	.font-bold { font-weight: 700; }

	.receipts-gallery {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-2);
		margin-top: var(--space-1);
	}
	.gallery-item {
		border: 1px solid var(--border-subtle);
		border-radius: 6px;
		overflow: hidden;
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-secondary);
		transition: all var(--duration-fast);
	}
	.gallery-item:hover {
		transform: scale(1.03);
		border-color: var(--blue-400);
	}
	.gallery-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.pdf-gallery-box {
		font-size: 11px;
		font-weight: 600;
		color: #dc2626;
		text-align: center;
	}
	.empty-gallery {
		font-size: var(--text-sm);
		color: var(--text-muted);
		font-style: italic;
		margin: 0;
	}

	@media (max-width: 768px) {
		.stats-bar {
			grid-template-columns: 1fr;
			gap: var(--space-3);
		}
		.form-row-2 {
			grid-template-columns: 1fr;
			gap: var(--space-4);
		}
		.receipts-gallery {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
