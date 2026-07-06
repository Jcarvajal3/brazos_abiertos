<script lang="ts">
	import { APP_CONFIG } from '$lib/utils/constants';
	import logo from '$lib/assets/logo.png';

	const currentYear = new Date().getFullYear();

	const footerLinks = [
		{
			title: 'Donar',
			links: [
				{ href: '/donar', label: 'Hacer una donación' },
				{ href: '/proyectos', label: 'Ver proyectos' },
				{ href: '/proyectos/registrar', label: 'Registrar ONG' },
			]
		},
		{
			title: 'Áreas de ayuda',
			links: [
				{ href: '/donar?area=infraestructura', label: '🏗️ Infraestructura' },
				{ href: '/donar?area=salud',           label: '🏥 Salud' },
				{ href: '/donar?area=alimentacion',    label: '🍱 Alimentación' },
				{ href: '/donar?area=educacion',       label: '📚 Educación' },
			]
		},
		{
			title: 'Información',
			links: [
				{ href: '/transparencia', label: 'Transparencia' },
				{ href: '/terminos',      label: 'Términos de uso' },
				{ href: '/privacidad',    label: 'Privacidad' },
				{ href: '/contacto',      label: 'Contacto' },
			]
		}
	];
</script>

<footer class="site-footer">
	<!-- Divider glow -->
	<div class="footer-glow" aria-hidden="true"></div>

	<div class="container">
		<div class="footer-grid">
			<!-- Brand -->
			<div class="footer-brand">
				<a href="/" class="footer-logo" aria-label="Brazos Abiertos con Venezuela">
					<img src={logo} alt="Brazos Abiertos con Venezuela" class="footer-logo-img" />
				</a>
				<p class="footer-tagline">
					Unidos por Venezuela. Cada donación reconstruye una vida, una familia, una comunidad.
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
				© {currentYear} Brazos Abiertos con Venezuela. Todos los derechos reservados.
			</p>
			<p class="footer-secure">
				<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style="opacity:0.5">
					<path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
				</svg>
				Pagos seguros · Stripe · Datos protegidos
			</p>
		</div>
	</div>
</footer>

<style>
	.site-footer {
		position: relative;
		margin-top: var(--space-20);
		background-color: #f8f9fa;
		border-top: 1px solid rgba(0,0,0,0.08);
		padding-top: var(--space-16);
		padding-bottom: var(--space-8);
	}

	.footer-glow {
		position: absolute;
		top: -1px; left: 50%; transform: translateX(-50%);
		width: 600px; height: 1px;
		background: linear-gradient(90deg, transparent, rgba(255,92,16,0.3) 30%, rgba(251,191,36,0.2) 70%, transparent);
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
		mix-blend-mode: multiply;
		transition: transform var(--duration-fast) var(--ease-out);
	}

	.footer-logo-img:hover {
		transform: scale(1.02);
	}

	.footer-tagline {
		font-size: var(--text-sm);
		color: #6b7280;
		line-height: 1.7;
		margin-bottom: var(--space-4);
		max-width: 260px;
	}

	.footer-contact a {
		font-size: var(--text-sm);
		color: #4a5568;
		text-decoration: none;
		transition: color var(--duration-fast) var(--ease-out);
	}
	.footer-contact a:hover { color: #ff5c10; }

	/* Footer sections */
	.footer-section-title {
		font-size: var(--text-xs);
		font-weight: 700;
		font-family: var(--font-display);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #9ca3af;
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
		color: #4a5568;
		text-decoration: none;
		transition: color var(--duration-fast) var(--ease-out);
	}
	.footer-link:hover { color: #ff5c10; }

	/* Divider */
	.divider {
		border: none;
		height: 1px;
		background: rgba(0,0,0,0.08);
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
		color: #9ca3af;
	}

	.footer-secure {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--text-xs);
		color: #9ca3af;
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
