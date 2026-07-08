<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Badge from '$lib/components/ui/Badge.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import { formatCurrency, formatDateTime } from '$lib/utils/formatters';
	import { getAreaIconName } from '$lib/utils/iconMap';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let activeModal = $state<any | null>(null);
	let rejectionReason = $state('');
	let submitting = $state(false);

	const statusOptions = [
		{ value: 'pending',  label: '⏳ Pendientes' },
		{ value: 'approved', label: '✅ Aprobados' },
		{ value: 'rejected', label: '✕ Rechazados' },
		{ value: 'all',      label: '🔍 Todos' }
	];

	function statusVariant(s: string): 'success' | 'pending' | 'error' | 'muted' {
		if (s === 'approved') return 'success';
		if (s === 'pending') return 'pending';
		if (s === 'rejected') return 'error';
		return 'muted';
	}

	function statusLabel(s: string) {
		return { approved: '✅ Aprobado', pending: '⏳ Pendiente', rejected: '✕ Rechazado' }[s] ?? s;
	}

	function applyFilter(key: string, value: string) {
		const url = new URL($page.url);
		if (value) url.searchParams.set(key, value);
		else url.searchParams.delete(key);
		url.searchParams.delete('pagina');
		goto(url.toString());
	}

	function openModal(project: any) {
		activeModal = project;
		rejectionReason = project.rejection_reason ?? '';
	}

	function closeModal() {
		activeModal = null;
		rejectionReason = '';
	}

	$effect(() => {
		if (form?.success) {
			activeModal = null;
			rejectionReason = '';
		}
	});
</script>

<svelte:head>
	<title>Proyectos — Admin Brazos Abiertos</title>
</svelte:head>

