<script lang="ts">
	// Svelte 5 component for Maintenance mode
</script>

<div class="maintenance-container">
	<div class="glow-orb orb-1"></div>
	<div class="glow-orb orb-2"></div>

	<div class="maintenance-card">
		<div class="icon-container">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="maintenance-icon">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.42 15.17L17.25 21A2.67 2.67 0 1021 17.25l-5.83-5.83m-3.75 3.75a3.75 3.75 0 11-5.3-5.3 3.75 3.75 0 015.3 5.3zm0 0l-5.83 5.83m5.83-5.83V9m0 6.17H9m1.5-6.17a3.75 3.75 0 10-5.3-5.3 3.75 3.75 0 005.3 5.3zm0 0L15 3.75M10.5 9h6.17m-6.17 0V2.83" />
			</svg>
			<div class="pulse-ring"></div>
		</div>

		<h1 class="title">Web fuera de servicio</h1>
	</div>
</div>

<style>
	.maintenance-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: radial-gradient(circle at center, var(--navy-800) 0%, var(--navy-900) 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		box-sizing: border-box;
		z-index: var(--z-modal);
		overflow: hidden;
		font-family: var(--font-body);
		color: var(--text-inverse);
	}

	/* Glowing decorative background orbs */
	.glow-orb {
		position: absolute;
		border-radius: var(--radius-full);
		filter: blur(120px);
		opacity: 0.15;
		pointer-events: none;
		z-index: 1;
	}

	.orb-1 {
		top: 10%;
		left: 15%;
		width: 400px;
		height: 400px;
		background: var(--blue-500);
		animation: float-slow 20s infinite alternate ease-in-out;
	}

	.orb-2 {
		bottom: 10%;
		right: 15%;
		width: 500px;
		height: 500px;
		background: var(--blue-300);
		animation: float-slow 25s infinite alternate-reverse ease-in-out;
	}

	.maintenance-card {
		position: relative;
		z-index: 2;
		background: rgba(12, 26, 42, 0.45);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		padding: var(--space-10) var(--space-8);
		max-width: var(--container-sm);
		width: 100%;
		text-align: center;
		box-shadow: var(--shadow-xl);
		animation: fade-in-up 0.8s var(--ease-out) forwards;
	}

	.icon-container {
		position: relative;
		width: 96px;
		height: 96px;
		margin: 0 auto var(--space-8) auto;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(20, 96, 154, 0.15);
		border-radius: var(--radius-full);
		border: 1px solid rgba(20, 96, 154, 0.3);
	}

	.maintenance-icon {
		width: 44px;
		height: 44px;
		color: var(--blue-300);
		animation: wrench-wiggle 4s ease-in-out infinite;
		z-index: 2;
	}

	.pulse-ring {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: var(--radius-full);
		border: 2px solid var(--blue-500);
		opacity: 0;
		animation: ring-pulse 3s infinite ease-out;
		z-index: 1;
	}

	.title {
		font-family: var(--font-display);
		font-size: var(--text-4xl);
		font-weight: 800;
		margin: 0;
		color: #ffffff;
		letter-spacing: -0.02em;
		background: linear-gradient(135deg, #ffffff 40%, var(--blue-100) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	/* Animations */
	@keyframes float-slow {
		0% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(30px, -40px) scale(1.1);
		}
		100% {
			transform: translate(-20px, 20px) scale(0.95);
		}
	}

	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes wrench-wiggle {
		0%, 100% {
			transform: rotate(0deg);
		}
		10% {
			transform: rotate(8deg);
		}
		20% {
			transform: rotate(-6deg);
		}
		30% {
			transform: rotate(4deg);
		}
		40% {
			transform: rotate(-2deg);
		}
		50% {
			transform: rotate(0deg);
		}
	}

	@keyframes ring-pulse {
		0% {
			transform: scale(0.95);
			opacity: 0.5;
		}
		100% {
			transform: scale(1.4);
			opacity: 0;
		}
	}

	/* Responsive design improvements */
	@media (max-width: 640px) {
		.maintenance-card {
			padding: var(--space-8) var(--space-5);
		}
		.title {
			font-size: var(--text-3xl);
		}
	}
</style>
