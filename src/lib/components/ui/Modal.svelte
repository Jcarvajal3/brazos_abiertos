<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		open: boolean;
		title?: string;
		maxWidth?: string;
		onclose?: () => void;
		children: import('svelte').Snippet;
		footer?: import('svelte').Snippet;
	}

	let {
		open = $bindable(),
		title,
		maxWidth = '540px',
		onclose,
		children,
		footer
	}: Props = $props();

	function handleClose() {
		open = false;
		onclose?.();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) handleClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') handleClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="modal-backdrop animate-fade-in"
		onclick={handleBackdropClick}
		onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBackdropClick(e as unknown as MouseEvent); }}
		role="dialog"
		aria-modal="true"
		aria-label={title}
		tabindex="-1"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="modal-content"
			style="max-width: {maxWidth};"
			transition:scale={{ duration: 250, easing: cubicOut, start: 0.92 }}
		>
			<div class="modal-header">
				{#if title}
					<h2 class="modal-title">{title}</h2>
				{/if}
				<button class="modal-close" onclick={handleClose} aria-label="Cerrar">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
						<path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
					</svg>
				</button>
			</div>

			<div class="modal-body">
				{@render children()}
			</div>

			{#if footer}
				<div class="modal-footer">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-6);
	}

	.modal-title {
		font-size: var(--text-xl);
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.modal-close {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-md);
		color: var(--text-muted);
		cursor: pointer;
		border: none;
		background: transparent;
		transition: background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);
		flex-shrink: 0;
	}

	.modal-close:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--text-primary);
	}

	.modal-footer {
		margin-top: var(--space-6);
		padding-top: var(--space-6);
		border-top: 1px solid var(--border-subtle);
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
	}
</style>
