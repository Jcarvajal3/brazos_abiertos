<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { toast, type Toast } from '$lib/stores/toast';

	const ICONS: Record<Toast['type'], string> = {
		success: '✓',
		error:   '✕',
		warning: '⚠',
		info:    'ℹ'
	};
</script>

<div class="toast-container" aria-live="polite" aria-atomic="false">
	{#each $toast as t (t.id)}
		<div
			class="toast toast-{t.type}"
			role="alert"
			animate:flip={{ duration: 300 }}
			in:fly={{ x: 80, duration: 350 }}
			out:fly={{ x: 80, duration: 250 }}
		>
			<span class="toast-icon toast-icon-{t.type}">{ICONS[t.type]}</span>
			<div class="toast-text">
				<p class="toast-title">{t.title}</p>
				{#if t.message}
					<p class="toast-message">{t.message}</p>
				{/if}
			</div>
			<button class="toast-dismiss" onclick={() => toast.remove(t.id)} aria-label="Descartar">
				<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
					<path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
				</svg>
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-icon {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.toast-icon-success { background: rgba(34,197,94,0.2);   color: #4ade80; }
	.toast-icon-error   { background: rgba(239,68,68,0.2);   color: #f87171; }
	.toast-icon-warning { background: rgba(251,191,36,0.2);  color: var(--gold-400); }
	.toast-icon-info    { background: rgba(96,165,250,0.2);  color: #93c5fd; }

	.toast-text { flex: 1; min-width: 0; }

	.toast-title {
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.toast-message {
		font-size: var(--text-xs);
		color: var(--text-secondary);
		margin-top: 0.2rem;
		line-height: 1.4;
	}

	.toast-dismiss {
		color: var(--text-muted);
		cursor: pointer;
		border: none;
		background: none;
		padding: 0.1rem;
		border-radius: var(--radius-sm);
		transition: color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out);
		flex-shrink: 0;
	}

	.toast-dismiss:hover {
		color: var(--text-primary);
		background: rgba(255,255,255,0.08);
	}
</style>
