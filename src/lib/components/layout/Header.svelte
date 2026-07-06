<script lang="ts">
	import { page } from '$app/stores';
	import logo from '$lib/assets/logo.png';

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
				<img src={logo} alt="Brazos Abiertos con Venezuela" class="logo-img" />
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
			box-shadow var(--duration-normal) var(--ease-out),
			backdrop-filter var(--duration-normal) var(--ease-out);
	}

	.site-header.scrolled {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-color: rgba(0, 0, 0, 0.08);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
		text-decoration: none;
		flex-shrink: 0;
	}

	.logo-img {
		height: 64px;
		width: auto;
		object-fit: contain;
		mix-blend-mode: multiply;
		transition: transform var(--duration-fast) var(--ease-out);
	}

	.logo-img:hover {
		transform: scale(1.02);
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
		color: #4a5568;
		text-decoration: none;
		transition:
			color var(--duration-fast) var(--ease-out),
			background var(--duration-fast) var(--ease-out);
	}

	.nav-link:hover {
		color: #1a1a2e;
		background: rgba(0, 0, 0, 0.04);
	}

	.nav-link.active {
		color: var(--orange-500);
		background: rgba(255, 92, 16, 0.08);
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
		background: rgba(0, 0, 0, 0.04);
		cursor: pointer;
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.bar {
		width: 100%;
		height: 2px;
		background: #4a5568;
		border-radius: 2px;
		transition: all var(--duration-normal) var(--ease-out);
		transform-origin: center;
	}

	.mobile-toggle:hover .bar { background: #1a1a2e; }

	/* Mobile Menu */
	.mobile-menu {
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-top: 1px solid rgba(0, 0, 0, 0.08);
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
		color: #4a5568;
		text-decoration: none;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.mobile-nav-link:hover { color: #1a1a2e; background: rgba(0, 0, 0, 0.04); }
	.mobile-nav-link.active { color: var(--orange-500); background: rgba(255, 92, 16, 0.08); }

	/* Responsive */
	@media (max-width: 768px) {
		.nav-links { display: none; }
		.mobile-toggle { display: flex; }
		.nav-cta { display: none; }
	}

	@media (max-width: 480px) {
		.logo-img { height: 48px; }
	}
</style>
