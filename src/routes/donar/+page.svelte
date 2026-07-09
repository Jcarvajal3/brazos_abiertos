<script lang="ts">
	import { goto } from '$app/navigation';
	import { createSupabaseClient } from '$lib/supabase';
	import Button from '$lib/components/ui/Button.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import StripePaymentForm from '$lib/components/ui/StripePaymentForm.svelte';
	import { toast } from '$lib/stores/toast';
	import {
		SUGGESTED_AMOUNTS_USD,
		SUGGESTED_AMOUNTS_EUR,
		SUGGESTED_AMOUNTS_USDT,
		BANK_DETAILS,
		CURRENCY_OPTIONS,
		PAYMENT_METHODS_BY_CURRENCY,
		COUNTRIES,
		type DonorCurrencyOption
	} from '$lib/utils/constants';
	import { formatCurrency } from '$lib/utils/formatters';
	import { getAreaIconName } from '$lib/utils/iconMap';
	import type { PageData } from './$types';
	import type { Area, Project } from '$lib/types';

	let { data }: { data: PageData } = $props();

	// ─── Multi-step state ─────────────────────────────────────────
	let step = $state(1); // 1=area, 2=project, 3=amount/info, 4=payment

	// ─── Form state ───────────────────────────────────────────────
	let selectedArea = $state<Area | null>(data.preselectedArea ?? null);
	let selectedProject = $state<Project | null>(null);
	let donateToGeneral = $state(false);
	let areaProjects = $state<Project[]>(data.initialProjects ?? []);
	let loadingProjects = $state(false);

	// Step 3 state
	let amount = $state(25);
	let customAmount = $state('');
	let isCustom = $state(false);
	let donorName = $state('');
	let isAnonymous = $state(false);
	let message = $state('');
	let selectedCurrency = $state<DonorCurrencyOption>('USD');

	// Country selector state
	let selectedCountry = $state<string>('');
	let countrySearchQuery = $state('');
	let countryDropdownOpen = $state(false);
	let countryInputRef = $state<HTMLInputElement | null>(null);

	// Step 4 state
	let paymentMethod = $state<string>('stripe');
	let manualReference = $state('');
	let manualBank = $state('');

	// Stripe Elements state
	let stripeFormRef = $state<{ confirmPayment: () => Promise<void> } | null>(null);
	let stripeClientSecret = $state('');
	let stripeDonationId = $state('');
	let stripeReady = $state(false);

	let submitting = $state(false);
	let errors = $state<Record<string, string>>({});

	const supabase = createSupabaseClient();

	// ─── Derived values ───────────────────────────────────────────
	const finalAmount = $derived(isCustom ? Number(customAmount) || 0 : amount);

	// Map donor currency to DB currency stored (VES donations store amount in USD)
	const storedCurrency = $derived(selectedCurrency === 'VES' ? 'USD' : selectedCurrency);

	// Suggested amounts for the selected currency
	const suggestedAmounts = $derived(
		selectedCurrency === 'EUR'  ? SUGGESTED_AMOUNTS_EUR  :
		selectedCurrency === 'USDT' ? SUGGESTED_AMOUNTS_USDT :
		SUGGESTED_AMOUNTS_USD // USD and VES both show USD amounts
	);

	// Available payment methods for selected currency
	const availablePaymentMethods = $derived(PAYMENT_METHODS_BY_CURRENCY[selectedCurrency]);

	// Currency symbol / prefix for display
	const currencySymbol = $derived(
		selectedCurrency === 'EUR'  ? '€' :
		selectedCurrency === 'USDT' ? '₮' : '$'
	);

	// Currency label for amount buttons
	const currencyLabel = $derived(
		selectedCurrency === 'EUR'  ? 'EUR' :
		selectedCurrency === 'USDT' ? 'USDt' :
		selectedCurrency === 'VES'  ? 'USD' : 'USD'
	);

	const stepPercent = $derived(((step - 1) / 3) * 100);

	// Filtered countries based on search
	const filteredCountries = $derived(
		countrySearchQuery.trim().length === 0
			? COUNTRIES
			: COUNTRIES.filter(c =>
				c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
				c.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
			)
	);

	// VES equivalent for display in step 4 (bolívares mode)
	const vesEquivalent = $derived(
		selectedCurrency === 'VES' && data.bcvRate
			? finalAmount * data.bcvRate
			: null
	);

	// ─── Step navigation ─────────────────────────────────────────
	function goToStep(n: number) {
		step = n;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// ─── Step 1: Select Area ──────────────────────────────────────
	async function selectArea(area: Area) {
		selectedArea = area;
		selectedProject = null;
		donateToGeneral = false;
		loadingProjects = true;
		areaProjects = [];

		if (area.slug === 'cualquiera') {
			donateToGeneral = true;
			loadingProjects = false;
			goToStep(3);
			return;
		}

		const { data: projects } = await supabase
			.from('projects')
			.select('id, name, description, ong_name, cover_image_url, goal_amount, current_amount')
			.eq('area_id', area.id)
			.eq('status', 'approved')
			.order('current_amount', { ascending: false });

		areaProjects = projects ?? [];
		loadingProjects = false;
		goToStep(2);
	}

	// ─── Step 2: Select Project ───────────────────────────────────
	function selectProject(project: Project) {
		selectedProject = project;
		donateToGeneral = false;
		goToStep(3);
	}

	function selectGeneral() {
		selectedProject = null;
		donateToGeneral = true;
		goToStep(3);
	}

	// ─── Currency selection (Step 3) ──────────────────────────────
	function selectCurrency(c: DonorCurrencyOption) {
		selectedCurrency = c;
		// Reset amount to default for new currency
		amount = suggestedAmounts[2] ?? 25;
		isCustom = false;
		customAmount = '';
		// Default to first available payment method
		paymentMethod = PAYMENT_METHODS_BY_CURRENCY[c][0];
	}

	// ─── Step 3 → 4 ──────────────────────────────────────────────
	function goToPayment() {
		errors = {};
		if (finalAmount <= 0) {
			errors.amount = 'El monto debe ser mayor a cero';
			return;
		}
		if (finalAmount > 100000) {
			errors.amount = 'El monto máximo es 100,000';
			return;
		}
		// Set default payment method for selected currency
		paymentMethod = PAYMENT_METHODS_BY_CURRENCY[selectedCurrency][0];
		goToStep(4);
	}

	// ─── Submit Donation ──────────────────────────────────────────
	async function submitDonation() {
		errors = {};
		if (!selectedArea) return;

		const isManual = paymentMethod !== 'stripe';
		if (isManual && !manualReference.trim()) {
			errors.manualReference = 'Debes ingresar el número de referencia de la transacción';
			return;
		}

		submitting = true;

		try {
			const payload = {
				area_id: selectedArea.id,
				project_id: selectedProject?.id ?? null,
				donor_name: isAnonymous ? undefined : (donorName.trim() || undefined),
				country: selectedCountry || undefined,
				amount: finalAmount,
				currency: storedCurrency,
				donor_currency: selectedCurrency,
				payment_method: paymentMethod,
				is_anonymous: isAnonymous,
				message: message.trim() || undefined,
				manual_reference: isManual ? manualReference.trim() : undefined,
				manual_bank: isManual ? manualBank.trim() : undefined
			};

			const res = await fetch('/api/donations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const result = await res.json();

			if (!result.success) {
				toast.error('Error al procesar', result.error ?? 'Inténtalo de nuevo');
				return;
			}

			if (paymentMethod === 'stripe') {
				if (!result.clientSecret || !result.donationId) {
					toast.error('Error al procesar', 'No se pudo crear el intento de pago. Inténtalo de nuevo.');
					return;
				}
				stripeClientSecret = result.clientSecret;
				stripeDonationId = result.donationId;
				stripeReady = true;
			} else {
				if (!result.donationId) {
					toast.error('Error al procesar', 'No se pudo registrar la donación. Inténtalo de nuevo.');
					return;
				}
				await goto(`/donar/confirmacion?id=${result.donationId}`);
			}
		} catch (e) {
			toast.error('Error de conexión', 'Verifica tu internet e inténtalo de nuevo');
		} finally {
			submitting = false;
		}
	}

	// ─── Confirm Stripe payment ────────────────────────────────────
	async function confirmStripe() {
		if (!stripeFormRef) return;
		submitting = true;
		try {
			await stripeFormRef.confirmPayment();
		} finally {
			submitting = false;
		}
	}

	function handleStripeSuccess(paymentIntentId: string) {
		if (!stripeDonationId) {
			toast.error('Error', 'No se encontró el ID de la donación.');
			return;
		}
		goto(`/donar/confirmacion?donation_id=${stripeDonationId}&pi=${paymentIntentId}`);
	}

	function handleStripeError(msg: string) {
		toast.error('Error en el pago', msg);
		submitting = false;
	}

	// ─── Amount selection ──────────────────────────────────────────
	function selectAmount(v: number) {
		amount = v;
		isCustom = false;
		customAmount = '';
	}

	// ─── Country selector helpers ──────────────────────────────────
	function openCountryDropdown() {
		countryDropdownOpen = true;
		countrySearchQuery = '';
	}

	function closeCountryDropdown() {
		countryDropdownOpen = false;
	}

	function selectCountryOption(name: string) {
		selectedCountry = name;
		countryDropdownOpen = false;
		countrySearchQuery = '';
	}

	function clearCountry() {
		selectedCountry = '';
		countrySearchQuery = '';
	}

	// Close dropdown on outside click
	function handleCountryBlur(e: FocusEvent) {
		const related = (e as any).relatedTarget as HTMLElement | null;
		if (!related || !(related.closest('.country-dropdown-wrap'))) {
			setTimeout(() => { countryDropdownOpen = false; }, 150);
		}
	}

	// Payment method icon + label helpers
	const METHOD_META: Record<string, { emoji: string; name: string; desc: string }> = {
		stripe:       { emoji: '💳', name: 'Tarjeta de Crédito/Débito', desc: 'Pago seguro via Stripe' },
		zelle:        { emoji: '⚡', name: 'Zelle',                      desc: 'Transferencia inmediata' },
		bizum:        { emoji: '📲', name: 'Bizum',                      desc: 'Pago móvil España' },
		crypto:       { emoji: '₿',  name: 'Cripto (USDt)',              desc: 'Wallet USDt (TRC-20)' },
		pago_movil:   { emoji: '📱', name: 'Pago Móvil',                 desc: 'Transferencia inmediata' },
		transferencia:{ emoji: '🏦', name: 'Transferencia Bancaria',      desc: 'Transferencia directa' }
	};
</script>

<svelte:head>
	<title>Donar — Brazos Abiertos con Venezuela</title>
	<meta name="description" content="Haz tu donación para ayudar a las víctimas del terremoto de Venezuela 2026. Elige el área y el proyecto que quieres apoyar." />
</svelte:head>

<div class="donate-page">
	<div class="container">
		<!-- Page header -->
		<div class="donate-header">
			<h1>Hacer una <span class="text-gradient">donación</span></h1>
			<p>Cada donación llega directamente a quienes más lo necesitan.</p>
		</div>

		<!-- Step Progress -->
		<div class="step-bar" role="navigation" aria-label="Pasos del proceso de donación">
			{#each [
				{ n: 1, label: 'Área' },
				{ n: 2, label: 'Proyecto' },
				{ n: 3, label: 'Monto' },
				{ n: 4, label: 'Pago' }
			] as s}
				<div class="step-item" class:active={step === s.n} class:done={step > s.n}>
					<button
						class="step-circle-btn"
						onclick={() => step > s.n && goToStep(s.n)}
						disabled={step <= s.n}
						aria-label="Paso {s.n}: {s.label}"
					>
						{#if step > s.n}
							<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
							</svg>
						{:else}
							{s.n}
						{/if}
					</button>
					<span class="step-label-text">{s.label}</span>
				</div>
				{#if s.n < 4}
					<div class="step-connector" class:done={step > s.n}></div>
				{/if}
			{/each}
		</div>

		<!-- Form card -->
		<div class="donate-card glass">

			<!-- ─── STEP 1: SELECT AREA ─────────────────────────── -->
			{#if step === 1}
				<div class="step-content animate-fade-in-up">
					<div class="step-heading">
						<h2>¿A qué área quieres destinar tu donación?</h2>
						<p>Selecciona el sector donde quieres generar mayor impacto.</p>
					</div>

					<div class="areas-select-grid">
						{#each data.areas as area}
							<button
								class="area-select-card"
								class:selected={selectedArea?.id === area.id}
								onclick={() => selectArea(area)}
								id="area-btn-{area.slug}"
								style="--area-color: {area.color}"
							>
								<span class="area-select-icon material-symbols-outlined" style="color: var(--area-color);" aria-label={area.name}>{getAreaIconName(area.icon)}</span>
								<span class="area-select-name">{area.name}</span>
								<span class="area-select-desc">{area.description}</span>
							</button>
						{/each}
					</div>
				</div>

			<!-- ─── STEP 2: SELECT PROJECT ──────────────────────── -->
			{:else if step === 2}
				<div class="step-content animate-fade-in-up">
					<div class="step-heading">
						<div class="step-heading-with-back">
							<button class="back-btn" onclick={() => goToStep(1)}>
								← Cambiar área
							</button>
						</div>
						<h2>
							<span class="material-symbols-outlined" style="font-size:1.25rem;vertical-align:middle;">{getAreaIconName(selectedArea?.icon)}</span> {selectedArea?.name}
							— ¿A qué proyecto quieres apoyar?
						</h2>
						<p>Elige un proyecto específico o dona al área en general.</p>
					</div>

					<!-- General donation option -->
					<button
						class="general-option"
						class:selected={donateToGeneral}
						onclick={selectGeneral}
						id="donate-general"
					>
						<div class="general-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg></div>
						<div class="general-text">
							<strong>Donar al área en general</strong>
							<span>Los fondos se distribuirán entre todos los proyectos de {selectedArea?.name}</span>
						</div>
						<div class="general-arrow">→</div>
					</button>

					{#if loadingProjects}
						<div class="projects-loading">
							<div class="skeleton" style="height:100px;border-radius:0;"></div>
							<div class="skeleton" style="height:100px;border-radius:0;"></div>
						</div>
					{:else if areaProjects.length > 0}
						<p class="projects-divider-label">— O elige un proyecto específico —</p>

						<div class="projects-select-list">
							{#each areaProjects as project}
								{@const percent = project.goal_amount ? Math.min(100, (project.current_amount / project.goal_amount) * 100) : null}
								<button
									class="project-select-card"
									class:selected={selectedProject?.id === project.id}
									onclick={() => selectProject(project as any)}
									id="project-btn-{project.id}"
								>
									{#if project.cover_image_url}
										<img src={project.cover_image_url} alt={project.name} class="project-select-img" />
									{:else}
										<div class="project-select-img-placeholder"><span class="material-symbols-outlined" style="font-size:2rem;color:var(--blue-400);">{getAreaIconName(selectedArea?.icon)}</span></div>
									{/if}
									<div class="project-select-info">
										<p class="project-select-name">{project.name}</p>
										<p class="project-select-ong">{project.ong_name}</p>
										<p class="project-select-desc">{project.description.slice(0, 100)}…</p>
										{#if percent !== null}
											<div class="project-select-progress">
												<ProgressBar percent={percent} showPercent={false} height={4} />
												<span class="project-select-raised">
													{formatCurrency(project.current_amount, 'USD')} recaudados
												</span>
											</div>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{:else}
						<div class="no-projects">
							<p>No hay proyectos registrados para esta área aún.</p>
							<p>Tu donación irá al área general de <strong>{selectedArea?.name}</strong>.</p>
							<Button variant="primary" onclick={selectGeneral}>Continuar con donación general</Button>
						</div>
					{/if}
				</div>

			<!-- ─── STEP 3: AMOUNT & DONOR INFO ─────────────────── -->
			{:else if step === 3}
				<div class="step-content animate-fade-in-up">
					<div class="step-heading">
						<button class="back-btn" onclick={() => goToStep(2)}>← Cambiar proyecto</button>
						<h2>¿Cuánto quieres donar?</h2>
						<p>
							Donando a: <strong><span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;">{getAreaIconName(selectedArea?.icon)}</span> {selectedArea?.name}</strong>
							{#if selectedProject} → <strong>{selectedProject.name}</strong>{/if}
						</p>
					</div>

					<!-- ── Currency Selector ── -->
					<div class="currency-section">
						<p class="form-label">Moneda de donación</p>
						<div class="currency-grid">
							{#each CURRENCY_OPTIONS as opt}
								<button
									class="currency-btn"
									class:selected={selectedCurrency === opt.id}
									onclick={() => selectCurrency(opt.id)}
									id="currency-{opt.id}"
								>
									<span class="currency-flag">{opt.flag}</span>
									<span class="currency-name">{opt.label}</span>
								</button>
							{/each}
						</div>
					</div>

					<hr class="divider" />

					<!-- Suggested amounts -->
					<div class="amount-section">
						<p class="form-label">Monto ({currencyLabel})</p>
						<div class="amount-grid">
							{#each suggestedAmounts as val}
								<button
									class="amount-btn"
									class:selected={!isCustom && amount === val}
									onclick={() => selectAmount(val)}
									id="amount-{val}"
								>
									{currencySymbol}{val}
								</button>
							{/each}
							<button
								class="amount-btn amount-custom"
								class:selected={isCustom}
								onclick={() => { isCustom = true; }}
							>
								Otro
							</button>
						</div>

						{#if isCustom}
							<div class="form-group" style="margin-top:var(--space-4);">
								<label class="form-label" for="custom-amount">Monto personalizado ({currencyLabel})</label>
								<div class="input-prefix-wrap">
									<span class="input-prefix">{currencySymbol}</span>
									<input
										id="custom-amount"
										type="number"
										class="form-input"
										class:error={errors.amount}
										min="1"
										max="100000"
										step="0.01"
										placeholder="0.00"
										bind:value={customAmount}
									/>
								</div>
							</div>
						{/if}

						{#if errors.amount}
							<p class="form-error">{errors.amount}</p>
						{/if}

						{#if selectedCurrency === 'VES' && data.bcvRate}
							<p class="ves-hint">
								💡 Los montos se muestran en USD. En el paso de pago verás el equivalente en bolívares a la tasa BCV (Bs. {data.bcvRate.toFixed(2)}).
							</p>
						{/if}
					</div>

					<hr class="divider" />

					<!-- Donor Info -->
					<div class="donor-section">
						<h3 class="donor-section-title">Información del donante <span style="color:var(--text-muted);font-weight:400;">(opcional)</span></h3>

						<div class="anonymous-toggle">
							<label class="toggle-label" for="anonymous">
								<input
									id="anonymous"
									type="checkbox"
									class="toggle-input"
									bind:checked={isAnonymous}
								/>
								<span class="toggle-switch"></span>
								<span>Donar de forma anónima</span>
							</label>
						</div>

						{#if !isAnonymous}
							<div class="form-row">
								<div class="form-group">
									<label class="form-label" for="donor-name">
										Tu nombre <span style="color:var(--text-muted);">(aparecerá en el feed)</span>
									</label>
									<input
										id="donor-name"
										type="text"
										class="form-input"
										placeholder="Ej: María García"
										maxlength="100"
										bind:value={donorName}
									/>
								</div>

								<!-- Country Selector with search -->
								<div class="form-group">
									<label class="form-label" for="country-trigger">
										País de origen <span style="color:var(--text-muted);">(opcional)</span>
									</label>
									<div class="country-dropdown-wrap" onfocusout={handleCountryBlur}>
										<button
											id="country-trigger"
											class="country-trigger"
											class:open={countryDropdownOpen}
											onclick={openCountryDropdown}
											type="button"
											aria-haspopup="listbox"
											aria-expanded={countryDropdownOpen}
										>
											{#if selectedCountry}
												<span class="country-selected-flag">
													{COUNTRIES.find(c => c.name === selectedCountry)?.flag ?? '🌍'}
												</span>
												<span class="country-selected-name">{selectedCountry}</span>
												<span
													class="country-clear-btn"
													onclick={(e) => { e.stopPropagation(); clearCountry(); }}
													role="button"
													tabindex="0"
													onkeydown={(e) => e.key === 'Enter' && clearCountry()}
													aria-label="Limpiar país"
												>✕</span>
											{:else}
												<span class="country-placeholder">Seleccionar país…</span>
												<svg class="country-chevron" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
													<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
												</svg>
											{/if}
										</button>

										{#if countryDropdownOpen}
											<div class="country-dropdown" role="listbox">
												<div class="country-search-wrap">
													<svg class="country-search-icon" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
														<path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
													</svg>
													<input
														bind:this={countryInputRef}
														class="country-search-input"
														type="text"
														placeholder="Buscar país…"
														bind:value={countrySearchQuery}
														aria-label="Buscar país"
													/>
												</div>
												<div class="country-list">
													{#each filteredCountries as country}
														<button
															class="country-option"
															class:selected={selectedCountry === country.name}
															onclick={() => selectCountryOption(country.name)}
															type="button"
															role="option"
															aria-selected={selectedCountry === country.name}
														>
															<span class="country-option-flag">{country.flag}</span>
															<span class="country-option-name">{country.name}</span>
														</button>
													{/each}
													{#if filteredCountries.length === 0}
														<p class="country-no-results">Sin resultados para "{countrySearchQuery}"</p>
													{/if}
												</div>
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/if}

						<div class="form-group">
							<label class="form-label" for="donor-message">
								Mensaje para Venezuela <span style="color:var(--text-muted);">(opcional)</span>
							</label>
							<textarea
								id="donor-message"
								class="form-textarea"
								placeholder="Un mensaje de apoyo y esperanza para las familias afectadas..."
								maxlength="500"
								rows="3"
								bind:value={message}
							></textarea>
							<span class="form-hint">{message.length}/500 caracteres</span>
						</div>
					</div>

					<div class="step-actions">
						<Button variant="primary" size="lg" onclick={goToPayment}>
							Continuar al pago →
						</Button>
					</div>
				</div>

			<!-- ─── STEP 4: PAYMENT METHOD ───────────────────────── -->
			{:else if step === 4}
				<div class="step-content animate-fade-in-up">
					<div class="step-heading">
						<button class="back-btn" onclick={() => goToStep(3)}>← Cambiar monto</button>
						<h2>Elige el método de pago</h2>
					</div>

					<!-- Summary -->
					<div class="donation-summary">
						<div class="summary-row">
							<span>Área</span>
							<strong><span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;">{getAreaIconName(selectedArea?.icon)}</span> {selectedArea?.name}</strong>
						</div>
						{#if selectedProject}
							<div class="summary-row">
								<span>Proyecto</span>
								<strong>{selectedProject.name}</strong>
							</div>
						{/if}
						{#if selectedCountry}
							<div class="summary-row">
								<span>País</span>
								<strong>
									{COUNTRIES.find(c => c.name === selectedCountry)?.flag ?? '🌍'}
									{selectedCountry}
								</strong>
							</div>
						{/if}
						<div class="summary-row summary-total">
							<span>Monto</span>
							<div class="summary-amount-wrap">
								<strong class="text-gradient" style="font-size:var(--text-2xl);">
									{#if selectedCurrency === 'EUR'}
										{formatCurrency(finalAmount, 'EUR')}
									{:else if selectedCurrency === 'USDT'}
										{formatCurrency(finalAmount, 'USDT')}
									{:else if selectedCurrency === 'VES' && vesEquivalent !== null}
										{formatCurrency(vesEquivalent, 'VES')}
									{:else}
										{formatCurrency(finalAmount, 'USD')}
									{/if}
								</strong>
								{#if selectedCurrency === 'VES'}
									<span class="summary-ves-equiv">
										≈ {formatCurrency(finalAmount, 'USD')} a tasa BCV
									</span>
								{:else if vesEquivalent !== null}
									<span class="summary-ves-equiv">
										≈ Bs. {Math.round(vesEquivalent).toLocaleString('es-VE')} a tasa BCV
									</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- Payment Method Selector -->
					<div class="payment-methods">
						{#each availablePaymentMethods as method}
							{@const meta = METHOD_META[method]}
							<button
								class="payment-option"
								class:selected={paymentMethod === method}
								onclick={() => { paymentMethod = method; stripeReady = false; stripeClientSecret = ''; }}
								id="method-{method}"
							>
								<div class="payment-option-header">
									<span class="payment-icon">{meta.emoji}</span>
									<div>
										<p class="payment-name">{meta.name}</p>
										<p class="payment-desc">{meta.desc}</p>
									</div>
									<div class="payment-radio" class:active={paymentMethod === method}></div>
								</div>

								<!-- Inline payment details per method -->
								{#if paymentMethod === method}
									{#if method === 'pago_movil'}
										<div class="bank-details animate-fade-in">
											<p class="bank-title">Datos para el pago móvil:</p>
											<div class="bank-info-grid">
												<div class="bank-info-item"><span class="bank-label">Banco</span><span class="bank-value">{BANK_DETAILS.pago_movil.bank}</span></div>
												<div class="bank-info-item"><span class="bank-label">Teléfono</span><span class="bank-value">{BANK_DETAILS.pago_movil.phone}</span></div>
												<div class="bank-info-item"><span class="bank-label">Cédula</span><span class="bank-value">{BANK_DETAILS.pago_movil.cedula}</span></div>
												<div class="bank-info-item"><span class="bank-label">Titular</span><span class="bank-value">{BANK_DETAILS.pago_movil.name}</span></div>
											</div>
										</div>
									{:else if method === 'transferencia'}
										<div class="bank-details animate-fade-in">
											<p class="bank-title">Datos bancarios:</p>
											<div class="bank-info-grid">
												<div class="bank-info-item"><span class="bank-label">Banco</span><span class="bank-value">{BANK_DETAILS.transferencia.bank}</span></div>
												<div class="bank-info-item"><span class="bank-label">Cuenta</span><span class="bank-value">{BANK_DETAILS.transferencia.account_number}</span></div>
												<div class="bank-info-item"><span class="bank-label">RIF</span><span class="bank-value">{BANK_DETAILS.transferencia.rif}</span></div>
												<div class="bank-info-item"><span class="bank-label">Titular</span><span class="bank-value">{BANK_DETAILS.transferencia.name}</span></div>
											</div>
										</div>
									{:else if method === 'zelle'}
										<div class="bank-details animate-fade-in">
											<p class="bank-title">Datos para Zelle:</p>
											<div class="bank-info-grid">
												<div class="bank-info-item"><span class="bank-label">Email</span><span class="bank-value">{BANK_DETAILS.zelle.email}</span></div>
												<div class="bank-info-item"><span class="bank-label">Titular</span><span class="bank-value">{BANK_DETAILS.zelle.name}</span></div>
											</div>
										</div>
									{:else if method === 'bizum'}
										<div class="bank-details animate-fade-in">
											<p class="bank-title">Datos para Bizum:</p>
											<div class="bank-info-grid">
												<div class="bank-info-item"><span class="bank-label">Teléfono</span><span class="bank-value">{BANK_DETAILS.bizum.phone}</span></div>
												<div class="bank-info-item"><span class="bank-label">Titular</span><span class="bank-value">{BANK_DETAILS.bizum.name}</span></div>
											</div>
										</div>
									{:else if method === 'crypto'}
										<div class="bank-details crypto-details animate-fade-in">
											<p class="bank-title">Dirección de wallet ({BANK_DETAILS.crypto.network}):</p>
											<div class="crypto-address-wrap">
												<code class="crypto-address">{BANK_DETAILS.crypto.address}</code>
												<span
													class="copy-btn"
													onclick={() => navigator.clipboard.writeText(BANK_DETAILS.crypto.address)}
													role="button"
													tabindex="0"
													onkeydown={(e) => e.key === 'Enter' && navigator.clipboard.writeText(BANK_DETAILS.crypto.address)}
												>
													📋 Copiar
												</span>
											</div>
											<p class="crypto-hint">{BANK_DETAILS.crypto.qr_hint}</p>
										</div>
									{/if}
								{/if}
							</button>
						{/each}
					</div>

					<!-- Manual payment reference fields (all non-stripe) -->
					{#if paymentMethod !== 'stripe'}
						<div class="manual-fields animate-fade-in-up">
							<p class="manual-instruction">
								{#if paymentMethod === 'crypto'}
									Envía exactamente <strong>{currencySymbol}{finalAmount} USDt</strong> a la dirección de arriba, luego ingresa el hash de la transacción aquí para confirmar tu donación.
								{:else}
									Realiza el pago con los datos de arriba, luego ingresa el número de referencia aquí para confirmar tu donación.
								{/if}
								{#if vesEquivalent !== null}
									<br/><strong>Monto a transferir: Bs. {Math.round(vesEquivalent).toLocaleString('es-VE')}</strong> (equivalente en bolívares a tasa BCV Bs. {data.bcvRate?.toFixed(2)}).
								{/if}
							</p>
							<div class="form-row">
								<div class="form-group">
									<label class="form-label" for="manual-ref">
										{#if paymentMethod === 'crypto'}Hash / TxID{:else}Número de referencia{/if} <span class="required">*</span>
									</label>
									<input
										id="manual-ref"
										type="text"
										class="form-input"
										class:error={errors.manualReference}
										placeholder={paymentMethod === 'crypto' ? 'Ej: 0xa1b2c3...' : 'Ej: 00123456789'}
										bind:value={manualReference}
									/>
									{#if errors.manualReference}
										<p class="form-error">{errors.manualReference}</p>
									{/if}
								</div>
								{#if paymentMethod !== 'crypto'}
									<div class="form-group">
										<label class="form-label" for="manual-bank">
											{#if paymentMethod === 'zelle' || paymentMethod === 'bizum'}Banco / Entidad de origen{:else}Banco de origen{/if}
										</label>
										<input
											id="manual-bank"
											type="text"
											class="form-input"
											placeholder="Ej: Banesco"
											bind:value={manualBank}
										/>
									</div>
								{/if}
							</div>
						</div>
					{:else}
						<!-- Stripe Elements -->
						{#if stripeReady}
							<div class="stripe-elements-wrap animate-fade-in-up">
								<p class="stripe-ready-label">Ingresa los datos de tu tarjeta:</p>
								<StripePaymentForm
									bind:this={stripeFormRef}
									clientSecret={stripeClientSecret}
									donationId={stripeDonationId}
									amount={finalAmount}
									onSuccess={handleStripeSuccess}
									onError={handleStripeError}
								/>
							</div>
						{:else}
							<div class="stripe-note">
								<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="color:var(--color-info)">
									<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
								</svg>
								<p>Al hacer clic en <strong>"Continuar al pago"</strong>, se creará un intento de pago seguro y aparecerá el formulario de tarjeta.</p>
							</div>
						{/if}
					{/if}

					<!-- Submit -->
					<div class="step-actions">
						{#if stripeReady && paymentMethod === 'stripe'}
							<Button variant="primary" size="xl" loading={submitting} disabled={submitting} onclick={confirmStripe} id="btn-pay-card">
								{submitting ? 'Procesando pago…' : `Pagar ${selectedCurrency === 'EUR' ? formatCurrency(finalAmount, 'EUR') : formatCurrency(finalAmount, 'USD')}`}
							</Button>
							<button class="btn-reset-stripe" onclick={() => { stripeReady = false; stripeClientSecret = ''; }}>← Cambiar método de pago</button>
						{:else}
							<Button variant="primary" size="xl" loading={submitting} disabled={submitting} onclick={submitDonation} id="btn-submit-donation">
								{#if submitting}
									Procesando…
								{:else if paymentMethod === 'stripe'}
									Continuar al pago —
									{selectedCurrency === 'EUR' ? formatCurrency(finalAmount, 'EUR') : formatCurrency(finalAmount, 'USD')}
								{:else}
									Confirmar donación —
									{#if selectedCurrency === 'EUR'}
										{formatCurrency(finalAmount, 'EUR')}
									{:else if selectedCurrency === 'USDT'}
										{formatCurrency(finalAmount, 'USDT')}
									{:else if selectedCurrency === 'VES' && vesEquivalent !== null}
										{formatCurrency(vesEquivalent, 'VES')}
									{:else}
										{formatCurrency(finalAmount, 'USD')}
									{/if}
								{/if}
							</Button>
						{/if}
						<p class="submit-note">Tu información está protegida y encriptada</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.donate-page {
		padding-block: var(--space-12) var(--space-20);
		min-height: calc(100vh - 4.5rem);
	}

	.donate-header {
		text-align: center;
		margin-bottom: var(--space-8);
	}
	.donate-header h1 {
		font-size: clamp(var(--text-3xl), 5vw, var(--text-5xl));
		font-weight: 900;
		letter-spacing: -0.03em;
		margin-bottom: var(--space-3);
	}
	.donate-header p { font-size: var(--text-lg); color: var(--text-secondary); }

	/* ─── Step Bar ─────────────────── */
	.step-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0;
		margin-bottom: var(--space-8);
		max-width: 480px;
		margin-inline: auto;
	}

	.step-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		position: relative;
	}

	.step-circle-btn {
		width: 2.25rem; height: 2.25rem;
		border-radius: 50%;
		border: 2px solid var(--border-default);
		background: var(--bg-elevated);
		color: var(--text-muted);
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--duration-normal) var(--ease-out);
		cursor: default;
	}

	.step-item.active .step-circle-btn {
		border-color: var(--color-primary);
		background: var(--color-primary);
		color: white;
		box-shadow: 0 0 0 4px rgba(20,96,154,0.2);
		cursor: default;
	}

	.step-item.done .step-circle-btn {
		border-color: var(--color-success);
		background: var(--color-success);
		color: white;
		cursor: pointer;
	}
	.step-item.done .step-circle-btn:hover {
		transform: scale(1.1);
	}

	.step-label-text {
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--text-muted);
		text-align: center;
		white-space: nowrap;
	}
	.step-item.active .step-label-text { color: var(--color-primary); }
	.step-item.done .step-label-text { color: var(--color-success); }

	.step-connector {
		flex: 1;
		height: 2px;
		min-width: 40px;
		background: var(--border-subtle);
		margin-bottom: 1.2rem;
		transition: background var(--duration-slow) var(--ease-out);
	}
	.step-connector.done { background: var(--color-success); }

	/* ─── Form Card ──────────────── */
	.donate-card {
		max-width: 780px;
		margin-inline: auto;
		padding: var(--space-10);
	}

	/* ─── Step Content ───────────── */
	.step-content { display: flex; flex-direction: column; gap: var(--space-6); }

	.step-heading { display: flex; flex-direction: column; gap: var(--space-2); }
	.step-heading h2 {
		font-size: clamp(var(--text-xl), 3vw, var(--text-3xl));
		font-weight: 800;
		letter-spacing: -0.02em;
	}
	.step-heading p { font-size: var(--text-base); color: var(--text-secondary); }

	.step-heading-with-back { margin-bottom: var(--space-1); }

	.back-btn {
		font-size: var(--text-sm);
		color: var(--text-muted);
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		transition: color var(--duration-fast) var(--ease-out);
		font-family: var(--font-body);
	}
	.back-btn:hover { color: var(--text-primary); }

	/* ─── Area Select Grid ───────── */
	.areas-select-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-4);
	}

	.area-select-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: var(--space-2);
		padding: var(--space-5);
		background: var(--bg-elevated);
		border: 2px solid var(--border-subtle);
		border-radius: 0;
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
		font-family: var(--font-body);
	}

	.area-select-card:hover {
		border-color: var(--area-color, var(--color-primary));
		background: color-mix(in srgb, var(--area-color, var(--color-primary)) 8%, var(--bg-elevated));
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0,0,0,0.3);
	}

	.area-select-card.selected {
		border-color: var(--area-color, var(--color-primary));
		background: color-mix(in srgb, var(--area-color, var(--color-primary)) 12%, var(--bg-elevated));
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--area-color, var(--color-primary)) 20%, transparent);
	}

	.area-select-icon { font-size: 2.25rem; line-height: 1; }
	.area-select-name { font-family: var(--font-display); font-size: var(--text-base); font-weight: 700; color: var(--text-primary); }
	.area-select-desc { font-size: var(--text-xs); color: var(--text-muted); line-height: 1.5; }

	/* ─── General Option ─────────── */
	.general-option {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-5);
		background: var(--bg-elevated);
		border: 2px solid var(--border-default);
		border-radius: 0;
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
		text-align: left;
		width: 100%;
		font-family: var(--font-body);
	}
	.general-option:hover, .general-option.selected {
		border-color: var(--color-primary);
		background: rgba(20,96,154,0.06);
	}
	.general-option.selected { box-shadow: 0 0 0 3px rgba(20,96,154,0.2); }

	.general-icon { font-size: 2rem; flex-shrink: 0; }
	.general-text { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); }
	.general-text strong { font-family: var(--font-display); font-size: var(--text-base); color: var(--text-primary); }
	.general-text span { font-size: var(--text-sm); color: var(--text-muted); }
	.general-arrow { font-size: var(--text-xl); color: var(--color-primary); }

	.projects-divider-label {
		text-align: center;
		font-size: var(--text-sm);
		color: var(--text-muted);
		position: relative;
	}

	.projects-loading, .projects-select-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.project-select-card {
		display: flex;
		gap: var(--space-4);
		align-items: flex-start;
		padding: var(--space-4);
		background: var(--bg-elevated);
		border: 2px solid var(--border-subtle);
		border-radius: 0;
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
		text-align: left;
		width: 100%;
		font-family: var(--font-body);
	}
	.project-select-card:hover { border-color: var(--color-primary); transform: translateY(-1px); }
	.project-select-card.selected { border-color: var(--color-primary); background: rgba(20,96,154,0.06); box-shadow: 0 0 0 3px rgba(20,96,154,0.15); }

	.project-select-img { width: 72px; height: 72px; border-radius: 0; object-fit: cover; flex-shrink: 0; }
	.project-select-img-placeholder { width: 72px; height: 72px; border-radius: 0; background: rgba(20,96,154,0.1); display: flex; align-items: center; justify-content: center; font-size: 1.75rem; flex-shrink: 0; }
	.project-select-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-1); }
	.project-select-name { font-family: var(--font-display); font-size: var(--text-base); font-weight: 700; color: var(--text-primary); }
	.project-select-ong { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
	.project-select-desc { font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.5; }
	.project-select-progress { margin-top: var(--space-2); display: flex; flex-direction: column; gap: var(--space-1); }
	.project-select-raised { font-size: var(--text-xs); color: var(--text-muted); }

	.no-projects { text-align: center; padding: var(--space-8); background: var(--bg-elevated); border-radius: 0; border: 1px dashed var(--border-default); display: flex; flex-direction: column; gap: var(--space-3); align-items: center; }
	.no-projects p { color: var(--text-secondary); font-size: var(--text-sm); }
	.no-projects strong { color: var(--text-primary); }

	/* ─── Currency Selector ──────── */
	.currency-section { display: flex; flex-direction: column; gap: var(--space-3); }
	.currency-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-2);
	}

	.currency-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-3) var(--space-2);
		background: var(--bg-elevated);
		border: 2px solid var(--border-subtle);
		border-radius: 0;
		color: var(--text-secondary);
		font-family: var(--font-display);
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}
	.currency-btn:hover { border-color: var(--color-primary); color: var(--text-primary); }
	.currency-btn.selected {
		border-color: var(--color-primary);
		background: rgba(20,96,154,0.1);
		color: var(--blue-400);
		box-shadow: 0 0 0 3px rgba(20,96,154,0.15);
	}
	.currency-flag { font-size: 1.5rem; line-height: 1; }
	.currency-name { font-size: var(--text-xs); font-weight: 700; white-space: nowrap; }

	/* ─── Amount ──────────────────── */
	.amount-section { display: flex; flex-direction: column; gap: var(--space-3); }
	.amount-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-2); }

	.amount-btn {
		padding: var(--space-3) var(--space-4);
		background: var(--bg-elevated);
		border: 2px solid var(--border-subtle);
		border-radius: 0;
		color: var(--text-secondary);
		font-family: var(--font-display);
		font-size: var(--text-base);
		font-weight: 600;
		cursor: pointer;
		transition: all var(--duration-fast) var(--ease-out);
	}
	.amount-btn:hover { border-color: var(--color-primary); color: var(--text-primary); }
	.amount-btn.selected {
		border-color: var(--color-primary);
		background: rgba(20,96,154,0.1);
		color: var(--blue-400);
		box-shadow: 0 0 0 3px rgba(20,96,154,0.15);
	}
	.amount-custom { color: var(--text-muted); }

	.input-prefix-wrap { position: relative; }
	.input-prefix {
		position: absolute; left: var(--space-4); top: 50%; transform: translateY(-50%);
		font-family: var(--font-display); font-weight: 600; color: var(--text-muted);
		pointer-events: none;
	}
	.input-prefix-wrap .form-input { padding-left: 2rem; }

	.ves-hint {
		font-size: var(--text-sm);
		color: var(--color-warning, #d97706);
		background: rgba(217,119,6,0.08);
		border: 1px solid rgba(217,119,6,0.2);
		padding: var(--space-3) var(--space-4);
		line-height: 1.6;
	}

	/* ─── Donor Section ─────────────── */
	.donor-section { display: flex; flex-direction: column; gap: var(--space-4); }
	.donor-section-title { font-family: var(--font-display); font-size: var(--text-lg); font-weight: 700; }
	.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }

	/* Toggle */
	.anonymous-toggle { display: flex; align-items: center; }
	.toggle-label { display: flex; align-items: center; gap: var(--space-3); cursor: pointer; font-size: var(--text-sm); color: var(--text-secondary); user-select: none; }
	.toggle-input { display: none; }
	.toggle-switch {
		width: 2.5rem; height: 1.4rem;
		background: var(--border-default);
		border-radius: 9999px;
		position: relative;
		transition: background var(--duration-normal) var(--ease-out);
		flex-shrink: 0;
	}
	.toggle-switch::after {
		content: '';
		position: absolute;
		width: 1rem; height: 1rem;
		background: white; border-radius: 50%;
		top: 0.2rem; left: 0.2rem;
		transition: transform var(--duration-normal) var(--ease-out);
	}
	.toggle-input:checked + .toggle-switch { background: var(--color-primary); }
	.toggle-input:checked + .toggle-switch::after { transform: translateX(1.1rem); }

	/* ─── Country Dropdown ────────── */
	.country-dropdown-wrap {
		position: relative;
	}

	.country-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background: var(--bg-elevated);
		border: 1.5px solid var(--border-default);
		border-radius: 0;
		font-family: var(--font-body);
		font-size: var(--text-sm);
		color: var(--text-primary);
		cursor: pointer;
		text-align: left;
		transition: border-color var(--duration-fast) var(--ease-out);
		min-height: 2.75rem;
	}
	.country-trigger:hover, .country-trigger.open {
		border-color: var(--color-primary);
	}
	.country-placeholder { color: var(--text-muted); flex: 1; }
	.country-chevron { margin-left: auto; color: var(--text-muted); flex-shrink: 0; }
	.country-selected-flag { font-size: 1.1rem; flex-shrink: 0; }
	.country-selected-name { flex: 1; font-size: var(--text-sm); color: var(--text-primary); }
	.country-clear-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 2px 4px;
		font-size: var(--text-xs);
		border-radius: 4px;
		transition: all var(--duration-fast);
	}
	.country-clear-btn:hover { background: var(--bg-secondary); color: var(--text-primary); }

	.country-dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		background: var(--bg-elevated);
		border: 1.5px solid var(--color-primary);
		border-radius: 0;
		z-index: 50;
		box-shadow: 0 8px 32px rgba(0,0,0,0.4);
		animation: fade-in 0.15s var(--ease-out);
	}

	.country-search-wrap {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		border-bottom: 1px solid var(--border-subtle);
	}
	.country-search-icon { color: var(--text-muted); flex-shrink: 0; }
	.country-search-input {
		flex: 1;
		border: none;
		background: transparent;
		font-family: var(--font-body);
		font-size: var(--text-sm);
		color: var(--text-primary);
		outline: none;
		padding: var(--space-1) 0;
	}
	.country-search-input::placeholder { color: var(--text-muted); }

	.country-list {
		max-height: 220px;
		overflow-y: auto;
		overscroll-behavior: contain;
	}
	.country-option {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-3);
		background: none;
		border: none;
		width: 100%;
		text-align: left;
		font-family: var(--font-body);
		font-size: var(--text-sm);
		color: var(--text-secondary);
		cursor: pointer;
		transition: background var(--duration-fast);
	}
	.country-option:hover { background: rgba(20,96,154,0.08); color: var(--text-primary); }
	.country-option.selected { background: rgba(20,96,154,0.12); color: var(--blue-400); font-weight: 600; }
	.country-option-flag { font-size: 1.1rem; flex-shrink: 0; }
	.country-option-name { flex: 1; }
	.country-no-results { padding: var(--space-4); text-align: center; font-size: var(--text-sm); color: var(--text-muted); }

	/* ─── Payment ─────────────────── */
	.payment-methods { display: flex; flex-direction: column; gap: var(--space-3); }

	.payment-option {
		padding: var(--space-4) var(--space-5);
		background: var(--bg-elevated);
		border: 2px solid var(--border-subtle);
		border-radius: 0;
		cursor: pointer;
		transition: all var(--duration-normal) var(--ease-out);
		text-align: left;
		width: 100%;
		font-family: var(--font-body);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.payment-option:hover { border-color: var(--color-primary); }
	.payment-option.selected {
		border-color: var(--color-primary);
		background: rgba(20,96,154,0.05);
		box-shadow: 0 0 0 3px rgba(20,96,154,0.12);
	}

	.payment-option-header { display: flex; align-items: center; gap: var(--space-4); }
	.payment-icon { font-size: 1.75rem; flex-shrink: 0; }
	.payment-name { font-family: var(--font-display); font-size: var(--text-base); font-weight: 700; color: var(--text-primary); }
	.payment-desc { font-size: var(--text-sm); color: var(--text-muted); margin-top: 2px; }

	.payment-radio {
		width: 1.25rem; height: 1.25rem;
		border-radius: 50%;
		border: 2px solid var(--border-default);
		margin-left: auto;
		flex-shrink: 0;
		transition: all var(--duration-fast) var(--ease-out);
		position: relative;
	}
	.payment-radio.active { border-color: var(--color-primary); }
	.payment-radio.active::after {
		content: '';
		position: absolute; inset: 3px;
		background: var(--color-primary);
		border-radius: 50%;
	}

	/* Bank details */
	.bank-details {
		background: rgba(255,255,255,0.03);
		border: 1px solid var(--border-subtle);
		border-radius: 0;
		padding: var(--space-4);
	}
	.bank-title { font-size: var(--text-xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: var(--space-3); }
	.bank-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
	.bank-info-item { display: flex; flex-direction: column; gap: 2px; }
	.bank-label { font-size: var(--text-xs); color: var(--text-muted); }
	.bank-value { font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); font-family: var(--font-display); }

	/* Crypto details */
	.crypto-details { }
	.crypto-address-wrap {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
		flex-wrap: wrap;
	}
	.crypto-address {
		font-family: monospace;
		font-size: var(--text-sm);
		color: var(--blue-400);
		background: rgba(20,96,154,0.08);
		padding: var(--space-2) var(--space-3);
		border: 1px solid rgba(20,96,154,0.2);
		word-break: break-all;
		flex: 1;
	}
	.copy-btn {
		padding: var(--space-2) var(--space-3);
		background: rgba(20,96,154,0.1);
		border: 1px solid rgba(20,96,154,0.3);
		color: var(--blue-400);
		font-size: var(--text-xs);
		font-weight: 600;
		cursor: pointer;
		font-family: var(--font-body);
		transition: all var(--duration-fast);
		white-space: nowrap;
	}
	.copy-btn:hover { background: rgba(20,96,154,0.2); }
	.crypto-hint { font-size: var(--text-xs); color: var(--text-muted); line-height: 1.5; }

	/* Manual fields */
	.manual-fields { display: flex; flex-direction: column; gap: var(--space-4); }
	.manual-instruction {
		padding: var(--space-4);
		background: rgba(20,96,154,0.08);
		border: 1px solid rgba(20,96,154,0.2);
		border-radius: 0;
		font-size: var(--text-sm);
		color: var(--blue-400);
		line-height: 1.6;
	}

	.stripe-note {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-4);
		background: rgba(96,165,250,0.08);
		border: 1px solid rgba(96,165,250,0.2);
		border-radius: 0;
		font-size: var(--text-sm);
		color: var(--color-info);
		line-height: 1.6;
	}

	/* Summary */
	.donation-summary {
		background: var(--bg-elevated);
		border: 1px solid var(--border-default);
		border-radius: 0;
		padding: var(--space-5);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.summary-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: var(--text-sm);
	}
	.summary-row span { color: var(--text-muted); }
	.summary-row strong { color: var(--text-primary); font-weight: 600; }
	.summary-total {
		padding-top: var(--space-3);
		border-top: 1px solid var(--border-subtle);
	}
	.summary-total span { font-size: var(--text-base); font-weight: 600; color: var(--text-secondary); }
	.summary-amount-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
	.summary-ves-equiv {
		font-size: var(--text-xs);
		color: var(--text-muted);
		font-family: var(--font-display);
	}

	/* Step actions */
	.step-actions { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); margin-top: var(--space-4); }
	.step-actions :global(.btn) { width: 100%; max-width: 400px; justify-content: center; }
	.submit-note { font-size: var(--text-xs); color: var(--text-muted); }

	/* Divider */
	.divider { border: none; border-top: 1px solid var(--border-subtle); margin: 0; }

	/* Responsive */
	@media (max-width: 768px) {
		.donate-card { padding: var(--space-6) var(--space-5); }
		.areas-select-grid { grid-template-columns: repeat(2, 1fr); }
		.currency-grid { grid-template-columns: repeat(2, 1fr); }
		.amount-grid { grid-template-columns: repeat(3, 1fr); }
		.form-row { grid-template-columns: 1fr; }
		.bank-info-grid { grid-template-columns: 1fr; }
	}
	@media (max-width: 480px) {
		.areas-select-grid { grid-template-columns: 1fr 1fr; }
		.currency-grid { grid-template-columns: repeat(2, 1fr); }
		.amount-grid { grid-template-columns: repeat(2, 1fr); }
		.step-connector { min-width: 20px; }
	}

	/* Stripe Elements */
	.stripe-elements-wrap { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-5) 0; }
	.stripe-ready-label { font-size: var(--text-sm); font-weight: 600; color: var(--text-secondary); }
	.btn-reset-stripe {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: var(--text-sm);
		cursor: pointer;
		font-family: var(--font-body);
		text-decoration: underline;
		padding: 0;
		transition: color var(--duration-fast);
	}
	.btn-reset-stripe:hover { color: var(--text-secondary); }

	.required { color: var(--color-error, #ef4444); }
</style>
