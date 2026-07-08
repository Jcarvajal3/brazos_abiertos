<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createSupabaseClient } from '$lib/supabase';
	import AnimatedCounter from '$lib/components/ui/AnimatedCounter.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { formatCurrency, getDonorDisplayName, formatRelativeTime } from '$lib/utils/formatters';
	import type { PageData } from './$types';
	import type { Donation } from '$lib/types';
	import { getAreaIconName } from '$lib/utils/iconMap';

	let { data }: { data: PageData } = $props();

	// Real-time feed state — starts with SSR data
	let recentDonations = $state(data.recentDonations ?? []);
	let stats = $state(data.stats);
	let expenseStats = $state(data.expenseStats);

	// UI state
	let showIncomeModal = $state(false);
	let showExpenseModal = $state(false);
	let activeTab = $state('all'); // 'all' or area slug
	let expenseImageModal = $state<string | null>(null); // URL for receipt image lightbox

	const supabase = createSupabaseClient();
	let channel: ReturnType<typeof supabase.channel> | null = null;

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	// Filtered donations based on active tab
	const filteredDonations = $derived(
		activeTab === 'all'
			? recentDonations
			: recentDonations.filter((d: any) => d.area?.slug === activeTab)
	);

	onMount(() => {
		// Subscribe to new confirmed donations in real time
		channel = supabase
			.channel('live-donations')
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'donations',
					filter: 'payment_status=eq.confirmed'
				},
				async (payload) => {
					const { data: newDonation } = await supabase
						.from('donations')
						.select('id, donor_name, is_anonymous, amount, currency, confirmed_at, area:areas(name, icon, slug)')
						.eq('id', payload.new.id)
						.single();

					if (newDonation) {
						const d = newDonation as any;
						recentDonations = [d, ...recentDonations].slice(0, 50);
						if (d.currency === 'USD') {
							stats = { ...stats, total_raised_usd: stats.total_raised_usd + d.amount, total_donations: stats.total_donations + 1 };
						} else {
							stats = { ...stats, total_raised_ves: stats.total_raised_ves + d.amount, total_donations: stats.total_donations + 1 };
						}
					}
				}
			)
			.subscribe();
	});

	onDestroy(() => {
		if (channel) supabase.removeChannel(channel);
	});

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('es-VE', {
			year: 'numeric', month: 'short', day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Brazos Abiertos Fundacion — Dona y reconstruye vidas</title>
	<meta name="description" content="Plataforma de donaciones para las victimas del terremoto de Venezuela 2026. Cada donacion ayuda a reconstruir vidas. Dona ahora con Stripe, Pago Movil o Transferencia." />
	<meta property="og:title" content="Brazos Abiertos Fundacion" />
	<meta property="og:description" content="Dona para ayudar a las victimas del terremoto de Venezuela 2026." />
</svelte:head>

<!-- HERO -->
<section class="hero">
	<div class="hero-bg" aria-hidden="true">
		<img src="/images/hero-bg.png" alt="" class="hero-bg-img" />
	</div>
	<div class="hero-overlay" aria-hidden="true"></div>
	<div class="container">
		<div class="hero-inner">
			<div class="animate-fade-in-up">
				<span class="hero-tag">Emergencia Venezuela 2026</span>
			</div>

			<h1 class="hero-title animate-fade-in-up delay-100">
				Abre tus brazos<br />a Venezuela
			</h1>

			<p class="hero-subtitle animate-fade-in-up delay-200">
				El terremoto dejo miles de familias sin hogar, sin alimentos y sin esperanza.
				Tu donacion llega directamente a quienes mas lo necesitan, con total transparencia.
			</p>

			<div class="hero-actions animate-fade-in-up delay-300">
				<Button href="/donar" variant="primary" size="xl">
					Donar ahora
				</Button>
				<a href="/proyectos" class="btn btn-outline-light btn-xl">
					Ver proyectos
				</a>
			</div>

			<div class="hero-trust animate-fade-in-up delay-400">
				<div class="trust-badge">
					<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
					Pagos seguros con Stripe
				</div>
				<div class="trust-badge">
					<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
					100% transparente
				</div>
				<div class="trust-badge">
					<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>
					Tiempo real
				</div>
			</div>
		</div>
	</div>
</section>

<!-- INGRESOS vs EGRESOS -->
<section class="section finance-section">
	<div class="container">
		<div class="section-heading">
			<span class="eyebrow">Transparencia total</span>
			<h2>Tus fondos, <span class="text-gradient">tu control</span></h2>
			<p>Cada bolivar y cada dolar que ingresa y sale se muestra aqui. Sin excepciones.</p>
		</div>

		<div class="finance-panel animate-fade-in-up">
			<div class="finance-grid">
				<!-- INGRESOS -->
				<div class="finance-block finance-income">
					<span class="finance-label">Ingresos totales</span>
					<span class="finance-amount finance-amount-income">
						$<AnimatedCounter
							value={stats.total_raised_usd}
							format={(v) => Math.round(v).toLocaleString('en-US')}
						/>
					</span>
					{#if stats.total_raised_ves > 0}
						<span class="finance-secondary">
							Bs.<AnimatedCounter
								value={stats.total_raised_ves}
								format={(v) => Math.round(v).toLocaleString('es-VE')}
							/>
						</span>
					{/if}
					<button class="btn btn-outline btn-sm finance-btn" onclick={() => (showIncomeModal = true)}>
						Ver detalles
					</button>
				</div>

				<!-- DIVIDER -->
				<div class="finance-divider" aria-hidden="true">
					<div class="finance-divider-line"></div>
				</div>

				<!-- EGRESOS -->
				<div class="finance-block finance-expense">
					<span class="finance-label">Egresos totales</span>
					<span class="finance-amount finance-amount-expense">
						$<AnimatedCounter
							value={expenseStats.total_expenses_usd}
							format={(v) => Math.round(v).toLocaleString('en-US')}
						/>
					</span>
					{#if expenseStats.total_expenses_ves > 0}
						<span class="finance-secondary">
							Bs.<AnimatedCounter
								value={expenseStats.total_expenses_ves}
								format={(v) => Math.round(v).toLocaleString('es-VE')}
							/>
						</span>
					{/if}
					<button class="btn btn-outline btn-sm finance-btn" onclick={() => (showExpenseModal = true)}>
						Ver detalles
					</button>
				</div>
			</div>

			<!-- CTA Button -->
			<div class="finance-cta">
				<Button href="/donar" variant="primary" size="lg">Donar aqui</Button>
			</div>
		</div>
	</div>
</section>

<!-- DONACIONES EN VIVO -->
<section class="section livefeed-section">
	<div class="container">
		<div class="livefeed-header">
			<div>
				<h2 class="livefeed-title">Donaciones en vivo</h2>
				<p class="livefeed-subtitle">Mira en tiempo real como llegan las donaciones.</p>
			</div>
			<span class="live-badge">
				<span class="live-dot"></span> EN VIVO
			</span>
		</div>

		<!-- Area Tabs -->
		<div class="feed-tabs" role="tablist" aria-label="Filtrar donaciones por area">
			<button
				class="feed-tab"
				class:active={activeTab === 'all'}
				onclick={() => (activeTab = 'all')}
				role="tab"
				aria-selected={activeTab === 'all'}
			>Todas</button>
			{#each data.areas as area}
				<button
					class="feed-tab"
					class:active={activeTab === area.slug}
					onclick={() => (activeTab = area.slug)}
					role="tab"
					aria-selected={activeTab === area.slug}
				>
					<span class="material-symbols-outlined feed-tab-icon" style="color:{area.color};">{getAreaIconName(area.icon)}</span>
					{area.name}
				</button>
			{/each}
		</div>

		<!-- Donation Feed -->
		{#if filteredDonations.length === 0}
			<div class="feed-empty">
				<span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--text-muted);">volunteer_activism</span>
				<p>{activeTab === 'all' ? 'Se el primero en donar' : 'Sin donaciones en esta area aun'}</p>
				<Button href="/donar" variant="primary" size="sm">Hacer una donacion</Button>
			</div>
		{:else}
			<div class="feed-list" id="donation-feed" aria-live="polite" aria-label="Lista de donaciones recientes">
				{#each filteredDonations.slice(0, 12) as d (d.id)}
					<div class="feed-row">
						<div class="avatar avatar-orange" style="width:2.25rem;height:2.25rem;font-size:0.7rem;">
							{d.is_anonymous ? '?' : getInitials(getDonorDisplayName(d.is_anonymous, d.donor_name))}
						</div>
						<div class="feed-info">
							<span class="feed-name">{getDonorDisplayName(d.is_anonymous, d.donor_name)}</span>
							<span class="feed-meta">
								<span class="material-symbols-outlined" style="font-size:0.75rem;vertical-align:middle;">{getAreaIconName(d.area?.icon)}</span>
								{d.area?.name}
								{#if d.confirmed_at}
									<span class="feed-time">· {formatRelativeTime(d.confirmed_at)}</span>
								{/if}
							</span>
						</div>
						<span class="feed-amount">{formatCurrency(d.amount, d.currency)}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- AREAS / CATEGORIES -->
{#if data.areas.length > 0}
<section class="section areas-section">
	<div class="container">
		<div class="section-heading">
			<span class="eyebrow">Areas de impacto</span>
			<h2>Donde quieres <span class="text-gradient">ayudar</span></h2>
			<p>Selecciona el area donde deseas dirigir tu donacion. Cada contribucion marca la diferencia.</p>
		</div>

		<div class="areas-grid">
			{#each data.areas as area, i}
				<a
					href="/donar?area={area.slug}"
					class="area-card card card-interactive animate-fade-in-up"
					style="animation-delay: {i * 60}ms"
					id="area-{area.slug}"
				>
					<div class="area-icon" style="background: {area.color}12; border-color: {area.color}30;">
						<span class="material-symbols-outlined" style="font-size: 1.5rem; color: {area.color};" aria-label={area.name}>
							{getAreaIconName(area.icon)}
						</span>
					</div>
					<h3 class="area-name">{area.name}</h3>
					<p class="area-desc">{area.description}</p>
					<span class="area-cta">
						Donar aqui
						<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
						</svg>
					</span>
				</a>
			{/each}
		</div>
	</div>
</section>
{/if}

<!-- FEATURED PROJECTS -->
{#if data.featuredProjects.length > 0}
<section class="section projects-section">
	<div class="container">
		<div class="section-heading">
			<span class="eyebrow">Proyectos verificados</span>
			<h2>ONGs que <span class="text-gradient">necesitan</span> tu apoyo</h2>
			<p>Proyectos verificados de organizaciones que trabajan directamente en las zonas afectadas.</p>
		</div>

		<div class="projects-grid">
			{#each data.featuredProjects as project, i}
				{@const percent = project.goal_amount ? Math.min(100, (project.current_amount / project.goal_amount) * 100) : 0}
				<article class="project-card card card-hover animate-fade-in-up" style="animation-delay:{i*80}ms">
					{#if project.cover_image_url}
						<img src={project.cover_image_url} alt={project.name} class="project-img" loading="lazy" />
					{:else}
						<div class="project-img-placeholder" style="background:{project.area?.color ?? '#14609A'}12;">
							<span class="material-symbols-outlined" style="font-size:3rem; color:{project.area?.color ?? '#14609A'};">volunteer_activism</span>
						</div>
					{/if}

					<div class="project-body">
						<div class="project-meta">
							<span class="badge badge-muted">{project.area?.name}</span>
						</div>
						<h3 class="project-name">{project.name}</h3>
						<p class="project-ong">{project.ong_name}</p>
						<p class="project-desc">{project.description.slice(0, 120)}...</p>

						{#if project.goal_amount}
							<div class="project-progress">
								<ProgressBar {percent} showPercent={false} height={6} />
								<div class="project-raised">
									<span>{formatCurrency(project.current_amount, 'USD')}</span>
									<span class="project-goal">de {formatCurrency(project.goal_amount, 'USD')}</span>
								</div>
							</div>
						{/if}

						<a href="/donar?proyecto={project.id}" class="btn btn-primary btn-sm project-btn">
							Donar a este proyecto
						</a>
					</div>
				</article>
			{/each}
		</div>

		<div class="projects-cta">
			<Button href="/proyectos" variant="outline">Ver todos los proyectos</Button>
		</div>
	</div>
</section>
{/if}

<!-- CTA DONAR CON FOTOS -->
<section class="cta-section">
	<div class="container">
		<div class="cta-wrapper">
			<!-- Left: Real photos grid -->
			<div class="cta-images animate-fade-in-up">
				<div class="cta-image-large">
					<img src="/images/cta-rebuilding.png" alt="Comunidad reconstruyendo hogares tras el terremoto" loading="lazy" />
					<span class="cta-image-overlay">Reconstruccion</span>
				</div>
				<div class="cta-image-stack">
					<div class="cta-image-small">
						<img src="/images/cta-volunteers.png" alt="Voluntarios distribuyendo alimentos" loading="lazy" />
						<span class="cta-image-overlay">Alimentacion</span>
					</div>
					<div class="cta-image-small">
						<img src="/images/cta-healthcare.png" alt="Profesional de salud atendiendo a ninos" loading="lazy" />
						<span class="cta-image-overlay">Salud</span>
					</div>
				</div>
			</div>

			<!-- Right: CTA content -->
			<div class="cta-content animate-fade-in-up delay-200">
				<span class="cta-eyebrow">Tu apoyo importa</span>
				<h2 class="cta-title">Cada donacion<br />reconstruye una <span class="text-gradient">vida</span></h2>
				<p class="cta-desc">
					Miles de familias venezolanas necesitan tu ayuda ahora. Tu contribucion,
					sin importar el monto, genera un impacto real y medible. Juntos
					podemos reconstruir comunidades enteras.
				</p>

				<div class="cta-stats-row">
					<div class="cta-stat">
						<span class="cta-stat-value">{Number(stats.total_donors).toLocaleString()}</span>
						<span class="cta-stat-label">personas ya ayudaron</span>
					</div>
					<div class="cta-stat-divider"></div>
					<div class="cta-stat">
						<span class="cta-stat-value">100%</span>
						<span class="cta-stat-label">transparente</span>
					</div>
				</div>

				<div class="cta-actions">
					<Button href="/donar" variant="primary" size="xl">Donar ahora</Button>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ═══════ MODALS ═══════ -->

<!-- INCOME DETAIL MODAL -->
{#if showIncomeModal}
	<div class="modal-backdrop" onclick={() => (showIncomeModal = false)} role="dialog" aria-modal="true" aria-label="Detalle de ingresos">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="modal-content modal-lg" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<div>
					<h2 class="modal-title">Historial de ingresos</h2>
					<p class="modal-subtitle">Todas las donaciones confirmadas</p>
				</div>
				<button class="modal-close" onclick={() => (showIncomeModal = false)} aria-label="Cerrar">
					<span class="material-symbols-outlined">close</span>
				</button>
			</div>

			<div class="modal-stats-bar">
				<div class="modal-stat">
					<span class="modal-stat-label">Total USD</span>
					<span class="modal-stat-value">{formatCurrency(stats.total_raised_usd, 'USD')}</span>
				</div>
				{#if stats.total_raised_ves > 0}
					<div class="modal-stat">
						<span class="modal-stat-label">Total VES</span>
						<span class="modal-stat-value">{formatCurrency(stats.total_raised_ves, 'VES')}</span>
					</div>
				{/if}
				<div class="modal-stat">
					<span class="modal-stat-label">Total donaciones</span>
					<span class="modal-stat-value">{stats.total_donations}</span>
				</div>
			</div>

			<div class="modal-table-wrap">
				{#if recentDonations.length === 0}
					<div class="modal-empty">
						<p>Sin donaciones registradas aun.</p>
					</div>
				{:else}
					<table class="modal-table">
						<thead>
							<tr>
								<th>Donante</th>
								<th>Area</th>
								<th>Monto</th>
								<th>Fecha</th>
							</tr>
						</thead>
						<tbody>
							{#each recentDonations as d (d.id)}
								<tr>
									<td>
										<div class="table-donor">
											<div class="avatar avatar-orange" style="width:1.75rem;height:1.75rem;font-size:0.6rem;">
												{d.is_anonymous ? '?' : getInitials(getDonorDisplayName(d.is_anonymous, d.donor_name))}
											</div>
											<span>{getDonorDisplayName(d.is_anonymous, d.donor_name)}</span>
										</div>
									</td>
									<td>
										<span class="table-area">
											<span class="material-symbols-outlined" style="font-size:0.85rem;">{getAreaIconName(d.area?.icon)}</span>
											{d.area?.name}
										</span>
									</td>
									<td class="table-amount">{formatCurrency(d.amount, d.currency)}</td>
									<td class="table-date">{d.confirmed_at ? formatDate(d.confirmed_at) : '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- EXPENSE DETAIL MODAL -->
{#if showExpenseModal}
	<div class="modal-backdrop" onclick={() => (showExpenseModal = false)} role="dialog" aria-modal="true" aria-label="Detalle de egresos">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="modal-content modal-lg" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<div>
					<h2 class="modal-title">Historial de egresos</h2>
					<p class="modal-subtitle">Desembolsos y gastos verificables</p>
				</div>
				<button class="modal-close" onclick={() => (showExpenseModal = false)} aria-label="Cerrar">
					<span class="material-symbols-outlined">close</span>
				</button>
			</div>

			<div class="modal-stats-bar">
				<div class="modal-stat">
					<span class="modal-stat-label">Total USD</span>
					<span class="modal-stat-value">{formatCurrency(expenseStats.total_expenses_usd, 'USD')}</span>
				</div>
				{#if expenseStats.total_expenses_ves > 0}
					<div class="modal-stat">
						<span class="modal-stat-label">Total VES</span>
						<span class="modal-stat-value">{formatCurrency(expenseStats.total_expenses_ves, 'VES')}</span>
					</div>
				{/if}
				<div class="modal-stat">
					<span class="modal-stat-label">Total registros</span>
					<span class="modal-stat-value">{expenseStats.total_expense_records}</span>
				</div>
			</div>

			<div class="modal-table-wrap">
				{#if (data.recentExpenses ?? []).length === 0}
					<div class="modal-empty">
						<span class="material-symbols-outlined" style="font-size:2rem;color:var(--text-muted);">receipt_long</span>
						<p>Sin egresos registrados aun.</p>
						<span class="modal-empty-hint">Los egresos se registran desde el panel de administracion.</span>
					</div>
				{:else}
					<table class="modal-table">
						<thead>
							<tr>
								<th>Concepto</th>
								<th>Area</th>
								<th>Monto</th>
								<th>Fecha</th>
								<th>Factura</th>
							</tr>
						</thead>
						<tbody>
							{#each data.recentExpenses as exp}
								<tr>
									<td>
										<div class="table-expense-concept">
											<strong>{exp.concept}</strong>
											{#if exp.vendor}
												<span class="table-vendor">{exp.vendor}</span>
											{/if}
										</div>
									</td>
									<td>
										<span class="table-area">
											<span class="material-symbols-outlined" style="font-size:0.85rem;">{getAreaIconName(exp.area?.icon)}</span>
											{exp.area?.name}
										</span>
									</td>
									<td class="table-amount">{formatCurrency(exp.amount, exp.currency)}</td>
									<td class="table-date">{formatDate(exp.expense_date)}</td>
									<td>
										{#if exp.receipt_image_url}
											<button class="receipt-btn" onclick={() => (expenseImageModal = exp.receipt_image_url)} aria-label="Ver factura">
												<span class="material-symbols-outlined" style="font-size:1rem;">image</span>
												Ver
											</button>
										{:else if exp.receipt_image_urls?.length}
											<button class="receipt-btn" onclick={() => (expenseImageModal = exp.receipt_image_urls[0])} aria-label="Ver factura">
												<span class="material-symbols-outlined" style="font-size:1rem;">image</span>
												Ver ({exp.receipt_image_urls.length})
											</button>
										{:else}
											<span class="table-no-receipt">—</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- RECEIPT IMAGE LIGHTBOX -->
{#if expenseImageModal}
	<div class="modal-backdrop lightbox-backdrop" onclick={() => (expenseImageModal = null)} role="dialog" aria-modal="true" aria-label="Imagen de factura">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="lightbox-content" onclick={(e) => e.stopPropagation()}>
			<button class="modal-close lightbox-close" onclick={() => (expenseImageModal = null)} aria-label="Cerrar">
				<span class="material-symbols-outlined">close</span>
			</button>
			<img src={expenseImageModal} alt="Factura / Recibo" class="lightbox-img" />
		</div>
	</div>
{/if}

<style>
	/* --- Hero ----------------------------------- */
	.hero {
		position: relative;
		min-height: 85vh;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		padding-block: var(--space-24) var(--space-16);
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.hero-bg-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center top;
	}

	.hero-overlay {
		position: absolute;
		inset: 0;
		z-index: 1;
		background: linear-gradient(
			180deg,
			rgba(10, 47, 80, 0.75) 0%,
			rgba(20, 96, 154, 0.6) 50%,
			rgba(10, 47, 80, 0.85) 100%
		);
	}

	.hero-inner {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.hero-tag {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		border-radius: 0;
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.2);
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: 600;
		color: #ffffff;
		margin-bottom: var(--space-6);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		backdrop-filter: blur(4px);
	}

	.hero-title {
		font-size: clamp(2.5rem, 6vw, 4.5rem);
		font-weight: 900;
		line-height: 1.05;
		letter-spacing: -0.04em;
		margin-bottom: var(--space-6);
		color: #ffffff;
		text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
	}

	.hero-subtitle {
		font-size: clamp(var(--text-base), 2vw, var(--text-xl));
		color: rgba(255, 255, 255, 0.85);
		line-height: 1.7;
		max-width: 600px;
		margin-inline: auto;
		margin-bottom: var(--space-10);
	}

	.hero-actions {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
		justify-content: center;
		margin-bottom: var(--space-8);
	}

	.hero-actions :global(.btn-primary) {
		background: #ffffff;
		color: var(--blue-700);
		border-color: #ffffff;
	}

	.hero-actions :global(.btn-primary:hover) {
		background: var(--blue-50);
		color: var(--blue-800);
		border-color: var(--blue-50);
	}

	.btn-outline-light {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-8);
		font-family: var(--font-display);
		font-size: var(--text-base);
		font-weight: 700;
		text-decoration: none;
		border-radius: var(--radius-btn);
		color: #ffffff;
		background: transparent;
		border: 2px solid rgba(255, 255, 255, 0.4);
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
	}

	.btn-outline-light:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.7);
	}

	.hero-trust {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		flex-wrap: wrap;
		justify-content: center;
	}

	.trust-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.7);
		font-weight: 500;
	}

	.trust-badge svg {
		color: rgba(255, 255, 255, 0.8);
		flex-shrink: 0;
	}

	/* --- Finance / Ingresos vs Egresos ---------- */
	.finance-section {
		background: var(--blue-50);
		color: var(--text-primary);
		border-top: 3px solid var(--blue-500);
		border-bottom: 1px solid var(--border-subtle);
	}

	.finance-section :global(.section-heading .eyebrow) {
		color: var(--blue-600);
	}

	.finance-section :global(.section-heading h2) {
		color: var(--text-primary);
	}

	.finance-section :global(.section-heading p) {
		color: var(--text-secondary);
	}

	.finance-panel {
		max-width: 800px;
		margin-inline: auto;
	}

	.finance-grid {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 0;
	}

	.finance-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-8) var(--space-6);
	}

	.finance-label {
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-muted);
	}

	.finance-amount {
		font-family: var(--font-display);
		font-size: clamp(var(--text-3xl), 5vw, var(--text-5xl));
		font-weight: 900;
		line-height: 1;
		letter-spacing: -0.03em;
	}

	.finance-amount-income {
		color: #16a34a;
	}

	.finance-amount-expense {
		color: #dc2626;
	}

	.finance-secondary {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--text-muted);
	}

	.finance-btn {
		margin-top: var(--space-2);
		background: transparent;
		color: var(--text-secondary);
		border-color: var(--border-default);
	}

	.finance-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		color: var(--text-primary);
		border-color: rgba(0, 0, 0, 0.2);
	}

	.finance-divider {
		display: flex;
		align-items: center;
		justify-content: center;
		padding-block: var(--space-4);
	}

	.finance-divider-line {
		width: 2px;
		height: 120px;
		background: linear-gradient(180deg, transparent, var(--blue-400), transparent);
	}

	.finance-cta {
		text-align: center;
		margin-top: var(--space-8);
		padding-top: var(--space-8);
		border-top: 1px solid var(--border-subtle);
	}

	/* --- Live Feed Section ---------------------- */
	.livefeed-section {
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-subtle);
		border-bottom: 1px solid var(--border-subtle);
	}

	.livefeed-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: var(--space-6);
		gap: var(--space-4);
	}

	.livefeed-title {
		font-size: var(--text-2xl);
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.livefeed-subtitle {
		font-size: var(--text-sm);
		color: var(--text-muted);
		margin-top: var(--space-1);
	}

	.live-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-xs);
		font-weight: 700;
		color: #dc2626;
		letter-spacing: 0.08em;
		padding: var(--space-1) var(--space-3);
		background: rgba(220, 38, 38, 0.06);
		border: 1px solid rgba(220, 38, 38, 0.15);
		border-radius: 0;
		flex-shrink: 0;
	}

	.live-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #dc2626;
		animation: pulse-live 1.4s ease-in-out infinite;
	}

	/* Feed tabs */
	.feed-tabs {
		display: flex;
		gap: var(--space-1);
		margin-bottom: var(--space-6);
		overflow-x: auto;
		padding-bottom: var(--space-2);
		-webkit-overflow-scrolling: touch;
	}

	.feed-tab {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1-5);
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-btn);
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-secondary);
		background: transparent;
		border: 1px solid var(--border-default);
		cursor: pointer;
		white-space: nowrap;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.feed-tab:hover {
		background: rgba(0, 0, 0, 0.03);
		border-color: rgba(0, 0, 0, 0.15);
	}

	.feed-tab.active {
		background: var(--blue-500);
		color: white;
		border-color: var(--blue-500);
	}

	.feed-tab.active .feed-tab-icon {
		color: white !important;
	}

	.feed-tab-icon {
		font-size: 1rem;
	}

	/* Feed list */
	.feed-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		max-height: 520px;
		overflow-y: auto;
	}

	.feed-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: var(--bg-card);
		border: 1px solid var(--border-subtle);
		border-radius: 0;
		transition: border-color var(--duration-fast) var(--ease-out),
		            background var(--duration-fast) var(--ease-out);
	}

	.feed-row:hover {
		background: white;
		border-color: var(--border-active);
	}

	.feed-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.feed-name {
		font-weight: 600;
		font-size: var(--text-sm);
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.feed-meta {
		font-size: var(--text-xs);
		color: var(--text-muted);
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.feed-time {
		color: var(--text-muted);
	}

	.feed-amount {
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--blue-600);
		white-space: nowrap;
	}

	.feed-empty {
		text-align: center;
		padding: var(--space-12);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		align-items: center;
		color: var(--text-muted);
		background: var(--bg-card);
		border: 1px solid var(--border-subtle);
	}

	/* --- Modal styles --------------------------- */
	.modal-lg {
		max-width: 780px;
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: var(--space-6);
		gap: var(--space-4);
	}

	.modal-title {
		font-size: var(--text-xl);
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.modal-subtitle {
		font-size: var(--text-sm);
		color: var(--text-muted);
		margin-top: var(--space-1);
	}

	.modal-close {
		width: 2.25rem;
		height: 2.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0;
		background: var(--bg-secondary);
		border: 1px solid var(--border-default);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
		flex-shrink: 0;
	}

	.modal-close:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	.modal-stats-bar {
		display: flex;
		gap: var(--space-6);
		padding: var(--space-4) var(--space-5);
		background: var(--bg-secondary);
		border: 1px solid var(--border-subtle);
		margin-bottom: var(--space-6);
	}

	.modal-stat {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.modal-stat-label {
		font-size: var(--text-xs);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
	}

	.modal-stat-value {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 800;
		color: var(--text-primary);
	}

	.modal-table-wrap {
		max-height: 400px;
		overflow-y: auto;
	}

	.modal-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-sm);
	}

	.modal-table thead {
		position: sticky;
		top: 0;
		z-index: 1;
	}

	.modal-table th {
		padding: var(--space-3) var(--space-4);
		text-align: left;
		font-size: var(--text-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-subtle);
		white-space: nowrap;
	}

	.modal-table td {
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--border-subtle);
		vertical-align: middle;
		color: var(--text-secondary);
	}

	.modal-table tbody tr:hover {
		background: var(--bg-secondary);
	}

	.table-donor {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.table-area {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	.table-amount {
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--blue-600);
		white-space: nowrap;
	}

	.table-date {
		font-size: var(--text-xs);
		color: var(--text-muted);
		white-space: nowrap;
	}

	.table-expense-concept strong {
		display: block;
		font-size: var(--text-sm);
		color: var(--text-primary);
	}

	.table-vendor {
		display: block;
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	.table-no-receipt {
		color: var(--text-muted);
		font-size: var(--text-sm);
	}

	.receipt-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-2);
		background: rgba(20, 96, 154, 0.08);
		border: 1px solid rgba(20, 96, 154, 0.15);
		border-radius: var(--radius-btn);
		color: var(--blue-600);
		font-size: var(--text-xs);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.receipt-btn:hover {
		background: rgba(20, 96, 154, 0.15);
		border-color: rgba(20, 96, 154, 0.3);
	}

	.modal-empty {
		text-align: center;
		padding: var(--space-12);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		align-items: center;
		color: var(--text-muted);
	}

	.modal-empty-hint {
		font-size: var(--text-xs);
		color: var(--text-muted);
		opacity: 0.7;
	}

	/* Lightbox */
	.lightbox-backdrop {
		z-index: calc(var(--z-modal) + 1);
	}

	.lightbox-content {
		position: relative;
		max-width: 90vw;
		max-height: 90vh;
	}

	.lightbox-close {
		position: absolute;
		top: var(--space-3);
		right: var(--space-3);
		z-index: 2;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		border: none;
	}

	.lightbox-close:hover {
		background: rgba(0, 0, 0, 0.8);
		color: white;
	}

	.lightbox-img {
		max-width: 100%;
		max-height: 85vh;
		object-fit: contain;
		box-shadow: var(--shadow-xl);
	}

	/* --- Projects -------------- */
	.projects-section {
		background: #ffffff;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-6);
		margin-bottom: var(--space-8);
	}

	.project-card {
		padding: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.project-img {
		width: 100%;
		height: 200px;
		object-fit: cover;
	}

	.project-img-placeholder {
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-secondary);
	}

	.project-body {
		padding: var(--space-5);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		flex: 1;
	}

	.project-meta {
		display: flex;
		gap: var(--space-2);
	}

	.project-name {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.project-ong {
		font-size: var(--text-xs);
		color: var(--text-muted);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.project-desc {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		line-height: 1.6;
		flex: 1;
	}

	.project-progress {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.project-raised {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--text-primary);
	}

	.project-goal {
		color: var(--text-muted);
		font-weight: 400;
	}

	.project-btn {
		width: 100%;
		justify-content: center;
		margin-top: auto;
	}

	.projects-cta {
		text-align: center;
	}

	/* --- Areas ---------------------- */
	.areas-section {
		background: var(--bg-secondary);
	}

	.areas-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-5);
	}

	.area-card {
		text-decoration: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.area-icon {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 0;
		border: 1px solid;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.area-name {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--text-primary);
	}

	.area-desc {
		font-size: var(--text-sm);
		color: var(--text-muted);
		line-height: 1.6;
		flex: 1;
	}

	.area-cta {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-primary);
		margin-top: auto;
	}

	/* --- CTA Section ----------------- */
	.cta-section {
		padding-block: var(--space-20);
		background: linear-gradient(180deg, #ffffff 0%, var(--blue-50) 100%);
	}

	.cta-wrapper {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-16);
		align-items: center;
	}

	.cta-images {
		display: grid;
		grid-template-columns: 1.3fr 1fr;
		gap: var(--space-4);
	}

	.cta-image-large,
	.cta-image-small {
		position: relative;
		border-radius: 0;
		overflow: hidden;
	}

	.cta-image-large { min-height: 320px; }

	.cta-image-stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.cta-image-small { flex: 1; min-height: 150px; }

	.cta-image-large img,
	.cta-image-small img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		position: absolute;
		inset: 0;
		transition: transform var(--duration-slow) var(--ease-out);
	}

	.cta-image-large:hover img,
	.cta-image-small:hover img { transform: scale(1.05); }

	.cta-image-overlay {
		position: absolute;
		bottom: 0; left: 0; right: 0;
		padding: var(--space-3) var(--space-4);
		background: linear-gradient(transparent, rgba(0,0,0,0.6));
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: 700;
		color: #ffffff;
		z-index: 1;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.cta-eyebrow {
		display: inline-block;
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--blue-500);
		margin-bottom: var(--space-3);
	}

	.cta-title {
		font-size: clamp(var(--text-3xl), 4vw, var(--text-5xl));
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.03em;
		margin-bottom: var(--space-5);
	}

	.cta-desc {
		font-size: var(--text-base);
		color: var(--text-secondary);
		line-height: 1.7;
		margin-bottom: var(--space-8);
		max-width: 480px;
	}

	.cta-stats-row {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		margin-bottom: var(--space-8);
	}

	.cta-stat { display: flex; flex-direction: column; }

	.cta-stat-value {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: 800;
		color: var(--text-primary);
	}

	.cta-stat-label {
		font-size: var(--text-sm);
		color: var(--text-muted);
	}

	.cta-stat-divider {
		width: 1px;
		height: 2.5rem;
		background: var(--border-default);
	}

	.cta-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		align-items: flex-start;
	}

	/* --- Animations ------------ */
	@keyframes pulse-live {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.7); }
	}

	/* --- Responsive ------------ */
	@media (max-width: 1024px) {
		.areas-grid { grid-template-columns: repeat(2, 1fr); }
		.projects-grid { grid-template-columns: repeat(2, 1fr); }
		.cta-wrapper { grid-template-columns: 1fr; gap: var(--space-10); }
		.cta-images { order: 2; }
		.cta-content { order: 1; }
	}

	@media (max-width: 768px) {
		.hero { min-height: 80vh; padding-block: var(--space-20) var(--space-12); }
		.finance-grid { grid-template-columns: 1fr; gap: 0; }
		.finance-divider { padding-block: 0; }
		.finance-divider-line { width: 80%; height: 1px; }
		.finance-block { padding: var(--space-6) var(--space-4); }
		.modal-content { padding: var(--space-5); }
		.modal-stats-bar { flex-direction: column; gap: var(--space-3); }
		.modal-table th, .modal-table td { padding: var(--space-2) var(--space-3); }
		.cta-images { grid-template-columns: 1fr 1fr; }
		.cta-image-large { min-height: 200px; }
		.cta-image-small { min-height: 96px; }
	}

	@media (max-width: 640px) {
		.areas-grid, .projects-grid { grid-template-columns: 1fr; }
		.hero-actions { flex-direction: column; }
		.hero-actions :global(.btn), .hero-actions .btn-outline-light { width: 100%; justify-content: center; }
		.hero-trust { flex-direction: column; align-items: center; gap: var(--space-2); }
		.livefeed-header { flex-direction: column; }
		.feed-tabs { gap: var(--space-1); }
		.cta-images { grid-template-columns: 1fr; }
		.cta-image-large { min-height: 180px; }
		.cta-stats-row { flex-direction: column; align-items: flex-start; gap: var(--space-4); }
		.cta-stat-divider { display: none; }
	}
</style>
