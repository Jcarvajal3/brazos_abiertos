<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/Button.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const success = $derived($page.url.searchParams.get('exito') === '1');

	let submitting = $state(false);
	let selectedAreaId = $state('');
</script>

<svelte:head>
	<title>Registrar ONG — Brazos Abiertos con Venezuela</title>
	<meta name="description" content="Registra tu organización o proyecto benéfico en la plataforma Brazos Abiertos con Venezuela para recibir donaciones directas de todo el mundo." />
</svelte:head>

<div class="register-page">
	<div class="container">
		<div class="register-layout">

			<!-- Left: Info -->
			<div class="register-info">
				<span class="eyebrow">Para organizaciones</span>
				<h1>Registra tu <span class="text-gradient">proyecto</span> o ONG</h1>
				<p class="register-intro">
					¿Tienes una organización que está ayudando a las víctimas del terremoto de Venezuela? Registra tu proyecto y comienza a recibir donaciones de personas de todo el mundo.
				</p>

				<div class="process-steps">
					<div class="process-step">
						<div class="process-num">1</div>
						<div class="process-text">
							<strong>Completa el formulario</strong>
							<span>Cuéntanos sobre tu organización y el trabajo que realizas.</span>
						</div>
					</div>
					<div class="process-step">
						<div class="process-num">2</div>
						<div class="process-text">
							<strong>Revisión del equipo</strong>
							<span>Nuestro equipo verifica la información en 48-72 horas hábiles.</span>
						</div>
					</div>
					<div class="process-step">
						<div class="process-num">3</div>
						<div class="process-text">
							<strong>Aprobación y publicación</strong>
							<span>Tu proyecto aparece en la plataforma y comienza a recibir donaciones.</span>
						</div>
					</div>
				</div>

				<div class="register-note">
					<p>📋 El registro es completamente <strong>gratuito</strong>. No cobramos comisión sobre las donaciones recibidas a través de transferencias manuales.</p>
				</div>
			</div>

			<!-- Right: Form -->
			<div class="register-form-wrap">
				{#if success}
					<!-- Success State -->
					<div class="success-message glass animate-scale-in">
						<div class="success-msg-icon">🎉</div>
						<h2>¡Solicitud enviada!</h2>
						<p>Hemos recibido tu solicitud de registro. Nuestro equipo la revisará y te contactará al correo indicado en un plazo de 48-72 horas hábiles.</p>
						<p>Mientras tanto, puedes seguir el impacto de las donaciones en nuestra plataforma.</p>
						<div class="success-msg-actions">
							<Button href="/" variant="primary">Ver donaciones en vivo</Button>
							<Button href="/proyectos/registrar" variant="ghost">Registrar otro proyecto</Button>
						</div>
					</div>
				{:else}
					<form
						method="POST"
						class="register-form glass"
						use:enhance={() => {
							submitting = true;
							return async ({ update }) => {
								submitting = false;
								await update();
							};
						}}
					>
						<h2 class="form-section-title">Información del proyecto</h2>

						<!-- Area -->
						<div class="form-group">
							<label class="form-label" for="area-select">
								Área de impacto <span class="required">*</span>
							</label>
							<select
								id="area-select"
								name="area_id"
								class="form-select"
								class:error={form?.errors?.area_id}
								required
								bind:value={selectedAreaId}
							>
								<option value="">Selecciona un área…</option>
								{#each data.areas as area}
									<option value={area.id}>{area.icon} {area.name}</option>
								{/each}
							</select>
							{#if form?.errors?.area_id}
								<p class="form-error">⚠ {form.errors.area_id[0]}</p>
							{/if}
						</div>

						<!-- Project Name -->
						<div class="form-group">
							<label class="form-label" for="project-name">
								Nombre del proyecto <span class="required">*</span>
							</label>
							<input
								id="project-name"
								name="name"
								type="text"
								class="form-input"
								class:error={form?.errors?.name}
								placeholder="Ej: Centro de Salud Comunitario El Junquito"
								maxlength="200"
								required
								value={form?.values?.name ?? ''}
							/>
							{#if form?.errors?.name}
								<p class="form-error">⚠ {form.errors.name[0]}</p>
							{/if}
						</div>

						<!-- Description -->
						<div class="form-group">
							<label class="form-label" for="project-desc">
								Descripción del proyecto <span class="required">*</span>
							</label>
							<textarea
								id="project-desc"
								name="description"
								class="form-textarea"
								class:error={form?.errors?.description}
								placeholder="Describe qué hace tu organización, a quiénes ayuda, y cómo serán utilizados los fondos…"
								rows="5"
								maxlength="2000"
								required
							>{form?.values?.description ?? ''}</textarea>
							{#if form?.errors?.description}
								<p class="form-error">⚠ {form.errors.description[0]}</p>
							{/if}
						</div>

						<!-- Goal Amount -->
						<div class="form-group">
							<label class="form-label" for="goal-amount">
								Meta de recaudación (USD) <span class="form-hint-inline">(opcional)</span>
							</label>
							<div class="input-prefix-wrap">
								<span class="input-prefix">$</span>
								<input
									id="goal-amount"
									name="goal_amount"
									type="number"
									class="form-input"
									style="padding-left: 2rem;"
									placeholder="0.00"
									min="0"
									step="0.01"
									value={form?.values?.goal_amount ?? ''}
								/>
							</div>
							<span class="form-hint">Déjalo vacío si no tienes una meta específica.</span>
						</div>

						<hr class="divider" />
						<h2 class="form-section-title">Información de la organización</h2>

						<!-- ONG Name -->
						<div class="form-group">
							<label class="form-label" for="ong-name">
								Nombre de la organización <span class="required">*</span>
							</label>
							<input
								id="ong-name"
								name="ong_name"
								type="text"
								class="form-input"
								class:error={form?.errors?.ong_name}
								placeholder="Ej: Fundación Corazón Venezuela"
								maxlength="200"
								required
								value={form?.values?.ong_name ?? ''}
							/>
							{#if form?.errors?.ong_name}
								<p class="form-error">⚠ {form.errors.ong_name[0]}</p>
							{/if}
						</div>

						<!-- Contact & Document -->
						<div class="form-row">
							<div class="form-group">
								<label class="form-label" for="ong-email">
									Correo de contacto <span class="required">*</span>
								</label>
								<input
									id="ong-email"
									name="ong_contact_email"
									type="email"
									class="form-input"
									class:error={form?.errors?.ong_contact_email}
									placeholder="contacto@miong.org"
									required
									value={form?.values?.ong_contact_email ?? ''}
								/>
								{#if form?.errors?.ong_contact_email}
									<p class="form-error">⚠ {form.errors.ong_contact_email[0]}</p>
								{/if}
							</div>

							<div class="form-group">
								<label class="form-label" for="ong-phone">
									Teléfono de contacto <span class="form-hint-inline">(opcional)</span>
								</label>
								<input
									id="ong-phone"
									name="ong_phone"
									type="tel"
									class="form-input"
									placeholder="+58 412 000 0000"
									value={form?.values?.ong_phone ?? ''}
								/>
							</div>
						</div>

						<!-- RIF / Document -->
						<div class="form-row">
							<div class="form-group">
								<label class="form-label" for="ong-rif">
									RIF o documento legal <span class="form-hint-inline">(opcional)</span>
								</label>
								<input
									id="ong-rif"
									name="ong_document"
									type="text"
									class="form-input"
									placeholder="Ej: J-12345678-0"
									maxlength="50"
									value={form?.values?.ong_document ?? ''}
								/>
							</div>

							<div class="form-group">
								<label class="form-label" for="ong-website">
									Sitio web <span class="form-hint-inline">(opcional)</span>
								</label>
								<input
									id="ong-website"
									name="website_url"
									type="url"
									class="form-input"
									placeholder="https://miong.org"
									value={form?.values?.website_url ?? ''}
								/>
							</div>
						</div>

						<!-- Global error -->
						{#if form?.errors?._global}
							<div class="form-global-error">
								<p>⚠ {form.errors._global[0]}</p>
							</div>
						{/if}

						<!-- Submit -->
						<div class="form-submit">
							<Button type="submit" variant="primary" size="lg" loading={submitting} disabled={submitting}>
								{#if submitting}
									Enviando solicitud…
								{:else}
									Enviar solicitud de registro →
								{/if}
							</Button>
							<p class="submit-note">Al enviar, aceptas nuestros <a href="/terminos">Términos de Uso</a>. La información proporcionada será revisada por nuestro equipo.</p>
						</div>
					</form>
				{/if}
			</div>

		</div>
	</div>
</div>

<style>
	.register-page { padding-block: var(--space-12) var(--space-20); }

	.register-layout {
		display: grid;
		grid-template-columns: 1fr 1.4fr;
		gap: var(--space-16);
		align-items: start;
	}

	/* ─── Left info ─────────────── */
	.register-info { position: sticky; top: calc(4.5rem + var(--space-8)); }

	.register-info h1 {
		font-size: clamp(var(--text-2xl), 4vw, var(--text-4xl));
		font-weight: 900;
		letter-spacing: -0.03em;
		margin-block: var(--space-3) var(--space-4);
	}

	.register-intro {
		font-size: var(--text-base);
		color: var(--text-secondary);
		line-height: 1.7;
		margin-bottom: var(--space-8);
	}

	.process-steps {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		margin-bottom: var(--space-8);
	}

	.process-step {
		display: flex;
		align-items: flex-start;
		gap: var(--space-4);
	}

	.process-num {
		width: 2rem; height: 2rem;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--orange-500), var(--gold-400));
		color: white;
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.process-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding-top: 2px;
	}
	.process-text strong { font-family: var(--font-display); font-size: var(--text-sm); font-weight: 700; color: var(--text-primary); }
	.process-text span { font-size: var(--text-sm); color: var(--text-muted); line-height: 1.5; }

	.register-note {
		padding: var(--space-4);
		background: rgba(251,191,36,0.08);
		border: 1px solid rgba(251,191,36,0.2);
		border-radius: var(--radius-lg);
	}
	.register-note p { font-size: var(--text-sm); color: var(--gold-400); line-height: 1.6; }
	.register-note strong { color: var(--text-primary); }

	/* ─── Form ───────────────────── */
	.register-form, .success-message {
		padding: var(--space-8);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.form-section-title {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: calc(-1 * var(--space-2));
	}

	.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
	.form-hint-inline { font-size: var(--text-xs); color: var(--text-muted); font-weight: 400; }
	.input-prefix-wrap { position: relative; }
	.input-prefix { position: absolute; left: var(--space-4); top: 50%; transform: translateY(-50%); font-weight: 600; color: var(--text-muted); pointer-events: none; }
	.required { color: var(--color-error); margin-left: 2px; }

	.form-global-error {
		padding: var(--space-4);
		background: rgba(239,68,68,0.1);
		border: 1px solid rgba(239,68,68,0.3);
		border-radius: var(--radius-md);
	}
	.form-global-error p { font-size: var(--text-sm); color: #f87171; }

	.form-submit { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-3); }
	.form-submit :global(.btn) { width: 100%; justify-content: center; }
	.submit-note { font-size: var(--text-xs); color: var(--text-muted); line-height: 1.6; }
	.submit-note a { color: var(--color-accent); }

	/* Success state */
	.success-message { text-align: center; align-items: center; padding: var(--space-12); }
	.success-msg-icon { font-size: 4rem; }
	.success-message h2 { font-size: var(--text-2xl); font-weight: 800; }
	.success-message p { color: var(--text-secondary); font-size: var(--text-base); line-height: 1.7; max-width: 400px; }
	.success-msg-actions { display: flex; flex-direction: column; gap: var(--space-3); align-items: center; margin-top: var(--space-2); }
	.success-msg-actions :global(.btn) { width: 100%; max-width: 280px; justify-content: center; }

	@media (max-width: 1024px) {
		.register-layout { grid-template-columns: 1fr; gap: var(--space-8); }
		.register-info { position: static; }
	}
	@media (max-width: 640px) {
		.register-form, .success-message { padding: var(--space-6); }
		.form-row { grid-template-columns: 1fr; }
	}
</style>
