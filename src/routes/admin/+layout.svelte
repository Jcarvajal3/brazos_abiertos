<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { onMount, onDestroy } from 'svelte';
	import Toaster from '$lib/components/ui/Toaster.svelte';
	import { createSupabaseClient } from '$lib/supabase';
	import logo from '$lib/assets/logo.png';
	import type { LayoutData } from './$types';
	import type { RealtimeChannel } from '@supabase/supabase-js';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	let sidebarOpen = $state(false);
	let pendingDonations = $state(data.pendingDonations ?? 0);
	let pendingProjects = $state(data.pendingProjects ?? 0);
	let channel: RealtimeChannel | null = null;

	const supabase = createSupabaseClient();

	onMount(() => {
		// Subscribe to donation status changes to update badge in real-time
		channel = supabase
			.channel('admin-pending-counts')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, async () => {
				// Refetch counts when any donation changes
				const { count } = await supabase
					.from('donations')
					.select('id', { count: 'exact', head: true })
					.eq('payment_status', 'pending')
					.in('payment_method', ['pago_movil', 'transferencia']);
				pendingDonations = count ?? 0;
			})
			.on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, async () => {
				const { count } = await supabase
					.from('projects')
					.select('id', { count: 'exact', head: true })
					.eq('status', 'pending');
				pendingProjects = count ?? 0;
			})
			.subscribe();
	});

	onDestroy(() => {
		channel?.unsubscribe();
	});

	const navItems = [
		{ href: '/admin',             icon: '📊', label: 'Dashboard',   id: 'nav-dashboard',   badge: 0 },
		{ href: '/admin/donaciones',  icon: '💳', label: 'Donaciones',  id: 'nav-donaciones',  get badge() { return pendingDonations; } },
		{ href: '/admin/proyectos',   icon: '🏗️', label: 'Proyectos',   id: 'nav-proyectos',   get badge() { return pendingProjects; } },
		{ href: '/',                  icon: '🌐', label: 'Ver sitio',   id: 'nav-sitio',       badge: 0 },
	];

	function isActive(href: string) {
		if (href === '/admin') return $page.url.pathname === '/admin';
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="admin-shell">
	<!-- Sidebar -->
	<aside class="sidebar" class:open={sidebarOpen} aria-label="Navegación del panel de administración">
		<div class="sidebar-header">
			<a href="/admin" class="sidebar-logo">
				<div class="sidebar-logo-container">
					<img src={logo} alt="Brazos Abiertos" class="sidebar-logo-img" />
				</div>
				<span class="sidebar-admin-badge">Admin</span>
			</a>
		</div>

		<nav class="sidebar-nav" aria-label="Secciones del panel">
			<ul role="list">
				{#each navItems as item}
					<li>
						<a
						href={item.href}
						id={item.id}
						class="nav-item"
						class:active={isActive(item.href)}
						aria-current={isActive(item.href) ? 'page' : undefined}
						onclick={() => (sidebarOpen = false)}
					>
						<span class="nav-icon" aria-hidden="true">{item.icon}</span>
						<span class="nav-label">{item.label}</span>
						{#if item.badge > 0}
							<span class="nav-badge" aria-label="{item.badge} pendientes">{item.badge > 99 ? '99+' : item.badge}</span>
						{/if}
					</a>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="sidebar-footer">
			<div class="admin-profile">
				<div class="admin-avatar">
					{data.adminUser.name.charAt(0).toUpperCase()}
				</div>
				<div class="admin-info">
					<p class="admin-name">{data.adminUser.name}</p>
					<p class="admin-email">{data.adminUser.email}</p>
				</div>
			</div>

			<form method="POST" action="/admin?/logout" use:enhance>
				<button type="submit" class="logout-btn" id="admin-logout">
					<svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/>
					</svg>
					Cerrar sesión
				</button>
			</form>
		</div>
	</aside>

	<!-- Mobile overlay -->
	{#if sidebarOpen}
		<button
			class="sidebar-overlay"
			onclick={() => (sidebarOpen = false)}
			aria-label="Cerrar menú"
		></button>
	{/if}

	<!-- Main content -->
	<div class="admin-main">
		<!-- Top bar (mobile) -->
		<header class="admin-topbar">
			<button
				class="topbar-menu-btn"
				onclick={() => (sidebarOpen = !sidebarOpen)}
				aria-label="Abrir menú"
				aria-expanded={sidebarOpen}
			>
				<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
				</svg>
			</button>
			<span class="topbar-title">Panel de administración</span>
		</header>

		<div class="admin-content">
			{@render children()}
		</div>
	</div>
</div>

<Toaster />

<style>
	:global(html, body) { height: 100%; overflow: hidden; }

	.admin-shell {
		display: flex;
		height: 100vh;
		overflow: hidden;
		background: #06060d;
	}

	/* ─── Sidebar ──────────────────── */
	.sidebar {
		width: 260px;
		min-width: 260px;
		height: 100vh;
		background: rgba(12, 12, 22, 0.98);
		border-right: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		position: relative;
		z-index: 20;
		overflow-y: auto;
		flex-shrink: 0;
	}

	.sidebar-header {
		padding: var(--space-5) var(--space-5);
		border-bottom: 1px solid var(--border-subtle);
		flex-shrink: 0;
	}

	.sidebar-logo {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-2);
		text-decoration: none;
	}

	.sidebar-logo-container {
		background: #faf7f0;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		box-shadow: inset 0 1px 2px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.2);
	}

	.sidebar-logo-img {
		height: 28px;
		width: auto;
		object-fit: contain;
	}

	.sidebar-admin-badge {
		font-family: var(--font-display);
		font-size: var(--text-xs);
		font-weight: 700;
		color: var(--orange-400);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		padding-left: var(--space-1);
	}

	.sidebar-nav {
		flex: 1;
		padding: var(--space-4) var(--space-3);
		overflow-y: auto;
	}

	.sidebar-nav ul { list-style: none; display: flex; flex-direction: column; gap: var(--space-1); }

	.nav-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--text-secondary);
		font-size: var(--text-sm);
		font-weight: 500;
		transition: all var(--duration-fast) var(--ease-out);
	}
	.nav-item:hover {
		background: rgba(255, 255, 255, 0.06);
		color: var(--text-primary);
	}
	.nav-item.active {
		background: rgba(255, 92, 16, 0.12);
		color: var(--orange-400);
		border: 1px solid rgba(255, 92, 16, 0.25);
	}
	.nav-icon { font-size: 1.1rem; flex-shrink: 0; line-height: 1; }
	.nav-label { font-family: var(--font-display); font-weight: 600; flex: 1; }
	.nav-badge {
		min-width: 20px;
		height: 20px;
		padding: 0 5px;
		border-radius: var(--radius-full);
		background: var(--orange-500);
		color: white;
		font-size: 11px;
		font-weight: 800;
		font-family: var(--font-display);
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		flex-shrink: 0;
		animation: badge-pop 0.3s var(--ease-out);
	}
	@keyframes badge-pop {
		0% { transform: scale(0.5); opacity: 0; }
		100% { transform: scale(1); opacity: 1; }
	}

	/* Sidebar Footer */
	.sidebar-footer {
		padding: var(--space-4) var(--space-4);
		border-top: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		flex-shrink: 0;
	}

	.admin-profile {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.admin-avatar {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--orange-500), var(--gold-400));
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-display);
		font-size: var(--text-sm);
		font-weight: 700;
		color: white;
		flex-shrink: 0;
	}

	.admin-info { min-width: 0; flex: 1; }
	.admin-name { font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.admin-email { font-size: var(--text-xs); color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

	.logout-btn {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-muted);
		background: none;
		border: 1px solid var(--border-subtle);
		cursor: pointer;
		width: 100%;
		transition: all var(--duration-fast) var(--ease-out);
		font-family: var(--font-body);
	}
	.logout-btn:hover {
		color: #f87171;
		border-color: rgba(239, 68, 68, 0.3);
		background: rgba(239, 68, 68, 0.08);
	}

	/* ─── Main Content ──────────── */
	.admin-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	.admin-topbar {
		display: none;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--border-subtle);
		background: rgba(12, 12, 22, 0.95);
		flex-shrink: 0;
	}

	.topbar-menu-btn {
		background: none;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		padding: var(--space-2);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--duration-fast);
	}
	.topbar-menu-btn:hover { background: rgba(255,255,255,0.06); }

	.topbar-title {
		font-family: var(--font-display);
		font-size: var(--text-base);
		font-weight: 700;
		color: var(--text-primary);
	}

	.admin-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-8);
	}

	/* Mobile overlay */
	.sidebar-overlay {
		display: none;
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		z-index: 19;
		border: none;
		cursor: pointer;
	}

	/* ─── Responsive ─────────────── */
	@media (max-width: 1024px) {
		.sidebar {
			position: fixed;
			left: -260px;
			top: 0;
			transition: left var(--duration-normal) var(--ease-out);
			z-index: 30;
		}
		.sidebar.open { left: 0; }
		.sidebar-overlay { display: block; }
		.admin-topbar { display: flex; }
		.admin-content { padding: var(--space-5); }
	}
</style>
