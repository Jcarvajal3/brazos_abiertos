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
	<div class="hero-orb orb-1" aria-hidden="true"></div>
	<div class="hero-orb orb-2" aria-hidden="true"></div>
	<div class="hero-orb orb-3" aria-hidden="true"></div>

	<div class="container">
		<div class="hero-inner">
			<div class="hero-content">
				<div class="animate-fade-in-up">
					<span class="hero-eyebrow">🚨 Emergencia Venezuela 2026</span>
				</div>

				<h1 class="hero-title animate-fade-in-up delay-100">
					Abre tus <span class="text-gradient">brazos</span><br />a Venezuela
				</h1>

				<p class="hero-subtitle animate-fade-in-up delay-200">
					El terremoto dejó miles de familias sin hogar, sin alimentos y sin esperanza.
					Tu donación llega directamente a quienes más lo necesitan, con transparencia total.
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
					<span class="trust-item">🔒 Pagos seguros con Stripe</span>
					<span class="trust-divider">·</span>
					<span class="trust-item">✓ 100% transparente</span>
					<span class="trust-divider">·</span>
					<span class="trust-item">⚡ Actualizado en tiempo real</span>
				</div>
			</div>

			<!-- Live mini-feed in hero -->
			{#if recentDonations.length > 0}
				<div class="hero-feed glass animate-fade-in delay-300" aria-label="Donaciones recientes">
					<div class="hero-feed-header">
						<span class="live-badge">
							<span class="live-dot"></span> EN VIVO
						</span>
						<span class="hero-feed-count">{data.stats.total_donations.toLocaleString()} donaciones</span>
					</div>
					<div class="hero-feed-list">
						{#each recentDonations.slice(0, 5) as d (d.id)}
							<div class="hero-feed-item">
								<div class="avatar avatar-orange" style="width:2rem;height:2rem;font-size:0.7rem;">
									{d.is_anonymous ? '?' : getInitials(getDonorDisplayName(d.is_anonymous, d.donor_name))}
								</div>
								<div class="hero-feed-info">
									<span class="hero-feed-name">{getDonorDisplayName(d.is_anonymous, d.donor_name)}</span>
									<span class="hero-feed-area">→ {d.area?.icon} {d.area?.name}</span>
								</div>
								<span class="hero-feed-amount">
									{formatCurrency(d.amount, d.currency)}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- ─── STATS ─────────────────────────────────────────────────── -->
<section class="section stats-section">
	<div class="container">
		<div class="stats-grid">
			<div class="stat-card animate-fade-in-up">
				<p class="stat-label">Total recaudado (USD)</p>
				<p class="stat-value">
					<span class="text-gradient">$<AnimatedCounter
						value={stats.total_raised_usd}
						format={(v) => Math.round(v).toLocaleString('en-US')}
					/></span>
				</p>
				<p class="stat-sub">Donaciones confirmadas</p>
			</div>

			{#if stats.total_raised_ves > 0}
				<div class="stat-card animate-fade-in-up delay-100">
					<p class="stat-label">Total recaudado (VES)</p>
					<p class="stat-value">
						<span class="text-gradient-gold">Bs.<AnimatedCounter
							value={stats.total_raised_ves}
							format={(v) => Math.round(v).toLocaleString('es-VE')}
						/></span>
					</p>
					<p class="stat-sub">Vía pago móvil y transferencia</p>
				</div>
			{:else}
				<div class="stat-card animate-fade-in-up delay-100">
					<p class="stat-label">Donantes únicos</p>
					<p class="stat-value">
						<span class="text-gradient-gold"><AnimatedCounter value={Number(stats.total_donors)} /></span>
					</p>
					<p class="stat-sub">Personas que ya ayudaron</p>
				</div>
			{/if}

			<div class="stat-card animate-fade-in-up delay-200">
				<p class="stat-label">Total donaciones</p>
				<p class="stat-value">
					<span class="text-gradient"><AnimatedCounter value={Number(stats.total_donations)} /></span>
				</p>
				<p class="stat-sub">Transacciones completadas</p>
			</div>
		</div>
	</div>
</section>

<!-- ─── AREAS ─────────────────────────────────────────────────── -->
{#if data.areas.length > 0}
<section class="section">
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
					<div class="area-icon" style="background: {area.color}1a; border-color: {area.color}40;">
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
<section class="section featured-section">
	<div class="container">
		<div class="section-heading">
			<span class="eyebrow">Proyectos destacados</span>
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
						<div class="project-img-placeholder" style="background:{project.area?.color ?? '#F97316'}18;">
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

						<a href="/donar?proyecto={project.id}" class="btn btn-outline btn-sm project-btn">
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

<!-- ─── LIVE FEED ──────────────────────────────────────────────── -->
<section class="section feed-section">
	<div class="container">
		<div class="feed-wrapper">
			<div class="feed-main">
				<div class="feed-top">
					<div>
						<span class="eyebrow">En vivo</span>
						<h2>Donaciones <span class="text-gradient">recientes</span></h2>
						<p style="color:var(--text-secondary); margin-top:var(--space-2);">Actualizadas automáticamente.</p>
					</div>
					<div class="live-indicator" aria-label="Actualización en tiempo real">
						<span class="live-dot"></span>
						<span>EN VIVO</span>
					</div>
				</div>

				{#if recentDonations.length === 0}
					<div class="feed-empty">
						<p>Sé el primero en donar 💛</p>
						<Button href="/donar" variant="primary">Hacer la primera donación</Button>
					</div>
				{:else}
					<div class="feed-list" id="donation-feed" aria-live="polite" aria-label="Lista de donaciones recientes">
						{#each recentDonations as d (d.id)}
							<div class="donation-entry">
								<div class="avatar avatar-orange">
									{d.is_anonymous ? '?' : getInitials(getDonorDisplayName(d.is_anonymous, d.donor_name))}
								</div>
								<div class="donation-info">
									<p class="donation-name">{getDonorDisplayName(d.is_anonymous, d.donor_name)}</p>
									<p class="donation-meta">→ {d.area?.icon} <strong>{d.area?.name}</strong>
										{#if d.confirmed_at}· {formatRelativeTime(d.confirmed_at)}{/if}
									</p>
								</div>
								<p class="donation-amount">{formatCurrency(d.amount, d.currency)}</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<aside class="feed-aside glass">
				<p class="feed-aside-icon">❤️</p>
				<h3>¿Listo para ayudar?</h3>
				<p>Únete a <strong>{Number(stats.total_donors).toLocaleString()}</strong> personas que ya están marcando la diferencia.</p>
				<Button href="/donar" variant="primary" size="lg">Donar ahora</Button>
				<Button href="/proyectos/registrar" variant="ghost" size="sm">¿Eres una ONG? Regístrate</Button>
			</aside>
		</div>
	</div>
</section>

<style>
	/* ─── Hero ──────────────────────── */
	.hero {
		position: relative;
		min-height: 94vh;
		display: flex;
		align-items: center;
		overflow: hidden;
		padding-block: var(--space-24) var(--space-16);
	}

	.hero-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
	.orb-1 { width: 700px; height: 700px; background: radial-gradient(circle, rgba(255,92,16,0.15) 0%, transparent 70%); top: -150px; left: -200px; animation: float 7s ease-in-out infinite; }
	.orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%); bottom: -80px; right: -100px; animation: float 9s ease-in-out infinite reverse; }
	.orb-3 { width: 350px; height: 350px; background: radial-gradient(circle, rgba(255,92,16,0.07) 0%, transparent 70%); top: 40%; left: 55%; animation: float 11s ease-in-out infinite 3s; }

	.hero-inner {
		position: relative; z-index: 1;
		display: grid;
		grid-template-columns: 1fr 360px;
		gap: var(--space-12);
		align-items: center;
	}

	.hero-eyebrow {
		display: inline-flex; align-items: center; gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-full);
		background: rgba(255, 92, 16, 0.12);
		border: 1px solid rgba(255, 92, 16, 0.3);
		font-family: var(--font-display);
		font-size: var(--text-sm); font-weight: 600;
		color: var(--orange-400); margin-bottom: var(--space-6);
	}

	.hero-title {
		font-size: clamp(3rem, 7vw, 5.5rem);
		font-weight: 900; line-height: 1.02;
		letter-spacing: -0.04em; margin-bottom: var(--space-6);
	}

	.hero-subtitle {
		font-size: clamp(var(--text-base), 2vw, var(--text-xl));
		color: var(--text-secondary); line-height: 1.7; max-width: 520px;
		margin-bottom: var(--space-10);
	}

	.hero-actions { display: flex; gap: var(--space-4); flex-wrap: wrap; margin-bottom: var(--space-8); }
	.hero-trust { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
	.trust-item { font-size: var(--text-sm); color: var(--text-muted); }
	.trust-divider { color: var(--border-default); }

	/* Hero Feed */
	.hero-feed {
		padding: var(--space-5);
		position: relative;
	}

	.hero-feed-header {
		display: flex; align-items: center; justify-content: space-between;
		margin-bottom: var(--space-4);
	}

	.live-badge {
		display: inline-flex; align-items: center; gap: var(--space-2);
		font-size: var(--text-xs); font-weight: 700; color: #f87171;
		letter-spacing: 0.08em;
	}

	.hero-feed-count { font-size: var(--text-xs); color: var(--text-muted); }

	.hero-feed-list { display: flex; flex-direction: column; gap: var(--space-3); }

	.hero-feed-item {
		display: flex; align-items: center; gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: rgba(255,255,255,0.03);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
	}

	.hero-feed-info { flex: 1; min-width: 0; }
	.hero-feed-name { font-size: var(--text-xs); font-weight: 600; color: var(--text-primary); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.hero-feed-area { font-size: 0.65rem; color: var(--text-muted); }
	.hero-feed-amount { font-family: var(--font-display); font-size: var(--text-sm); font-weight: 700; color: var(--gold-400); white-space: nowrap; }

	/* ─── Stats ─────────────────────── */
	.stats-section { padding-top: 0; }
	.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-6); }
	.stat-sub { font-size: var(--text-xs); color: var(--text-muted); margin-top: var(--space-1); }

	/* ─── Areas ──────────────────────── */
	.areas-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-5); }
	.area-card { text-decoration: none; display: flex; flex-direction: column; gap: var(--space-3); }
	.area-icon { width: 3.5rem; height: 3.5rem; border-radius: var(--radius-lg); border: 1px solid; display: flex; align-items: center; justify-content: center; }
	.area-name { font-family: var(--font-display); font-size: var(--text-lg); font-weight: 700; color: var(--text-primary); }
	.area-desc { font-size: var(--text-sm); color: var(--text-muted); line-height: 1.6; flex: 1; }
	.area-cta { display: inline-flex; align-items: center; gap: var(--space-1); font-size: var(--text-sm); font-weight: 600; color: var(--color-accent); margin-top: auto; }

	/* ─── Featured Projects ────────── */
	.featured-section { background: radial-gradient(ellipse at center, rgba(255,92,16,0.04) 0%, transparent 70%); }
	.projects-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-6); margin-bottom: var(--space-8); }
	.project-card { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
	.project-img { width: 100%; height: 180px; object-fit: cover; }
	.project-img-placeholder { height: 180px; display: flex; align-items: center; justify-content: center; }
	.project-body { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); flex: 1; }
	.project-meta { display: flex; gap: var(--space-2); }
	.project-name { font-family: var(--font-display); font-size: var(--text-lg); font-weight: 700; color: var(--text-primary); line-height: 1.3; }
	.project-ong { font-size: var(--text-xs); color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
	.project-desc { font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.6; flex: 1; }
	.project-progress { display: flex; flex-direction: column; gap: var(--space-2); }
	.project-raised { display: flex; justify-content: space-between; font-size: var(--text-xs); font-weight: 600; color: var(--text-primary); }
	.project-goal { color: var(--text-muted); font-weight: 400; }
	.project-btn { width: 100%; justify-content: center; margin-top: auto; }
	.projects-cta { text-align: center; }

	/* ─── Live Feed ───────────────── */
	.feed-wrapper { display: grid; grid-template-columns: 1fr 320px; gap: var(--space-10); align-items: start; }
	.feed-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-6); }
	.live-indicator { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-full); background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); font-size: var(--text-xs); font-weight: 700; color: #f87171; letter-spacing: 0.08em; white-space: nowrap; }
	.live-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; animation: pulse-live 1.4s ease-in-out infinite; }
	.feed-list { display: flex; flex-direction: column; gap: var(--space-3); }
	.donation-info { flex: 1; min-width: 0; }
	.donation-name { font-weight: 600; font-size: var(--text-sm); color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.donation-meta { font-size: var(--text-xs); color: var(--text-muted); margin-top: 2px; }
	.donation-meta strong { color: var(--text-secondary); }
	.donation-amount { font-family: var(--font-display); font-size: var(--text-base); font-weight: 700; color: var(--gold-400); white-space: nowrap; }

	.feed-empty { text-align: center; padding: var(--space-12); background: var(--bg-card); border-radius: var(--radius-xl); border: 1px dashed var(--border-default); display: flex; flex-direction: column; gap: var(--space-4); align-items: center; color: var(--text-muted); }

	.feed-aside { padding: var(--space-8); display: flex; flex-direction: column; align-items: center; text-align: center; gap: var(--space-4); position: sticky; top: calc(4.5rem + var(--space-6)); }
	.feed-aside-icon { font-size: 2.5rem; }
	.feed-aside h3 { font-size: var(--text-xl); font-weight: 800; }
	.feed-aside p { font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.6; }
	.feed-aside strong { color: var(--text-primary); }

	/* ─── Animations ───────────── */
	@keyframes pulse-live { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.7); } }
	@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

	/* ─── Responsive ──────────── */
	@media (max-width: 1024px) {
		.hero-inner { grid-template-columns: 1fr; }
		.hero-feed { display: none; }
		.areas-grid { grid-template-columns: repeat(2, 1fr); }
		.projects-grid { grid-template-columns: repeat(2, 1fr); }
		.feed-wrapper { grid-template-columns: 1fr; }
		.feed-aside { position: static; }
	}
	@media (max-width: 768px) {
		.stats-grid { grid-template-columns: 1fr; gap: var(--space-4); }
		.hero { min-height: 80vh; }
	}
	@media (max-width: 640px) {
		.areas-grid, .projects-grid { grid-template-columns: 1fr; }
		.hero-actions { flex-direction: column; }
		.hero-actions :global(.btn) { width: 100%; justify-content: center; }
	}
</style>
