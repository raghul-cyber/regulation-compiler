<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	let apiKeys = $state(data.apiKeys);

	let isCreateModalOpen = $state(false);
	let keyName = $state('');
	let selectedScopes = $state<string[]>(['read-only']);
	
	let isCreating = $state(false);
	let generatedRawKey = $state<string | null>(null);

	const availableScopes = [
		{ id: 'read-only', label: 'Read Only (Policy & Controls)' },
		{ id: 'check-compliance', label: 'Check Compliance (Evaluation)' },
		{ id: 'admin', label: 'Admin (Full Access & Webhooks)' }
	];

	function toggleScope(scope: string) {
		if (selectedScopes.includes(scope)) {
			selectedScopes = selectedScopes.filter(s => s !== scope);
		} else {
			selectedScopes = [...selectedScopes, scope];
		}
	}

	async function createKey() {
		if (!keyName.trim() || selectedScopes.length === 0) return;
		isCreating = true;
		
		try {
			const res = await fetch(`${env.PUBLIC_API_URL || 'http://localhost:8000'}/v1/api-keys`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: keyName, scopes: selectedScopes })
			});
			if (!res.ok) throw new Error('Failed to create key');
			
			const result = await res.json();
			generatedRawKey = result.raw_key;
			
			await invalidateAll();
			apiKeys = data.apiKeys;
			
		} catch (e) {
			console.error(e);
			alert('Failed to create API key');
		} finally {
			isCreating = false;
		}
	}

	async function revokeKey(id: string) {
		if (!confirm('Are you sure you want to revoke this key? It will immediately stop working.')) return;
		
		try {
			const res = await fetch(`${env.PUBLIC_API_URL || 'http://localhost:8000'}/v1/api-keys/${id}`, {
				method: 'DELETE'
			});
			if (!res.ok) throw new Error('Failed to revoke key');
			
			await invalidateAll();
			apiKeys = data.apiKeys;
		} catch (e) {
			console.error(e);
			alert('Failed to revoke API key');
		}
	}

	function closeModals() {
		isCreateModalOpen = false;
		generatedRawKey = null;
		keyName = '';
		selectedScopes = ['read-only'];
	}
	
	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		alert('Copied to clipboard!');
	}
</script>

