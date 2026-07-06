<script lang="ts">
	interface Props {
		percent: number;          // 0–100
		label?: string;
		showPercent?: boolean;
		color?: 'orange' | 'gold' | 'success';
		height?: number;          // px
		animated?: boolean;
	}

	let {
		percent,
		label,
		showPercent = true,
		color = 'orange',
		height = 8,
		animated = true
	}: Props = $props();

	const capped = $derived(Math.min(100, Math.max(0, percent)));
	const gradients = {
		orange:  'linear-gradient(90deg, #FF5C10, #FBBF24)',
		gold:    'linear-gradient(90deg, #FBBF24, #F59E0B)',
		success: 'linear-gradient(90deg, #22c55e, #4ade80)'
	};
</script>

<div class="progress-wrapper">
	{#if label || showPercent}
		<div class="progress-meta">
			{#if label}<span class="progress-label">{label}</span>{/if}
			{#if showPercent}<span class="progress-pct">{capped.toFixed(0)}%</span>{/if}
		</div>
	{/if}
	<div class="progress-track" style="height: {height}px;" role="progressbar" aria-valuenow={capped} aria-valuemin={0} aria-valuemax={100}>
		<div
			class="progress-fill"
			class:animated
			style="width: {capped}%; background: {gradients[color]};"
		></div>
	</div>
</div>

<style>
	.progress-wrapper { width: 100%; }

	.progress-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.progress-label {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		font-weight: 500;
	}

	.progress-pct {
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: 700;
		color: var(--gold-400);
	}

	.progress-fill {
		height: 100%;
		border-radius: var(--radius-full);
		position: relative;
		overflow: hidden;
		transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.progress-fill.animated::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
		animation: shimmer 2.5s ease-in-out infinite;
	}

	@keyframes shimmer {
		0%   { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}
</style>
