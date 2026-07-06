<script lang="ts">
	import { page } from '$app/stores';

	let scrolled = $state(false);
	let mobileMenuOpen = $state(false);

	$effect(() => {
		function handleScroll() { scrolled = window.scrollY > 20; }
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	});

	const navLinks = [
		{ href: '/',           label: 'Inicio' },
		{ href: '/proyectos',  label: 'Proyectos' },
		{ href: '/proyectos/registrar', label: 'Registrar ONG' },
	];
</script>

<header class="site-header" class:scrolled>
	<div class="container">
		<nav class="nav" aria-label="Navegación principal">
			<!-- Logo -->
			<a href="/" class="logo" aria-label="Brazos Abiertos con Venezuela — Inicio">
				<div class="logo-icon">
					<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
						<rect width="40" height="40" rx="10" fill="#090910"/>
						<path d="M6 24C6 14 13 11 20 11C27 11 34 14 34 24" stroke="url(#h1)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
						<path d="M20 28L13 21C11 19 11 16 13 14C15 12 18 13 20 15C22 13 25 12 27 14C29 16 29 19 27 21Z" fill="url(#h2)"/>
						<defs>
							<linearGradient id="h1" x1="6" y1="24" x2="34" y2="11" gradientUnits="userSpaceOnUse">
								<stop stop-color="#FF5C10"/>
								<stop offset="1" stop-color="#FBBF24"/>
							</linearGradient>
							<linearGradient id="h2" x1="13" y1="12" x2="27" y2="28" gradientUnits="userSpaceOnUse">
								<stop stop-color="#FF5C10"/>
								<stop offset="1" stop-color="#FBBF24"/>
							</linearGradient>
						</defs>
					</svg>
				</div>
				<div class="logo-text">
					<span class="logo-name">Brazos Abiertos</span>
					<span class="logo-sub">con Venezuela</span>
				</div>
			</a>

			<!-- Desktop Navigation -->
			<ul class="nav-links" role="list">
				{#each navLinks as link}
					<li>
						<a
							href={link.href}
							class="nav-link"
							class:active={$page.url.pathname === link.href}
							aria-current={$page.url.pathname === link.href ? 'page' : undefined}
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>

			<!-- CTA -->
			<div class="nav-actions">
				<a href="/donar" class="btn btn-primary btn-sm nav-cta" id="header-donate-btn">
					<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
						<path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
					</svg>
					Donar ahora
				</a>

				<!-- Mobile Menu Toggle -->
				<button
					class="mobile-toggle"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
					aria-expanded={mobileMenuOpen}
				>
					<span class="bar" class:open={mobileMenuOpen}></span>
					<span class="bar" class:open={mobileMenuOpen}></span>
					<span class="bar" class:open={mobileMenuOpen}></span>
				</button>
			</div>
		</nav>
	</div>

	<!-- Mobile Menu -->
	{#if mobileMenuOpen}
		<div class="mobile-menu" id="mobile-nav">
			<div class="container">
				<ul class="mobile-nav-links" role="list">
					{#each navLinks as link}
						<li>
							<a
								href={link.href}
								class="mobile-nav-link"
								class:active={$page.url.pathname === link.href}
								onclick={() => (mobileMenuOpen = false)}
							>
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
				<a href="/donar" class="btn btn-primary" style="width:100%; justify-content:center;" onclick={() => (mobileMenuOpen = false)}>
					❤️ Donar ahora
				</a>
			</div>
		</div>
	{/if}
</header>

<style>
	.site-header {
		position: fixed;
		top: 0; left: 0; right: 0;
		z-index: var(--z-sticky);
		border-bottom: 1px solid transparent;
		transition:
			background var(--duration-normal) var(--ease-out),
			border-color var(--duration-normal) var(--ease-out),
			backdrop-filter var(--duration-normal) var(--ease-out);
	}

	.site-header.scrolled {
		background: rgba(9, 9, 16, 0.88);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-color: var(--border-subtle);
	}

	.nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 4.5rem;
		gap: var(--space-6);
	}

	/* Logo */
	.logo {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		text-decoration: none;
		flex-shrink: 0;
	}

	.logo-icon {
		border-radius: 10px;
		overflow: hidden;
		flex-shrink: 0;
	}

	.logo-text {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}

	.logo-name {
		font-family: var(--font-display);
		font-size: var(--text-base);
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.logo-sub {
		font-family: var(--font-body);
		font-size: var(--text-xs);
		font-weight: 400;
		color: var(--text-muted);
	}

	/* Nav Links */
	.nav-links {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		list-style: none;
		flex: 1;
		justify-content: center;
	}

	.nav-link {
		display: block;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		transition:
			color var(--duration-fast) var(--ease-out),
			background var(--duration-fast) var(--ease-out);
	}

	.nav-link:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.06);
	}

	.nav-link.active {
		color: var(--color-accent);
		background: rgba(251, 191, 36, 0.08);
	}

	/* Actions */
	.nav-actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-shrink: 0;
	}

	.nav-cta {
		display: flex;
	}

	/* Mobile Toggle */
	.mobile-toggle {
		display: none;
		flex-direction: column;
		justify-content: center;
		gap: 5px;
		width: 2.25rem;
		height: 2.25rem;
		padding: 0.4rem;
		border-radius: var(--radius-md);
		background: rgba(255, 255, 255, 0.06);
		cursor: pointer;
		border: 1px solid var(--border-subtle);
	}

	.bar {
		width: 100%;
		height: 2px;
		background: var(--text-secondary);
		border-radius: 2px;
		transition: all var(--duration-normal) var(--ease-out);
		transform-origin: center;
	}

	.mobile-toggle:hover .bar { background: var(--text-primary); }

	/* Mobile Menu */
	.mobile-menu {
		background: rgba(9, 9, 16, 0.96);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-top: 1px solid var(--border-subtle);
		padding-block: var(--space-4);
		animation: fade-in var(--duration-normal) var(--ease-out);
	}

	.mobile-nav-links {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		margin-bottom: var(--space-4);
	}

	.mobile-nav-link {
		display: block;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--text-base);
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.mobile-nav-link:hover { color: var(--text-primary); background: rgba(255,255,255,0.06); }
	.mobile-nav-link.active { color: var(--color-accent); background: rgba(251,191,36,0.08); }

	/* Responsive */
	@media (max-width: 768px) {
		.nav-links { display: none; }
		.mobile-toggle { display: flex; }
		.nav-cta { display: none; }
	}

	@media (max-width: 480px) {
		.logo-text { display: none; }
	}
</style>
