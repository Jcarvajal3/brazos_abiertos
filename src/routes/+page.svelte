<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createSupabaseClient } from '$lib/supabase';
	import AnimatedCounter from '$lib/components/ui/AnimatedCounter.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { formatCurrency, getDonorDisplayName, formatRelativeTime } from '$lib/utils/formatters';
	import type { PageData } from './$types';
	import type { Donation } from '$lib/types';

	let { data }: { data: PageData } = $props();

	// Real-time feed state — starts with SSR data
	let recentDonations = $state(data.recentDonations ?? []);
	let stats = $state(data.stats);

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
					// Fetch the full donation with area relation
					const { data: newDonation } = await supabase
						.from('donations')
						.select('id, donor_name, is_anonymous, amount, currency, confirmed_at, area:areas(name, icon, slug)')
						.eq('id', payload.new.id)
						.single();

					if (newDonation) {
						const d = newDonation as any;
						// Prepend new donation and keep last 12
						recentDonations = [d, ...recentDonations].slice(0, 12);
						// Update stats
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
</script>

<svelte:head>
	<title>Brazos Abiertos con Venezuela — Dona y reconstruye vidas</title>
	<meta name="description" content="Plataforma de donaciones para las víctimas del terremoto de Venezuela 2026. Cada donación ayuda a reconstruir vidas. Dona ahora con Stripe, Pago Móvil o Transferencia." />
	<meta property="og:title" content="Brazos Abiertos con Venezuela" />
	<meta property="og:description" content="Dona para ayudar a las víctimas del terremoto de Venezuela 2026." />
</svelte:head>

<!-- ─── HERO ─────────────────────────────────────────────────── -->
<section class="hero">
	<div class="container">
		<div class="hero-inner">
			<div class="hero-content">
				<div class="animate-fade-in-up">
					<span class="hero-tag">🇻🇪 Emergencia Venezuela 2026</span>
				</div>

				<h1 class="hero-title animate-fade-in-up delay-100">
					Abre tus <span class="text-gradient">brazos</span><br />a Venezuela
				</h1>

				<p class="hero-subtitle animate-fade-in-up delay-200">
					El terremoto dejó miles de familias sin hogar, sin alimentos y sin esperanza.
					Tu donación llega directamente a quienes más lo necesitan, con total transparencia.
				</p>

				<div class="hero-actions animate-fade-in-up delay-300">
					<Button href="/donar" variant="primary" size="xl">
						❤️ Donar ahora
					</Button>
					<Button href="/proyectos" variant="outline" size="xl">
						Ver proyectos
					</Button>
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

			<!-- Hero image placeholder -->
			<div class="hero-image animate-fade-in delay-300">
				<div class="hero-image-placeholder">
					<span class="hero-image-icon">🤝</span>
					<p class="hero-image-text">Unidos por Venezuela</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ─── METRICS + RECENT DONATIONS ─────────────────────────── -->
<section class="section metrics-section">
	<div class="container">
		<div class="metrics-wrapper">
			<!-- Left: Metrics stacked vertically -->
			<div class="metrics-column">
				<h2 class="metrics-title">Impacto en <span class="text-gradient">tiempo real</span></h2>
				<p class="metrics-subtitle">Cada donación es transparente y verificable. Mira cómo crece el apoyo.</p>

				<div class="metrics-stack">
					<div class="metric-row animate-fade-in-up">
						<div class="metric-icon metric-icon-orange">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"/></svg>
						</div>
						<div class="metric-info">
							<span class="metric-label">Total recaudado (USD)</span>
							<span class="metric-value">
								$<AnimatedCounter
									value={stats.total_raised_usd}
									format={(v) => Math.round(v).toLocaleString('en-US')}
								/>
							</span>
						</div>
					</div>

					{#if stats.total_raised_ves > 0}
						<div class="metric-row animate-fade-in-up delay-100">
							<div class="metric-icon metric-icon-gold">
								<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a5.389 5.389 0 01-.421-.821H10a1 1 0 100-2H8.076a7.33 7.33 0 010-1H10a1 1 0 100-2H8.315c.128-.29.272-.56.421-.821z" clip-rule="evenodd"/></svg>
							</div>
							<div class="metric-info">
								<span class="metric-label">Total recaudado (VES)</span>
								<span class="metric-value metric-value-gold">
									Bs.<AnimatedCounter
										value={stats.total_raised_ves}
										format={(v) => Math.round(v).toLocaleString('es-VE')}
									/>
								</span>
							</div>
						</div>
					{/if}

					<div class="metric-row animate-fade-in-up delay-200">
						<div class="metric-icon metric-icon-green">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
						</div>
						<div class="metric-info">
							<span class="metric-label">Donantes únicos</span>
							<span class="metric-value"><AnimatedCounter value={Number(stats.total_donors)} /></span>
						</div>
					</div>

					<div class="metric-row animate-fade-in-up delay-300">
						<div class="metric-icon metric-icon-blue">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/></svg>
						</div>
						<div class="metric-info">
							<span class="metric-label">Total donaciones</span>
							<span class="metric-value"><AnimatedCounter value={Number(stats.total_donations)} /></span>
						</div>
					</div>
				</div>
			</div>

			<!-- Right: Recent donations table -->
			<div class="donations-panel animate-fade-in-up delay-200">
				<div class="donations-header">
					<h3 class="donations-title">Donaciones recientes</h3>
					<span class="live-badge">
						<span class="live-dot"></span> EN VIVO
					</span>
				</div>

				{#if recentDonations.length === 0}
					<div class="donations-empty">
						<p>Sé el primero en donar 💛</p>
						<Button href="/donar" variant="primary" size="sm">Hacer la primera donación</Button>
					</div>
				{:else}
					<div class="donations-list" id="donation-feed" aria-live="polite" aria-label="Lista de donaciones recientes">
						{#each recentDonations.slice(0, 8) as d (d.id)}
							<div class="donation-row">
								<div class="avatar avatar-orange" style="width:2.25rem;height:2.25rem;font-size:0.7rem;">
									{d.is_anonymous ? '?' : getInitials(getDonorDisplayName(d.is_anonymous, d.donor_name))}
								</div>
								<div class="donation-info">
									<span class="donation-name">{getDonorDisplayName(d.is_anonymous, d.donor_name)}</span>
									<span class="donation-meta">
										{d.area?.icon} {d.area?.name}
										{#if d.confirmed_at}
											<span class="donation-time">· {formatRelativeTime(d.confirmed_at)}</span>
										{/if}
									</span>
								</div>
								<span class="donation-amount">{formatCurrency(d.amount, d.currency)}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<!-- ─── AREAS / CATEGORIES ─────────────────────────────────────── -->
{#if data.areas.length > 0}
<section class="section areas-section">
	<div class="container">
		<div class="section-heading">
			<span class="eyebrow">Áreas de impacto</span>
			<h2>¿Dónde quieres <span class="text-gradient">ayudar?</span></h2>
			<p>Selecciona el área donde deseas dirigir tu donación. Cada contribución marca la diferencia.</p>
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
						<span style="font-size: 1.75rem;" role="img" aria-label={area.name}>{area.icon}</span>
					</div>
					<h3 class="area-name">{area.name}</h3>
					<p class="area-desc">{area.description}</p>
					<span class="area-cta">
						Donar aquí
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

<!-- ─── FEATURED PROJECTS ──────────────────────────────────────── -->
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
						<div class="project-img-placeholder" style="background:{project.area?.color ?? '#F97316'}12;">
							<span style="font-size:3rem;">{project.area?.icon ?? '🎯'}</span>
						</div>
					{/if}

					<div class="project-body">
						<div class="project-meta">
							<span class="badge badge-muted">{project.area?.icon} {project.area?.name}</span>
						</div>
						<h3 class="project-name">{project.name}</h3>
						<p class="project-ong">{project.ong_name}</p>
						<p class="project-desc">{project.description.slice(0, 120)}…</p>

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
			<Button href="/proyectos" variant="outline">Ver todos los proyectos →</Button>
		</div>
	</div>
</section>
{/if}

<!-- ─── CTA DONAR CON FOTOS ─────────────────────────────────────── -->
<section class="cta-section">
	<div class="container">
		<div class="cta-wrapper">
			<!-- Left: Real photos grid -->
			<div class="cta-images animate-fade-in-up">
				<div class="cta-image-large">
					<img src="/images/cta-rebuilding.png" alt="Comunidad reconstruyendo hogares tras el terremoto" loading="lazy" />
					<span class="cta-image-overlay">Reconstrucción</span>
				</div>
				<div class="cta-image-stack">
					<div class="cta-image-small">
						<img src="/images/cta-volunteers.png" alt="Voluntarios distribuyendo alimentos" loading="lazy" />
						<span class="cta-image-overlay">Alimentación</span>
					</div>
					<div class="cta-image-small">
						<img src="/images/cta-healthcare.png" alt="Profesional de salud atendiendo a niños" loading="lazy" />
						<span class="cta-image-overlay">Salud</span>
					</div>
				</div>
			</div>

			<!-- Right: CTA content -->
			<div class="cta-content animate-fade-in-up delay-200">
				<span class="cta-eyebrow">Tu apoyo importa</span>
				<h2 class="cta-title">Cada donación<br />reconstruye una <span class="text-gradient">vida</span></h2>
				<p class="cta-desc">
					Miles de familias venezolanas necesitan tu ayuda ahora. Tu contribución,
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
					<Button href="/donar" variant="primary" size="xl">❤️ Donar ahora</Button>
					<Button href="/proyectos/registrar" variant="ghost" size="sm">¿Eres una ONG? Regístrate</Button>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* ─── Hero ──────────────────────────────── */
	.hero {
		position: relative;
		min-height: 90vh;
		display: flex;
		align-items: center;
		overflow: hidden;
		padding-block: var(--space-24) var(--space-16);
		background: linear-gradient(180deg, var(--orange-50) 0%, #ffffff 60%);
	}

	.hero-inner {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-12);
		align-items: center;
	}

	.hero-tag {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-full);
		background: var(--orange-50);
		border: 1px solid var(--orange-200);
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--orange-700);
		margin-bottom: var(--space-6);
	}

	.hero-title {
		font-size: clamp(2.75rem, 6vw, 4.5rem);
		font-weight: 900;
		line-height: 1.05;
		letter-spacing: -0.04em;
		margin-bottom: var(--space-6);
		color: var(--text-primary);
	}

	.hero-subtitle {
		font-size: clamp(var(--text-base), 2vw, var(--text-xl));
		color: var(--text-secondary);
		line-height: 1.7;
		max-width: 520px;
		margin-bottom: var(--space-10);
	}

	.hero-actions {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
		margin-bottom: var(--space-8);
	}

	/* Trust badges */
	.hero-trust {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.trust-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-secondary);
		font-weight: 500;
	}

	.trust-badge svg {
		color: var(--orange-500);
		flex-shrink: 0;
	}

	/* Hero image placeholder */
	.hero-image {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hero-image-placeholder {
		width: 100%;
		aspect-ratio: 4/3;
		border-radius: var(--radius-2xl);
		background: linear-gradient(135deg, var(--orange-50) 0%, var(--orange-100) 50%, var(--gold-50) 100%);
		border: 1px solid var(--orange-200);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
	}

	.hero-image-icon {
		font-size: 4rem;
	}

	.hero-image-text {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--orange-700);
		opacity: 0.7;
	}

	/* ─── Metrics + Donations ────────────── */
	.metrics-section {
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-subtle);
		border-bottom: 1px solid var(--border-subtle);
	}

	.metrics-wrapper {
		display: grid;
		grid-template-columns: 1fr 1.1fr;
		gap: var(--space-12);
		align-items: start;
	}

	.metrics-title {
		font-size: var(--text-3xl);
		font-weight: 800;
		margin-bottom: var(--space-3);
		letter-spacing: -0.03em;
	}

	.metrics-subtitle {
		font-size: var(--text-base);
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: var(--space-8);
	}

	.metrics-stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.metric-row {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-5);
		background: var(--bg-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-sm);
		transition: box-shadow var(--duration-normal) var(--ease-out),
		            transform var(--duration-normal) var(--ease-out);
	}

	.metric-row:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	.metric-icon {
		width: 2.75rem;
		height: 2.75rem;
		border-radius: var(--radius-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.metric-icon svg {
		color: white;
	}

	.metric-icon-orange { background: linear-gradient(135deg, var(--orange-400), var(--orange-500)); }
	.metric-icon-gold   { background: linear-gradient(135deg, var(--gold-400), var(--gold-500)); }
	.metric-icon-green  { background: linear-gradient(135deg, #34d399, #16a34a); }
	.metric-icon-blue   { background: linear-gradient(135deg, #60a5fa, #2563eb); }

	.metric-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.metric-label {
		font-size: var(--text-xs);
		color: var(--text-muted);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.metric-value {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.metric-value-gold {
		color: var(--gold-700);
	}

	/* Donations panel */
	.donations-panel {
		background: var(--bg-card);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-md);
		overflow: hidden;
	}

	.donations-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid var(--border-subtle);
	}

	.donations-title {
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--text-primary);
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
		border-radius: var(--radius-full);
	}

	.live-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #dc2626;
		animation: pulse-live 1.4s ease-in-out infinite;
	}

	.donations-list {
		padding: var(--space-3);
		max-height: 480px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.donation-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-lg);
		transition: background var(--duration-fast) var(--ease-out);
	}

	.donation-row:hover {
		background: var(--bg-secondary);
	}

	.donation-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.donation-name {
		font-weight: 600;
		font-size: var(--text-sm);
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.donation-meta {
		font-size: var(--text-xs);
		color: var(--text-muted);
	}

	.donation-time {
		color: var(--text-muted);
	}

	.donation-amount {
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--orange-600);
		white-space: nowrap;
	}

	.donations-empty {
		text-align: center;
		padding: var(--space-12);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		align-items: center;
		color: var(--text-muted);
	}

	/* ─── Projects ────────────────── */
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

	/* ─── Areas ──────────────────────── */
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
		border-radius: var(--radius-lg);
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
		color: var(--color-accent);
		margin-top: auto;
	}

	/* ─── CTA Section ────────────────── */
	.cta-section {
		padding-block: var(--space-20);
		background: linear-gradient(180deg, #ffffff 0%, var(--orange-50) 100%);
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
		border-radius: var(--radius-2xl);
		overflow: hidden;
	}

	.cta-image-large {
		min-height: 320px;
	}

	.cta-image-stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.cta-image-small {
		flex: 1;
		min-height: 150px;
	}

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
	.cta-image-small:hover img {
		transform: scale(1.05);
	}

	.cta-image-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: var(--space-3) var(--space-4);
		background: linear-gradient(transparent, rgba(0,0,0,0.6));
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: 700;
		color: #ffffff;
		z-index: 1;
	}

	.cta-eyebrow {
		display: inline-block;
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--orange-500);
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

	.cta-stat {
		display: flex;
		flex-direction: column;
	}

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

	/* ─── Animations ───────────── */
	@keyframes pulse-live {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.7); }
	}

	/* ─── Responsive ──────────── */
	@media (max-width: 1024px) {
		.hero-inner { grid-template-columns: 1fr; }
		.hero-image { display: none; }
		.metrics-wrapper { grid-template-columns: 1fr; gap: var(--space-8); }
		.areas-grid { grid-template-columns: repeat(2, 1fr); }
		.projects-grid { grid-template-columns: repeat(2, 1fr); }
		.cta-wrapper { grid-template-columns: 1fr; gap: var(--space-10); }
		.cta-images { order: 2; }
		.cta-content { order: 1; }
	}

	@media (max-width: 768px) {
		.hero { min-height: 80vh; padding-block: var(--space-20) var(--space-12); }
		.cta-images { grid-template-columns: 1fr 1fr; }
		.cta-image-large { min-height: 200px; }
		.cta-image-small { min-height: 96px; }
	}

	@media (max-width: 640px) {
		.areas-grid, .projects-grid { grid-template-columns: 1fr; }
		.hero-actions { flex-direction: column; }
		.hero-actions :global(.btn) { width: 100%; justify-content: center; }
		.hero-trust { flex-direction: column; align-items: flex-start; gap: var(--space-2); }
		.cta-images { grid-template-columns: 1fr; }
		.cta-image-large { min-height: 180px; }
		.cta-stats-row { flex-direction: column; align-items: flex-start; gap: var(--space-4); }
		.cta-stat-divider { display: none; }
	}
</style>