<div class="max-w-6xl mx-auto px-6 py-8">
	
	<div class="flex justify-between items-end mb-8">
		<div>
			<h1 class="text-2xl font-bold text-white mb-2">Developer API Keys</h1>
			<p class="text-gray-400 text-sm">Manage API keys used to programmatically interact with the Regulation-as-Code compiler.</p>
		</div>
		<button 
			onclick={() => isCreateModalOpen = true}
			class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]"
		>
			Generate New Key
		</button>
	</div>

	<!-- API Keys List -->
	<div class="bg-[#111116] border border-white/5 rounded-xl overflow-hidden shadow-sm">
		<table class="w-full text-left border-collapse">
			<thead>
				<tr class="bg-[#15151c] border-b border-white/5">
					<th class="py-4 px-6 text-xs font-semibold uppercase text-gray-500">Name</th>
					<th class="py-4 px-6 text-xs font-semibold uppercase text-gray-500">Prefix</th>
					<th class="py-4 px-6 text-xs font-semibold uppercase text-gray-500">Scopes</th>
					<th class="py-4 px-6 text-xs font-semibold uppercase text-gray-500">Created</th>
					<th class="py-4 px-6 text-xs font-semibold uppercase text-gray-500">Status</th>
					<th class="py-4 px-6 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-white/5">
				{#each apiKeys as key}
					<tr class="hover:bg-white/[0.02] transition-colors">
						<td class="py-4 px-6">
							<span class="text-sm font-medium text-gray-200">{key.name}</span>
						</td>
						<td class="py-4 px-6">
							<span class="text-sm font-mono text-gray-400 bg-[#0a0a0c] px-2 py-1 rounded">rac_...</span>
						</td>
						<td class="py-4 px-6">
							<div class="flex gap-2">
								{#each key.scopes as scope}
									<span class="text-[10px] uppercase px-1.5 py-0.5 rounded border border-gray-600 text-gray-400 bg-gray-800/50">
										{scope}
									</span>
								{/each}
							</div>
						</td>
						<td class="py-4 px-6">
							<span class="text-sm text-gray-500">{new Date(key.created_at).toLocaleDateString()}</span>
						</td>
						<td class="py-4 px-6">
							{#if key.revoked_at}
								<span class="text-[10px] uppercase px-2 py-1 rounded border border-red-500/30 text-red-400 bg-red-900/30">Revoked</span>
							{:else}
								<span class="text-[10px] uppercase px-2 py-1 rounded border border-green-500/30 text-green-400 bg-green-900/30">Active</span>
							{/if}
						</td>
						<td class="py-4 px-6 text-right">
							{#if !key.revoked_at}
								<button 
									onclick={() => revokeKey(key.id)}
									class="text-sm text-red-500 hover:text-red-400 font-medium"
								>
									Revoke
								</button>
							{/if}
						</td>
					</tr>
				{/each}
				{#if apiKeys.length === 0}
					<tr>
						<td colspan="6" class="py-12 text-center text-gray-500">No API keys found. Generate one to get started.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>

<!-- Create Modal -->
{#if isCreateModalOpen && !generatedRawKey}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-sm" onclick={closeModals}></div>
		
		<div class="relative bg-[#111116] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
			<div class="p-5 border-b border-white/5 flex justify-between items-center bg-[#15151c]">
				<h2 class="text-lg font-bold text-white">Generate API Key</h2>
				<button onclick={closeModals} class="text-gray-500 hover:text-white transition-colors">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
				</button>
			</div>
			
			<div class="p-6 space-y-6">
				<div>
					<label for="name" class="block text-sm font-medium text-gray-300 mb-2">Key Name</label>
					<input 
						id="name"
						type="text" 
						bind:value={keyName} 
						placeholder="e.g. Production CI/CD Runner" 
						class="w-full bg-[#1a1a24] text-sm text-gray-200 p-3 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500"
					/>
				</div>

				<div>
					<label for="scopes" class="block text-sm font-medium text-gray-300 mb-2">Select Scopes</label>
					<div class="space-y-2">
						{#each availableScopes as scope}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div 
								class="flex items-center p-3 rounded-lg border cursor-pointer transition-colors {selectedScopes.includes(scope.id) ? 'bg-blue-500/10 border-blue-500/50' : 'bg-[#15151c] border-white/5 hover:border-white/20'}"
								onclick={() => toggleScope(scope.id)}
							>
								<div class="w-5 h-5 rounded flex items-center justify-center mr-3 {selectedScopes.includes(scope.id) ? 'bg-blue-500' : 'border border-gray-600'}">
									{#if selectedScopes.includes(scope.id)}
										<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
									{/if}
								</div>
								<span class="text-sm text-gray-200">{scope.label}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
			
			<div class="p-5 border-t border-white/5 bg-[#15151c] flex justify-end space-x-3">
				<button onclick={closeModals} class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
				<button 
					onclick={createKey}
					disabled={isCreating || !keyName.trim() || selectedScopes.length === 0}
					class="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
				>
					{isCreating ? 'Generating...' : 'Generate Key'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Success Modal (Show Raw Key Once) -->
{#if generatedRawKey}
	<div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
		<div class="absolute inset-0 bg-[#0a0a0c]/90 backdrop-blur-md"></div>
		
		<div class="relative bg-[#111116] border border-blue-500/30 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
			<div class="p-8 text-center border-b border-white/5">
				<div class="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
					<svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
				</div>
				<h2 class="text-2xl font-bold text-white mb-2">Key Generated Successfully</h2>
				<p class="text-sm text-yellow-500 bg-yellow-900/20 border border-yellow-700/30 p-3 rounded-lg">
					Copy your new API key now. You won't be able to see it again!
				</p>
			</div>
			
			<div class="p-8 bg-[#15151c]">
				<div class="flex items-center space-x-2 bg-[#0a0a0c] border border-white/10 rounded-lg p-2 mb-6">
					<input 
						type="text" 
						readonly 
						value={generatedRawKey}
						class="flex-1 bg-transparent text-gray-200 font-mono text-sm px-2 focus:outline-none"
					/>
					<button 
						onclick={() => copyToClipboard(generatedRawKey as string)}
						class="bg-white/10 hover:bg-white/20 text-white p-2 rounded transition-colors"
						title="Copy to clipboard"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
					</button>
				</div>
				
				<button 
					onclick={closeModals}
					class="w-full px-5 py-3 text-sm font-medium bg-white hover:bg-gray-200 text-black rounded-lg transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
				>
					I've copied my key safely
				</button>
			</div>
		</div>
	</div>
{/if}
