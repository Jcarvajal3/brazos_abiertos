<script lang="ts">
	import { page } from '$app/stores';
	import logo from '$lib/assets/logo_azul.jpeg';

	let scrolled = $state(false);
	let mobileMenuOpen = $state(false);

	$effect(() => {
		const path = $page.url.pathname;
		
		function handleScroll() {
			if (path.startsWith('/admin')) {
				const adminContent = document.querySelector('.admin-content');
				if (adminContent) {
					scrolled = adminContent.scrollTop > 20;
					return;
				}
			}
			scrolled = window.scrollY > 20;
		}

		window.addEventListener('scroll', handleScroll, { passive: true });
		
		let adminContentEl: Element | null = null;
		
		if (path.startsWith('/admin')) {
			const timeoutId = setTimeout(() => {
				adminContentEl = document.querySelector('.admin-content');
				if (adminContentEl) {
					adminContentEl.addEventListener('scroll', handleScroll, { passive: true });
					handleScroll();
				}
			}, 100);
			
			return () => {
				clearTimeout(timeoutId);
				window.removeEventListener('scroll', handleScroll);
				if (adminContentEl) {
					adminContentEl.removeEventListener('scroll', handleScroll);
				}
			};
		}

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});

	const navLinks = [
		{ href: '/',           label: 'Inicio' },
		{ href: '/proyectos',  label: 'Proyectos' },
	];
</script>

<header class="site-header" class:scrolled>
	<div class="container">
		<nav class="nav" aria-label="Navegacion principal">
			<!-- Logo -->
			<a href="/" class="logo" aria-label="Brazos Abiertos Fundacion — Inicio">
				<img src={logo} alt="Brazos Abiertos Fundacion" class="logo-img" />
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
				<a href="/donar" class="btn btn-primary nav-cta" id="header-donate-btn">
					Donar
				</a>

				<!-- Mobile Menu Toggle -->
				<button
					class="mobile-toggle"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					aria-label={mobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
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
					Donar
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
		background: rgba(255, 255, 255, 0.97);
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
		height: 56px;
		width: auto;
		object-fit: contain;
		transition: opacity var(--duration-fast) var(--ease-out);
	}

	.logo-img:hover {
		opacity: 0.85;
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
		border-radius: 0;
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		transition:
			color var(--duration-fast) var(--ease-out),
			border-color var(--duration-fast) var(--ease-out);
		border-bottom: 2px solid transparent;
	}

	.nav-link:hover {
		color: var(--text-primary);
		border-bottom-color: var(--blue-300);
	}

	.nav-link.active {
		color: var(--blue-500);
		border-bottom-color: var(--blue-500);
		font-weight: 600;
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
		border-radius: 0;
		background: rgba(0, 0, 0, 0.04);
		cursor: pointer;
		border: 1px solid rgba(0, 0, 0, 0.1);
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
		border-radius: 0;
		font-size: var(--text-base);
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		transition: all var(--duration-fast) var(--ease-out);
		border-left: 3px solid transparent;
	}

	.mobile-nav-link:hover { color: var(--text-primary); background: rgba(0, 0, 0, 0.02); }
	.mobile-nav-link.active { color: var(--blue-500); border-left-color: var(--blue-500); background: rgba(20, 96, 154, 0.04); }

	/* Responsive */
	@media (max-width: 768px) {
		.nav-links { display: none; }
		.mobile-toggle { display: flex; }
		.nav-cta { display: none; }
	}

	@media (max-width: 480px) {
		.logo-img { height: 42px; }
	}
</style>