<div class="admin-projects">
	<div class="page-header">
		<div>
			<h1 class="page-title">Proyectos</h1>
			<p class="page-subtitle">{data.count} {data.count === 1 ? 'proyecto' : 'proyectos'} encontrados</p>
		</div>
	</div>

	<!-- Action feedback -->
	{#if form?.success}
		<div class="feedback-banner success" role="alert">✅ {form.message}</div>
	{/if}
	{#if form?.error}
		<div class="feedback-banner error" role="alert">⚠ {form.error}</div>
	{/if}

	<!-- Status Filters -->
	<div class="filters-bar">
		{#each statusOptions as opt}
			<button
				class="filter-chip"
				class:active={data.statusFilter === opt.value}
				onclick={() => applyFilter('estado', opt.value)}
				id="filter-{opt.value}"
			>
				{opt.label}
			</button>
		{/each}
	</div>

	<!-- Projects Grid -->
	{#if data.projects.length === 0}
		<div class="empty-card">
			<p class="empty-icon">🎉</p>
			<p class="empty-text">No hay proyectos con este estado.</p>
		</div>
	{:else}
		<div class="projects-grid">
			{#each data.projects as project (project.id)}
				<div class="project-card" style="--area-color: {project.area?.color ?? '#14609A'}">
					<!-- Card header -->
					<div class="project-card-header">
						<div class="project-area-badge">
							<span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;">{getAreaIconName(project.area?.icon)}</span>
							<span>{project.area?.name}</span>
						</div>
						<Badge variant={statusVariant(project.status)}>
							{statusLabel(project.status)}
						</Badge>
					</div>

					<!-- Main info -->
					<div class="project-card-body">
						<h2 class="project-name">{project.name}</h2>
						<p class="project-ong">
							🏛 {project.ong_name}
							{#if project.ong_document}
								<span class="ong-rif">· {project.ong_document}</span>
							{/if}
						</p>
						<p class="project-desc">{project.description.slice(0, 200)}{project.description.length > 200 ? '…' : ''}</p>

						<!-- Contact -->
						<div class="project-contact">
							<a href="mailto:{project.ong_contact_email}" class="contact-link">
								📧 {project.ong_contact_email}
							</a>
							{#if project.ong_phone}
								<span class="contact-link">📞 {project.ong_phone}</span>
							{/if}
							{#if project.website_url}
								<a href={project.website_url} target="_blank" rel="noopener noreferrer" class="contact-link">
									🌐 Sitio web ↗
								</a>
							{/if}
						</div>

						<!-- Goal -->
						{#if project.goal_amount}
							{@const pct = Math.min(100, (project.current_amount / project.goal_amount) * 100)}
							<div class="project-progress">
								<ProgressBar percent={pct} showPercent={true} height={4} />
								<p class="project-amounts">
									{formatCurrency(project.current_amount, 'USD')} / {formatCurrency(project.goal_amount, 'USD')}
								</p>
							</div>
						{/if}

						{#if project.rejection_reason}
							<div class="rejection-note">
								<span>Razón de rechazo:</span> {project.rejection_reason}
							</div>
						{/if}
					</div>

					<!-- Card footer -->
					<div class="project-card-footer">
						<span class="project-date">Registrado: {formatDateTime(project.created_at)}</span>
						<button
							class="review-btn"
							class:review-btn-pending={project.status === 'pending'}
							onclick={() => openModal(project)}
							id="review-project-{project.id}"
						>
							{project.status === 'pending' ? '🔍 Revisar' : '📋 Ver detalles'}
						</button>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if data.totalPages > 1}
			<div class="pagination">
				{#if data.page > 1}
					<a href="?estado={data.statusFilter}&pagina={data.page - 1}" class="page-btn">← Anterior</a>
				{/if}
				<span class="page-info">Página {data.page} de {data.totalPages}</span>
				{#if data.page < data.totalPages}
					<a href="?estado={data.statusFilter}&pagina={data.page + 1}" class="page-btn">Siguiente →</a>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<!-- Project Review Modal -->
{#if activeModal}
	<div
		class="modal-backdrop"
		onclick={closeModal}
		role="dialog"
		aria-modal="true"
		aria-labelledby="proj-modal-title"
	>
		<div class="modal-box" onclick={(e) => e.stopPropagation()} role="document">
			<div class="modal-header">
				<h2 id="proj-modal-title" class="modal-title">
					{activeModal.status === 'pending' ? '🔍 Revisar proyecto' : '📋 Detalle del proyecto'}
				</h2>
				<button class="modal-close" onclick={closeModal} aria-label="Cerrar">✕</button>
			</div>

			<div class="modal-body">
				<div class="detail-grid">
					<div class="detail-row">
						<span class="detail-label">Proyecto</span>
						<span class="detail-val">{activeModal.name}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Organización</span>
						<span class="detail-val">{activeModal.ong_name}</span>
					</div>
					{#if activeModal.ong_document}
						<div class="detail-row">
							<span class="detail-label">RIF / Documento</span>
							<span class="detail-val"><code>{activeModal.ong_document}</code></span>
						</div>
					{/if}
					<div class="detail-row">
						<span class="detail-label">Área</span>
						<span class="detail-val"><span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;">{getAreaIconName(activeModal.area?.icon)}</span> {activeModal.area?.name}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Contacto</span>
						<span class="detail-val">
							<a href="mailto:{activeModal.ong_contact_email}" class="modal-link">{activeModal.ong_contact_email}</a>
						</span>
					</div>
					{#if activeModal.ong_phone}
						<div class="detail-row">
							<span class="detail-label">Teléfono</span>
							<span class="detail-val">{activeModal.ong_phone}</span>
						</div>
					{/if}
					{#if activeModal.website_url}
						<div class="detail-row">
							<span class="detail-label">Sitio web</span>
							<span class="detail-val">
								<a href={activeModal.website_url} target="_blank" rel="noopener noreferrer" class="modal-link">{activeModal.website_url} ↗</a>
							</span>
						</div>
					{/if}
					{#if activeModal.goal_amount}
						<div class="detail-row">
							<span class="detail-label">Meta de recaudación</span>
							<span class="detail-val">{formatCurrency(activeModal.goal_amount, 'USD')}</span>
						</div>
					{/if}
					<div class="detail-row detail-row-full">
						<span class="detail-label">Descripción del proyecto</span>
						<p class="detail-desc">{activeModal.description}</p>
					</div>
					<div class="detail-row">
						<span class="detail-label">Estado actual</span>
						<span class="detail-val">
							<Badge variant={statusVariant(activeModal.status)}>{statusLabel(activeModal.status)}</Badge>
						</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Registrado</span>
						<span class="detail-val">{formatDateTime(activeModal.created_at)}</span>
					</div>
				</div>

				<!-- Actions for pending projects -->
				{#if activeModal.status === 'pending'}
					<div class="modal-actions-section">
						<label class="form-label" for="rejection-reason-input">
							Razón de rechazo <span class="hint">(solo si rechazas)</span>:
						</label>
						<textarea
							id="rejection-reason-input"
							class="form-textarea"
							rows="3"
							placeholder="Ej: La organización no presenta documentación legal válida…"
							bind:value={rejectionReason}
						></textarea>

						<div class="modal-action-btns">
							<form method="POST" action="?/review" use:enhance={() => {
								submitting = true;
								return async ({ update }) => { submitting = false; await update(); };
							}}>
								<input type="hidden" name="project_id" value={activeModal.id} />
								<input type="hidden" name="action" value="approve" />
								<button
									type="submit"
									class="btn-action btn-approve"
									id="approve-{activeModal.id}"
									disabled={submitting}
								>
									{submitting ? 'Procesando…' : '✅ Aprobar proyecto'}
								</button>
							</form>

							<form method="POST" action="?/review" use:enhance={() => {
								submitting = true;
								return async ({ update }) => { submitting = false; await update(); };
							}}>
								<input type="hidden" name="project_id" value={activeModal.id} />
								<input type="hidden" name="action" value="reject" />
								<input type="hidden" name="rejection_reason" value={rejectionReason} />
								<button
									type="submit"
									class="btn-action btn-reject"
									id="reject-{activeModal.id}"
									disabled={submitting}
								>
									{submitting ? 'Procesando…' : '✕ Rechazar proyecto'}
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
	.admin-projects { display: flex; flex-direction: column; gap: var(--space-5); max-width: 1200px; }
	.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); }
	.page-title { font-size: var(--text-3xl); font-weight: 900; letter-spacing: -0.03em; }
	.page-subtitle { font-size: var(--text-sm); color: var(--text-muted); margin-top: var(--space-1); }

	.feedback-banner { padding: var(--space-4) var(--space-5); border-radius: 0; font-size: var(--text-sm); font-weight: 500; }
	.feedback-banner.success { background: rgba(22,163,74,0.06); border: 1px solid rgba(22,163,74,0.2); color: #15803d; }
	.feedback-banner.error { background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.2); color: #dc2626; }

	.filters-bar { display: flex; gap: var(--space-2); flex-wrap: wrap; }
	.filter-chip {
		padding: var(--space-2) var(--space-4);
		border-radius: 8px;
		font-size: var(--text-sm);
		font-weight: 600;
		font-family: var(--font-body);
		background: var(--bg-elevated);
		border: 1px solid var(--border-subtle);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	.filter-chip:hover { background: var(--bg-secondary); border-color: var(--border-default); color: var(--text-primary); }
	.filter-chip.active { background: var(--blue-50); border-color: var(--blue-500); color: var(--blue-600); }

	/* Projects grid */
	.projects-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-5); }

	.project-card {
		background: #ffffff;
		border: 1px solid var(--border-subtle);
		border-radius: 12px;
		box-shadow: var(--shadow-sm);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		transition: border-color var(--duration-fast);
	}
	.project-card:has(.review-btn-pending) { border-color: var(--blue-400); }

	.project-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--border-subtle);
		background: color-mix(in srgb, var(--area-color) 8%, var(--bg-secondary));
		border-radius: 12px 12px 0 0;
	}

	.project-area-badge {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--area-color);
	}

	.project-card-body { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); flex: 1; }
	.project-name { font-family: var(--font-display); font-size: var(--text-xl); font-weight: 700; color: var(--text-primary); line-height: 1.3; }
	.project-ong { font-size: var(--text-sm); color: var(--text-muted); font-weight: 600; }
	.ong-rif { font-weight: 400; font-family: monospace; font-size: var(--text-xs); }
	.project-desc { font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.65; }

	.project-contact { display: flex; flex-direction: column; gap: var(--space-1); }
	.contact-link { font-size: var(--text-xs); color: var(--color-accent); text-decoration: none; }
	.contact-link:hover { color: var(--text-primary); }

	.project-progress { display: flex; flex-direction: column; gap: var(--space-1); }
	.project-amounts { font-size: var(--text-xs); color: var(--text-muted); }

	.rejection-note { font-size: var(--text-xs); color: #b91c1c; background: rgba(220,38,38,0.04); border: 1px solid rgba(220,38,38,0.15); padding: var(--space-2) var(--space-3); border-radius: 8px; line-height: 1.5; }
	.rejection-note span { font-weight: 700; }

	.project-card-footer { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) var(--space-5); border-top: 1px solid var(--border-subtle); }
	.project-date { font-size: var(--text-xs); color: var(--text-muted); }
	.review-btn { padding: var(--space-2) var(--space-4); border-radius: 8px; font-size: var(--text-sm); font-weight: 700; font-family: var(--font-body); cursor: pointer; border: 1px solid var(--border-subtle); color: var(--text-secondary); background: transparent; transition: all var(--duration-fast); }
	.review-btn:hover { border-color: var(--color-accent); color: var(--text-primary); }
	.review-btn.review-btn-pending { background: var(--blue-50); border-color: var(--blue-500); color: var(--blue-600); }
	.review-btn.review-btn-pending:hover { background: var(--blue-100); }

	/* Pagination */
	.pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-4); padding: var(--space-5); }
	.page-btn { font-size: var(--text-sm); color: var(--color-accent); text-decoration: none; font-weight: 600; }
	.page-info { font-size: var(--text-sm); color: var(--text-muted); }

	/* Empty */
	.empty-card { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-16); background: #ffffff; border: 1px solid var(--border-subtle); border-radius: 12px; box-shadow: var(--shadow-sm); }
	.empty-icon { font-size: 3rem; }
	.empty-text { font-size: var(--text-base); color: var(--text-muted); }

	/* Modal */
	.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; display: flex; align-items: center; justify-content: center; padding: var(--space-4); backdrop-filter: blur(8px); animation: fade-in 0.2s var(--ease-out); }
	.modal-box { background: #ffffff; border: 1px solid var(--border-subtle); border-radius: 16px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-xl); animation: scale-in 0.25s var(--ease-out); }
	.modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-6); border-bottom: 1px solid var(--border-subtle); }
	.modal-title { font-size: var(--text-xl); font-weight: 700; }
	.modal-close { background: none; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; padding: var(--space-1); border-radius: var(--radius-md); transition: all var(--duration-fast); }
	.modal-close:hover { background: var(--bg-secondary); color: var(--text-primary); }
	.modal-body { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-6); }

	.detail-grid { display: flex; flex-direction: column; gap: var(--space-3); }
	.detail-row { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--border-subtle); }
	.detail-row:last-child { border-bottom: none; padding-bottom: 0; }
	.detail-row-full { flex-direction: column; gap: var(--space-2); }
	.detail-label { font-size: var(--text-sm); color: var(--text-muted); flex-shrink: 0; }
	.detail-val { font-size: var(--text-sm); font-weight: 500; color: var(--text-primary); text-align: right; }
	.detail-desc { font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.7; padding: var(--space-3); background: var(--bg-secondary); border-radius: 8px; }
	.modal-link { color: var(--color-accent); text-decoration: none; }
	.modal-link:hover { color: var(--text-primary); }

	.modal-actions-section { display: flex; flex-direction: column; gap: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border-subtle); }
	.hint { font-size: var(--text-xs); color: var(--text-muted); font-weight: 400; }
	.modal-action-btns { display: flex; gap: var(--space-3); }
	.modal-action-btns form { flex: 1; }

	.btn-action { width: 100%; padding: var(--space-3) var(--space-5); border-radius: 8px; font-weight: 700; font-size: var(--text-sm); font-family: var(--font-body); cursor: pointer; transition: all var(--duration-fast); border: 1px solid; }
	.btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-approve { background: rgba(22,163,74,0.08); border-color: rgba(22,163,74,0.25); color: #15803d; }
	.btn-approve:hover { background: rgba(22,163,74,0.15); }
	.btn-reject { background: rgba(220,38,38,0.06); border-color: rgba(220,38,38,0.2); color: #dc2626; }
	.btn-reject:hover { background: rgba(220,38,38,0.12); }

	@media (max-width: 768px) { .projects-grid { grid-template-columns: 1fr; } }
</style>
