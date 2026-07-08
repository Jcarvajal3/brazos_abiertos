<script lang="ts">
	import { APP_CONFIG } from '$lib/utils/constants';
	import logo from '$lib/assets/logo_azul.jpeg';

	const currentYear = new Date().getFullYear();

	const footerLinks = [
		{
			title: 'Donar',
			links: [
				{ href: '/donar', label: 'Hacer una donacion' },
				{ href: '/proyectos', label: 'Ver proyectos' },
			]
		},
		{
			title: 'Areas de ayuda',
			links: [
				{ href: '/donar?area=infraestructura', label: 'Infraestructura' },
				{ href: '/donar?area=salud',           label: 'Salud' },
				{ href: '/donar?area=alimentacion',    label: 'Alimentacion' },
				{ href: '/donar?area=educacion',       label: 'Educacion' },
			]
		},
		{
			title: 'Informacion',
			links: [
				{ href: '/transparencia', label: 'Transparencia' },
				{ href: '/terminos',      label: 'Terminos de uso' },
				{ href: '/privacidad',    label: 'Privacidad' },
				{ href: '/contacto',      label: 'Contacto' },
			]
		}
	];
</script>

<footer class="site-footer">
	<div class="footer-accent" aria-hidden="true"></div>

	<div class="container">
		<div class="footer-grid">
			<!-- Brand -->
			<div class="footer-brand">
				<a href="/" class="footer-logo" aria-label="Brazos Abiertos Fundacion">
					<img src={logo} alt="Brazos Abiertos Fundacion" class="footer-logo-img" />
				</a>
				<p class="footer-tagline">
					Unidos por Venezuela. Cada donacion reconstruye una vida, una familia, una comunidad.
				</p>
				<p class="footer-contact">
					<a href="mailto:{APP_CONFIG.email}">{APP_CONFIG.email}</a>
				</p>
			</div>

			<!-- Links -->
			{#each footerLinks as section}
				<div class="footer-section">
					<h3 class="footer-section-title">{section.title}</h3>
					<ul class="footer-links" role="list">
						{#each section.links as link}
							<li>
								<a href={link.href} class="footer-link">{link.label}</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<hr class="divider" />

		<div class="footer-bottom">
			<p class="footer-copy">
				{currentYear} Brazos Abiertos Fundacion. Todos los derechos reservados.
			</p>
			<p class="footer-secure">
				<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style="opacity:0.5">
					<path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
				</svg>
				Pagos seguros — Stripe — Datos protegidos
			</p>
		</div>
	</div>
</footer>

<style>
	.site-footer {
		position: relative;
		margin-top: var(--space-20);
		background-color: var(--blue-900);
		color: rgba(255, 255, 255, 0.7);
		padding-top: var(--space-16);
		padding-bottom: var(--space-8);
	}

	.footer-accent {
		position: absolute;
		top: 0; left: 0; right: 0;
		height: 3px;
		background: linear-gradient(90deg, var(--blue-500), var(--blue-300));
	}

	.footer-grid {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: var(--space-12);
		margin-bottom: var(--space-12);
	}

	/* Brand */
	.footer-logo {
		display: flex;
		align-items: center;
		text-decoration: none;
		margin-bottom: var(--space-4);
	}

	.footer-logo-img {
		height: 42px;
		width: auto;
		object-fit: contain;
		filter: invert(1) grayscale(1) brightness(2.5);
		mix-blend-mode: screen;
		opacity: 0.9;
		transition: opacity var(--duration-fast) var(--ease-out);
	}

	.footer-logo-img:hover {
		opacity: 1;
	}

	.footer-tagline {
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.5);
		line-height: 1.7;
		margin-bottom: var(--space-4);
		max-width: 260px;
	}

	.footer-contact a {
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.6);
		text-decoration: none;
		transition: color var(--duration-fast) var(--ease-out);
	}
	.footer-contact a:hover { color: #ffffff; }

	/* Footer sections */
	.footer-section-title {
		font-size: var(--text-xs);
		font-weight: 700;
		font-family: var(--font-display);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.35);
		margin-bottom: var(--space-4);
	}

	.footer-links {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.footer-link {
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.6);
		text-decoration: none;
		transition: color var(--duration-fast) var(--ease-out);
	}
	.footer-link:hover { color: #ffffff; }

	/* Divider */
	.divider {
		border: none;
		height: 1px;
		background: rgba(255, 255, 255, 0.1);
		margin-bottom: var(--space-6);
	}

	/* Bottom */
	.footer-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-4);
	}

	.footer-copy {
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.3);
	}

	.footer-secure {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--text-xs);
		color: rgba(255, 255, 255, 0.3);
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.footer-grid { grid-template-columns: 1fr 1fr; gap: var(--space-8); }
		.footer-brand { grid-column: 1 / -1; }
	}

	@media (max-width: 640px) {
		.footer-grid { grid-template-columns: 1fr; gap: var(--space-6); }
		.footer-bottom { flex-direction: column; align-items: flex-start; }
	}
</style>
