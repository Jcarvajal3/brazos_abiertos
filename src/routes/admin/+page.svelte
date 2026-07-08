<script lang="ts">
	import AnimatedCounter from '$lib/components/ui/AnimatedCounter.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { formatCurrency, formatRelativeTime, getDonorDisplayName, getPaymentMethodLabel } from '$lib/utils/formatters';
	import { getAreaIconName } from '$lib/utils/iconMap';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const kpis = $derived([
		{
			label: 'Total recaudado (USD)',
			value: `$${Number(data.stats.total_raised_usd).toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
			icon: '💵',
			color: 'var(--blue-400)',
			sub: 'Donaciones confirmadas'
		},
		{
			label: 'Total recaudado (VES)',
			value: `Bs.${Number(data.stats.total_raised_ves).toLocaleString('es-VE', { minimumFractionDigits: 0 })}`,
			icon: '🇻🇪',
			color: 'var(--blue-400)',
			sub: 'Pago móvil y transferencia'
		},
		{
			label: 'Donaciones pendientes',
			value: String(data.pendingDonations),
			icon: '⏳',
			color: data.pendingDonations > 0 ? '#fb923c' : 'var(--color-success)',
			sub: 'Requieren confirmación',
			href: '/admin/donaciones?estado=pending'
		},
		{
			label: 'Proyectos pendientes',
			value: String(data.pendingProjects),
			icon: '📋',
			color: data.pendingProjects > 0 ? '#fb923c' : 'var(--color-success)',
			sub: 'Esperan aprobación',
			href: '/admin/proyectos?estado=pending'
		},
		{
			label: 'Total donantes',
			value: String(data.stats.total_donors),
			icon: '👥',
			color: 'var(--text-secondary)',
			sub: 'Personas que donaron'
		},
		{
			label: 'Total transacciones',
			value: String(data.stats.total_donations),
			icon: '🔄',
			color: 'var(--text-secondary)',
			sub: 'Todas las donaciones'
		}
	]);

	function statusVariant(status: string): 'success' | 'pending' | 'error' | 'muted' {
		if (status === 'confirmed') return 'success';
		if (status === 'pending') return 'pending';
		if (status === 'failed') return 'error';
		return 'muted';
	}

	function statusLabel(status: string) {
		const labels: Record<string, string> = {
			confirmed: '✓ Confirmada',
			pending: '⏳ Pendiente',
			failed: '✕ Fallida',
			refunded: '↩ Reembolsada'
		};
		return labels[status] ?? status;
	}
</script>

<svelte:head>
	<title>Dashboard — Admin Brazos Abiertos</title>
</svelte:head>

<div class="dashboard">
	<div class="page-header">
		<div>
			<h1 class="page-title">Dashboard</h1>
			<p class="page-subtitle">Resumen en tiempo real de la plataforma.</p>
		</div>
		<div class="header-actions">
			<a href="/admin/donaciones" class="btn btn-outline btn-sm" id="dash-view-donations">Ver donaciones</a>
			<a href="/admin/proyectos" class="btn btn-primary btn-sm" id="dash-view-projects">Ver proyectos</a>
		</div>
	</div>

	<!-- Alert banners for urgent items -->
	{#if data.pendingDonations > 0 || data.pendingProjects > 0}
		<div class="alerts-section">
			{#if data.pendingDonations > 0}
				<a href="/admin/donaciones?estado=pending" class="alert-banner alert-orange">
					<span>⏳</span>
					<span><strong>{data.pendingDonations}</strong> {data.pendingDonations === 1 ? 'donación manual pendiente' : 'donaciones manuales pendientes'} de confirmación</span>
					<span class="alert-arrow">→</span>
				</a>
			{/if}
			{#if data.pendingProjects > 0}
				<a href="/admin/proyectos?estado=pending" class="alert-banner alert-gold">
					<span>📋</span>
					<span><strong>{data.pendingProjects}</strong> {data.pendingProjects === 1 ? 'proyecto pendiente' : 'proyectos pendientes'} de aprobación</span>
					<span class="alert-arrow">→</span>
				</a>
			{/if}
		</div>
	{/if}

	<!-- KPI Grid -->
	<div class="kpi-grid">
		{#each kpis as kpi}
			<div class="kpi-card" style="--kpi-color: {kpi.color}">
				{#if kpi.href}
					<a href={kpi.href} class="kpi-link">
						<div class="kpi-icon">{kpi.icon}</div>
						<div class="kpi-body">
							<p class="kpi-label">{kpi.label}</p>
							<p class="kpi-value" style="color: {kpi.color}">{kpi.value}</p>
							<p class="kpi-sub">{kpi.sub}</p>
						</div>
					</a>
				{:else}
					<div class="kpi-icon">{kpi.icon}</div>
					<div class="kpi-body">
						<p class="kpi-label">{kpi.label}</p>
						<p class="kpi-value" style="color: {kpi.color}">{kpi.value}</p>
						<p class="kpi-sub">{kpi.sub}</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Breakdown bar -->
	<div class="breakdown-card">
		<h2 class="section-title">Estado de donaciones</h2>
		<div class="breakdown-stats">
			<div class="breakdown-item">
				<span class="breakdown-dot confirmed"></span>
				<span class="breakdown-label">Confirmadas</span>
				<span class="breakdown-val">{data.breakdown.total_count - data.breakdown.pending_count - data.breakdown.failed_count}</span>
			</div>
			<div class="breakdown-item">
				<span class="breakdown-dot pending"></span>
				<span class="breakdown-label">Pendientes</span>
				<span class="breakdown-val">{data.breakdown.pending_count}</span>
			</div>
			<div class="breakdown-item">
				<span class="breakdown-dot failed"></span>
				<span class="breakdown-label">Fallidas/Rechazadas</span>
				<span class="breakdown-val">{data.breakdown.failed_count}</span>
			</div>
			<div class="breakdown-item">
				<span class="breakdown-dot total"></span>
				<span class="breakdown-label">Total</span>
				<span class="breakdown-val">{data.breakdown.total_count}</span>
			</div>
		</div>

		{#if data.breakdown.total_count > 0}
			{@const confirmedPct = ((data.breakdown.total_count - data.breakdown.pending_count - data.breakdown.failed_count) / data.breakdown.total_count) * 100}
			{@const pendingPct = (data.breakdown.pending_count / data.breakdown.total_count) * 100}
			{@const failedPct = (data.breakdown.failed_count / data.breakdown.total_count) * 100}
			<div class="breakdown-bar">
				<div class="bar-segment confirmed" style="width: {confirmedPct}%;" title="Confirmadas"></div>
				<div class="bar-segment pending" style="width: {pendingPct}%;" title="Pendientes"></div>
				<div class="bar-segment failed" style="width: {failedPct}%;" title="Fallidas"></div>
			</div>
		{/if}
	</div>

	<!-- Recent Activity -->
	<div class="activity-card">
		<div class="section-header">
			<h2 class="section-title">Actividad reciente</h2>
			<a href="/admin/donaciones" class="section-link">Ver todas →</a>
		</div>

		{#if data.recentActivity.length === 0}
			<p class="empty-state">No hay donaciones aún.</p>
		{:else}
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th>Donante</th>
							<th>Área</th>
							<th>Monto</th>
							<th>Método</th>
							<th>Estado</th>
							<th>Fecha</th>
							<th>Acciones</th>
						</tr>
					</thead>
					<tbody>
						{#each data.recentActivity as donation (donation.id)}
							<tr>
								<td class="td-name">
									{getDonorDisplayName(donation.is_anonymous, donation.donor_name)}
								</td>
								<td>
									<span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;">{getAreaIconName(donation.area?.icon)}</span> {donation.area?.name}
								</td>
								<td class="td-amount">
									{formatCurrency(donation.amount, donation.currency)}
								</td>
								<td class="td-method">
									{getPaymentMethodLabel(donation.payment_method)}
								</td>
								<td>
									<Badge variant={statusVariant(donation.payment_status)}>
										{statusLabel(donation.payment_status)}
									</Badge>
								</td>
								<td class="td-date">
									{formatRelativeTime(donation.created_at)}
								</td>
								<td>
									<a href="/admin/donaciones?id={donation.id}" class="table-action-link">
										Ver →
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	.dashboard { display: flex; flex-direction: column; gap: var(--space-6); max-width: 1200px; }

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
		flex-wrap: wrap;
	}
	.page-title { font-size: var(--text-3xl); font-weight: 900; letter-spacing: -0.03em; }
	.page-subtitle { font-size: var(--text-sm); color: var(--text-muted); margin-top: var(--space-1); }
	.header-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }

	/* Alerts */
	.alerts-section { display: flex; flex-direction: column; gap: var(--space-3); }
	.alert-banner {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-5);
		border-radius: 10px;
		text-decoration: none;
		font-size: var(--text-sm);
		font-weight: 500;
		transition: all var(--duration-fast) var(--ease-out);
	}
	.alert-banner:hover { transform: translateX(4px); }
	.alert-orange {
		background: rgba(217, 119, 6, 0.06);
		border: 1px solid rgba(217, 119, 6, 0.2);
		color: #b45309;
	}
	.alert-gold {
		background: var(--blue-50);
		border: 1px solid rgba(20, 96, 154, 0.2);
		color: var(--blue-600);
	}
	.alert-banner strong { color: var(--text-primary); }
	.alert-arrow { margin-left: auto; }

	/* KPI Grid */
	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-4);
	}

	.kpi-card {
		background: #ffffff;
		border: 1px solid var(--border-subtle);
		border-radius: 12px;
		padding: var(--space-5);
		display: flex;
		align-items: flex-start;
		gap: var(--space-4);
		transition: border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out);
		position: relative;
		overflow: hidden;
		box-shadow: var(--shadow-sm);
	}
	.kpi-card::before {
		content: '';
		position: absolute;
		top: 0; left: 0; right: 0;
		height: 3px;
		background: var(--kpi-color, var(--border-default));
		opacity: 0.6;
		border-radius: 12px 12px 0 0;
	}
	.kpi-card:has(.kpi-link):hover {
		border-color: var(--kpi-color, var(--border-default));
		box-shadow: var(--shadow-md);
	}

	.kpi-link {
		display: contents;
		text-decoration: none;
	}

	.kpi-icon { font-size: 1.75rem; line-height: 1; flex-shrink: 0; }
	.kpi-body { display: flex; flex-direction: column; gap: var(--space-1); min-width: 0; }
	.kpi-label { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
	.kpi-value { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }
	.kpi-sub { font-size: var(--text-xs); color: var(--text-muted); }

	/* Breakdown */
	.breakdown-card {
		background: #ffffff;
		border: 1px solid var(--border-subtle);
		border-radius: 12px;
		padding: var(--space-6);
		box-shadow: var(--shadow-sm);
	}

	.section-title { font-family: var(--font-display); font-size: var(--text-lg); font-weight: 700; margin-bottom: var(--space-5); }
	.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-5); }
	.section-link { font-size: var(--text-sm); color: var(--color-accent); text-decoration: none; font-weight: 600; }
	.section-link:hover { color: var(--blue-700); }

	.breakdown-stats {
		display: flex;
		gap: var(--space-8);
		flex-wrap: wrap;
		margin-bottom: var(--space-5);
	}
	.breakdown-item { display: flex; align-items: center; gap: var(--space-2); }
	.breakdown-dot {
		width: 10px; height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.breakdown-dot.confirmed { background: #16a34a; }
	.breakdown-dot.pending { background: #d97706; }
	.breakdown-dot.failed { background: #dc2626; }
	.breakdown-dot.total { background: var(--text-muted); }
	.breakdown-label { font-size: var(--text-sm); color: var(--text-secondary); }
	.breakdown-val { font-family: var(--font-display); font-size: var(--text-base); font-weight: 700; color: var(--text-primary); margin-left: var(--space-1); }

	.breakdown-bar {
		height: 8px;
		background: var(--bg-elevated);
		border-radius: var(--radius-full);
		overflow: hidden;
		display: flex;
	}
	.bar-segment { height: 100%; transition: width 1s var(--ease-out); }
	.bar-segment.confirmed { background: #16a34a; }
	.bar-segment.pending { background: #d97706; }
	.bar-segment.failed { background: #dc2626; }

	/* Activity table */
	.activity-card {
		background: #ffffff;
		border: 1px solid var(--border-subtle);
		border-radius: 12px;
		padding: var(--space-6);
		box-shadow: var(--shadow-sm);
	}
	.empty-state { font-size: var(--text-sm); color: var(--text-muted); text-align: center; padding: var(--space-8); }

	.td-name { font-weight: 500; color: var(--text-primary); }
	.td-amount { font-family: var(--font-display); font-weight: 700; color: var(--blue-600); }
	.td-method { color: var(--text-secondary); font-size: var(--text-xs); }
	.td-date { color: var(--text-muted); font-size: var(--text-xs); white-space: nowrap; }
	.table-action-link { font-size: var(--text-xs); color: var(--color-accent); text-decoration: none; font-weight: 600; }
	.table-action-link:hover { color: var(--blue-700); }

	@media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
	@media (max-width: 640px) { .kpi-grid { grid-template-columns: 1fr; } .breakdown-stats { flex-direction: column; gap: var(--space-3); } }
</style>
