<script lang="ts">
	import { goto } from '$app/navigation';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { formatCurrency } from '$lib/utils/formatters';
	import { getAreaIconName } from '$lib/utils/iconMap';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let activeSlug = $state(data.activeAreaSlug ?? '');

	function filterByArea(slug: string) {
		activeSlug = slug === activeSlug ? '' : slug;
		const params = slug && slug !== activeSlug ? `?area=${slug}` : '/proyectos';
		goto(params === '/proyectos' ? '/proyectos' : `/proyectos${params}`, { replaceState: true, keepFocus: true });
	}
</script>

<svelte:head>
	<title>Proyectos — Brazos Abiertos con Venezuela</title>
	<meta name="description" content="Descubre los proyectos y ONGs que trabajan en Venezuela para ayudar a las víctimas del terremoto. Elige un proyecto y dona directamente." />
</svelte:head>

<div class="projects-page">
	<div class="container">

		<!-- Header -->
		<div class="page-header">
			<div class="section-heading">
				<span class="eyebrow">Organizaciones verificadas</span>
				<h1>Proyectos que <span class="text-gradient">necesitan</span> tu apoyo</h1>
				<p>Todos los proyectos han sido revisados y aprobados por nuestro equipo. Tu donación va directamente a la organización elegida.</p>
			</div>


		</div>

		<!-- Area filter bar -->
		{#if data.areas.length > 0}
			<div class="filter-bar" role="navigation" aria-label="Filtrar por área">
				<button
					class="filter-chip"
					class:active={!activeSlug}
					onclick={() => filterByArea('')}
					id="filter-all"
				>
					🌐 Todos
				</button>
				{#each data.areas as area}
					<button
						class="filter-chip"
						class:active={activeSlug === area.slug}
						onclick={() => filterByArea(area.slug)}
						id="filter-{area.slug}"
						style="--chip-color: {area.color}"
					>
						<span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;">{getAreaIconName(area.icon)}</span> {area.name}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Projects Grid -->
		{#if data.projects.length === 0}
			<div class="empty-state">
				<p class="empty-icon">🔍</p>
				<h2>No hay proyectos en esta área</h2>
				<p>Pronto habrá proyectos disponibles para {activeSlug ? data.areas.find(a => a.slug === activeSlug)?.name ?? 'esta área' : 'esta plataforma'}.</p>
			</div>
		{:else}
			<p class="results-count">
				{data.projects.length} {data.projects.length === 1 ? 'proyecto encontrado' : 'proyectos encontrados'}
				{#if activeSlug}en <strong>{data.areas.find(a => a.slug === activeSlug)?.name}</strong>{/if}
			</p>

			<div class="projects-grid" id="projects-list">
				{#each data.projects as project, i}
					{@const pct = project.goal_amount ? Math.min(100, (project.current_amount / project.goal_amount) * 100) : null}
					<article class="project-card card card-hover animate-fade-in-up" style="animation-delay:{i * 60}ms">
						<!-- Project Image -->
						{#if project.cover_image_url}
							<img src={project.cover_image_url} alt={project.name} class="project-img" loading="lazy" />
						{:else}
							<div class="project-img-placeholder" style="background:{project.area?.color ?? '#14609A'}18;">
								<span class="material-symbols-outlined" style="font-size:3.5rem;" role="img" aria-label={project.area?.name}>{getAreaIconName(project.area?.icon)}</span>
							</div>
						{/if}

						<div class="project-body">
							<!-- Area badge -->
							<div class="project-badges">
								<Badge variant="muted">
									<span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;">{getAreaIconName(project.area?.icon)}</span> {project.area?.name}
								</Badge>
							</div>

							<h2 class="project-name">{project.name}</h2>
							<p class="project-ong">{project.ong_name}</p>
							<p class="project-desc">{project.description.slice(0, 140)}…</p>

							<!-- Progress -->
							{#if pct !== null && project.goal_amount}
								<div class="project-progress">
									<ProgressBar percent={pct} showPercent={false} height={6} />
									<div class="project-stats">
										<div>
											<p class="project-raised-label">Recaudado</p>
											<p class="project-raised-val">{formatCurrency(project.current_amount, 'USD')}</p>
										</div>
										<div style="text-align:right;">
											<p class="project-raised-label">Meta</p>
											<p class="project-raised-val">{formatCurrency(project.goal_amount, 'USD')}</p>
										</div>
									</div>
								</div>
							{:else}
								<div class="project-raised-simple">
									<span class="project-raised-label">Total recaudado:</span>
									<span class="project-raised-val">{formatCurrency(project.current_amount, 'USD')}</span>
								</div>
							{/if}

							<!-- CTA -->
							<a
								href="/donar?area={project.area?.slug}&proyecto={project.id}"
								class="btn btn-primary project-donate-btn"
								id="donate-project-{project.id}"
							>
								❤️ Donar a este proyecto
							</a>
						</div>
					</article>
				{/each}
			</div>
		{/if}


	</div>
</div>

<style>
	.projects-page { padding-block: var(--space-12) var(--space-20); }

	.page-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-8);
		margin-bottom: var(--space-8);
	}
	.page-header .section-heading { text-align: left; margin-bottom: 0; }
	.page-header .section-heading h1 {
		font-size: clamp(var(--text-3xl), 5vw, var(--text-5xl));
		letter-spacing: -0.03em;
	}

	/* Filter bar */
	.filter-bar {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
		margin-bottom: var(--space-6);
	}

	.filter-chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: 500;
		font-family: var(--font-body);
		background: var(--bg-elevated);
		border: 1px solid var(--border-subtle);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
		white-space: nowrap;
	}
	.filter-chip:hover {
		border-color: var(--chip-color, var(--color-primary));
		color: var(--text-primary);
		background: color-mix(in srgb, var(--chip-color, var(--color-primary)) 10%, var(--bg-elevated));
	}
	.filter-chip.active {
		background: color-mix(in srgb, var(--chip-color, var(--color-primary)) 15%, var(--bg-elevated));
		border-color: var(--chip-color, var(--color-primary));
		color: var(--text-primary);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--chip-color, var(--color-primary)) 25%, transparent);
	}

	/* Results count */
	.results-count {
		font-size: var(--text-sm);
		color: var(--text-muted);
		margin-bottom: var(--space-6);
	}
	.results-count strong { color: var(--text-secondary); }

	/* Projects grid */
	.projects-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-6);
		margin-bottom: var(--space-12);
	}

	.project-card { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
	.project-img { width: 100%; height: 200px; object-fit: cover; }
	.project-img-placeholder { height: 200px; display: flex; align-items: center; justify-content: center; }
	.project-body { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); flex: 1; }
	.project-badges { display: flex; gap: var(--space-2); }
	.project-name { font-family: var(--font-display); font-size: var(--text-xl); font-weight: 700; color: var(--text-primary); line-height: 1.3; }
	.project-ong { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
	.project-desc { font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.65; flex: 1; }

	.project-progress { display: flex; flex-direction: column; gap: var(--space-2); }
	.project-stats { display: flex; justify-content: space-between; }
	.project-raised-label { font-size: var(--text-xs); color: var(--text-muted); }
	.project-raised-val { font-family: var(--font-display); font-size: var(--text-sm); font-weight: 700; color: var(--text-primary); }
	.project-raised-simple { display: flex; align-items: center; gap: var(--space-2); }

	.project-donate-btn { width: 100%; justify-content: center; margin-top: auto; }

	/* Empty state */
	.empty-state {
		text-align: center;
		padding: var(--space-20) var(--space-8);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}
	.empty-icon { font-size: 4rem; }
	.empty-state h2 { font-size: var(--text-2xl); }
	.empty-state p { color: var(--text-muted); max-width: 400px; }

	/* Bottom CTA */
	.bottom-cta {
		padding: var(--space-10);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-8);
	}
	.bottom-cta-content h2 { font-size: var(--text-2xl); font-weight: 800; margin-bottom: var(--space-2); }
	.bottom-cta-content p { color: var(--text-secondary); font-size: var(--text-base); max-width: 480px; }

	@media (max-width: 1024px) { .projects-grid { grid-template-columns: repeat(2, 1fr); } }
	@media (max-width: 768px) {
		.page-header { flex-direction: column; align-items: flex-start; }
		.bottom-cta { flex-direction: column; text-align: center; }
		.bottom-cta-content p { max-width: 100%; }
	}
	@media (max-width: 640px) { .projects-grid { grid-template-columns: 1fr; } }
</style>
