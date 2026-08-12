<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { env } from '$env/dynamic/public';

	let isOpen = $state(false);
	let search = $state('');
	let searchResults = $state<any[]>([]);
	let isSearching = $state(false);

	// Derived logic for navigation context
	let regulationId = $derived($page.params.id);

	function togglePalette() {
		isOpen = !isOpen;
		if (isOpen) {
			setTimeout(() => document.getElementById('cmd-palette-input')?.focus(), 50);
		} else {
			search = '';
			searchResults = [];
		}
	}

	onMount(() => {
		const handleKeydown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				togglePalette();
			}
			if (e.key === 'Escape' && isOpen) {
				togglePalette();
			}
		};

		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	function handleAction(path: string) {
		goto(path);
		togglePalette();
	}

	// Real-time search effect
	$effect(() => {
		if (search.length > 2 && regulationId) {
			isSearching = true;
			// Call the real GET /requirements endpoint with the search filter
			fetch(`${env.PUBLIC_API_URL || 'http://localhost:8000'}/v1/regulations/${regulationId}/requirements?search=${encodeURIComponent(search)}&limit=5`, {
				headers: {
					// We'd pass the auth token here in a real client setup via a store
					// For demonstration of the palette wiring, assuming public/mock auth allows it or relying on cookie
					'Content-Type': 'application/json'
				}
			})
			.then(r => r.json())
			.then(data => {
				searchResults = data.data || [];
			})
			.finally(() => {
				isSearching = false;
			});
		} else {
			searchResults = [];
		}
	});
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
		<!-- Backdrop -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 bg-[#0a0a0c]/60 backdrop-blur-sm transition-opacity" onclick={togglePalette}></div>

		<!-- Palette -->
		<div class="relative w-full max-w-2xl bg-[#111116] border border-white/10 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5),0_0_15px_rgba(255,255,255,0.03)] overflow-hidden">
			<div class="flex items-center px-4 py-3 border-b border-white/5">
				<svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
				<input 
					id="cmd-palette-input"
					type="text" 
					bind:value={search}
					placeholder="Type a command or search for requirements..." 
					class="w-full bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none text-base font-medium"
					autocomplete="off"
				>
				{#if isSearching}
					<div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
				{/if}
				<button onclick={togglePalette} class="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded border border-white/10 hover:bg-white/10 hover:text-white transition-colors">ESC</button>
			</div>

			<div class="max-h-[60vh] overflow-y-auto p-2">
				{#if search.length > 2 && searchResults.length > 0}
					<div class="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 pt-3 pb-2">Requirement Results</div>
					{#each searchResults as req}
						<button onclick={() => handleAction(`/regulations/${regulationId}/requirements?req_id=${req.id}`)} class="w-full flex flex-col px-3 py-2 text-left rounded-lg hover:bg-blue-500/10 transition-colors group">
							<div class="flex items-center justify-between w-full">
								<span class="text-sm font-medium text-gray-200 group-hover:text-blue-400 truncate pr-2">{req.title}</span>
								{#if req.combined_score}
									<span class="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded {req.combined_score > 0.8 ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400'}">
										{(req.combined_score * 100).toFixed(0)}% Match
									</span>
								{/if}
							</div>
							<span class="text-xs text-gray-500 truncate mt-0.5">{req.description}</span>
						</button>
					{/each}
				{/if}

				{#if search.length <= 2}
					<div class="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 pt-3 pb-2">Regulation Context</div>
					{#if regulationId}
						<button onclick={() => handleAction(`/regulations/${regulationId}`)} class="w-full flex items-center justify-between px-3 py-3 text-left rounded-lg hover:bg-blue-500/10 hover:text-blue-400 text-gray-300 transition-colors group">
							<div class="flex items-center">
								<svg class="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
								<span>Go to Dashboard</span>
							</div>
						</button>
						<button onclick={() => handleAction(`/regulations/${regulationId}/requirements`)} class="w-full flex items-center justify-between px-3 py-3 text-left rounded-lg hover:bg-blue-500/10 hover:text-blue-400 text-gray-300 transition-colors group">
							<div class="flex items-center">
								<svg class="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
								<span>Open Review Queue</span>
							</div>
						</button>
					{:else}
						<div class="px-3 py-2 text-sm text-gray-500 italic">No active regulation context.</div>
					{/if}
					
					<div class="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 pt-4 pb-2">Global Actions</div>
					<button onclick={() => handleAction('/regulations')} class="w-full flex items-center px-3 py-3 text-left rounded-lg hover:bg-white/5 text-gray-300 transition-colors">
						<svg class="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
						<span>Browse All Regulations</span>
					</button>
					<button onclick={() => handleAction('/impacts')} class="w-full flex items-center px-3 py-3 text-left rounded-lg hover:bg-white/5 text-gray-300 transition-colors">
						<svg class="w-5 h-5 mr-3 text-red-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
						<span>Affected Systems (Impacts)</span>
					</button>
					<button onclick={() => handleAction('/regulations/upload')} class="w-full flex items-center px-3 py-3 text-left rounded-lg hover:bg-white/5 text-gray-300 transition-colors">
						<svg class="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
						<span>Upload New Document</span>
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
