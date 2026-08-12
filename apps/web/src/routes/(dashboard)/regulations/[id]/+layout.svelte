<script lang="ts">
	import { page } from '$app/stores';
	import CommandPalette from '$lib/components/CommandPalette.svelte';

	let { children } = $props();

	// Derived state to check active tab
	let activePath = $derived($page.url.pathname);
	let regulationId = $derived($page.params.id);
</script>

<div class="min-h-screen bg-[#0a0a0c] text-gray-100 font-sans selection:bg-blue-500/30">
	<!-- Global Command Palette mounted here -->
	<CommandPalette />

	<!-- Regulation Navigation Bar -->
	<header class="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0a0a0c]/80 backdrop-blur-md">
		<div class="flex h-14 items-center px-6">
			<div class="flex items-center space-x-2 text-sm font-medium text-gray-400">
				<a href="/regulations" class="hover:text-white transition-colors">Regulations</a>
				<span>/</span>
				<span class="text-gray-200 truncate max-w-[200px]">{regulationId}</span>
			</div>

			<!-- Tabs -->
			<nav class="ml-8 flex items-center space-x-1">
				<a 
					href={`/regulations/${regulationId}`} 
					class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 {activePath === `/regulations/${regulationId}` ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
				>
					Dashboard
				</a>
				<a 
					href={`/regulations/${regulationId}/requirements`} 
					class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 {activePath.includes('/requirements') ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
				>
					Review Queue
				</a>
				<a 
					href={`/regulations/${regulationId}/reports`} 
					class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 {activePath.includes('/reports') ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
				>
					Reports
				</a>
				<a 
					href={`/regulations/${regulationId}/diff`} 
					class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 {activePath.includes('/diff') ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
				>
					Diff Viewer
				</a>
			</nav>

			<div class="ml-auto flex items-center space-x-4">
				<button class="text-xs text-gray-500 flex items-center space-x-1 bg-white/5 px-2 py-1.5 rounded-md border border-white/10 hover:bg-white/10 transition-colors pointer-events-none">
					<span>Search...</span>
					<kbd class="font-sans bg-white/10 px-1 rounded">⌘K</kbd>
				</button>
			</div>
		</div>
	</header>

	<!-- Main Content Area -->
	<main class="relative isolate">
		<!-- Sub-routes render here -->
		{@render children()}
	</main>
</div>
