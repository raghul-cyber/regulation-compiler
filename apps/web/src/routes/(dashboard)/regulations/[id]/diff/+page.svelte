<script lang="ts">
	let { data } = $props();
	
	let diffSummary = data.diffData.diff_summary || { added: [], modified: [], removed: [] };
	let added = diffSummary.added || [];
	let removed = diffSummary.removed || [];
	let modified = diffSummary.modified || [];
	
	// Default to viewing modified requirements as they are the most interesting
	let activeTab = $state<'modified' | 'added' | 'removed'>('modified');
	let selectedModifiedItem = $state<any | null>(modified.length > 0 ? modified[0] : null);

	function formatArray(arr: any) {
		if (!arr || !Array.isArray(arr)) return 'None';
		return arr.length === 0 ? 'None' : arr.join('\n');
	}
</script>

<div class="h-full flex flex-col max-w-7xl mx-auto p-6">
	<!-- Header -->
	<div class="mb-6 flex justify-between items-end border-b border-white/5 pb-6">
		<div>
			<h1 class="text-2xl font-bold text-white mb-2">Version Comparison (Diff Engine)</h1>
			<p class="text-sm text-gray-400">
				Comparing <span class="font-mono text-gray-300 bg-gray-800 px-1.5 rounded">{data.diffData.old_version?.slice(0, 8) || 'Previous'}</span> 
				with <span class="font-mono text-gray-300 bg-gray-800 px-1.5 rounded">{data.diffData.new_version?.slice(0, 8) || 'Latest'}</span>
			</p>
		</div>
		
		<!-- Tabs -->
		<div class="flex space-x-1 bg-[#15151c] p-1 rounded-lg border border-white/5">
			<button 
				class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors {activeTab === 'added' ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-gray-200'}"
				onclick={() => activeTab = 'added'}
			>
				Added ({added.length})
			</button>
			<button 
				class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors {activeTab === 'modified' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:text-gray-200'}"
				onclick={() => activeTab = 'modified'}
			>
				Modified ({modified.length})
			</button>
			<button 
				class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors {activeTab === 'removed' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-gray-200'}"
				onclick={() => activeTab = 'removed'}
			>
				Removed ({removed.length})
			</button>
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 min-h-0 flex gap-6">
		
		{#if activeTab === 'modified'}
			<!-- List of Modified Requirements -->
			<div class="w-1/3 bg-[#111116] border border-white/5 rounded-xl overflow-y-auto">
				<div class="p-4 border-b border-white/5 sticky top-0 bg-[#111116]/95 backdrop-blur z-10">
					<h3 class="text-sm font-bold text-gray-200">Changed Requirements</h3>
				</div>
				<div class="divide-y divide-white/5">
					{#each modified as item}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div 
							class="p-4 cursor-pointer transition-colors {selectedModifiedItem?.requirement_id === item.requirement_id ? 'bg-yellow-500/10 border-l-2 border-yellow-500' : 'hover:bg-white/[0.02] border-l-2 border-transparent'}"
							onclick={() => selectedModifiedItem = item}
						>
							<div class="text-sm font-medium text-white mb-1">{item.title}</div>
							<div class="text-xs text-gray-500 flex justify-between items-center mt-2">
								<span class="bg-[#1a1a24] px-1.5 py-0.5 rounded border border-white/10">
									Match: <span class="text-blue-400">{item.match_reason}</span>
								</span>
								<span class="text-yellow-500 font-medium">{Object.keys(item.field_diffs).length} fields changed</span>
							</div>
						</div>
					{/each}
					{#if modified.length === 0}
						<div class="p-8 text-center text-gray-500 text-sm">No modified requirements detected.</div>
					{/if}
				</div>
			</div>

			<!-- Visual Diff Viewer -->
			<div class="w-2/3 bg-[#111116] border border-white/5 rounded-xl overflow-y-auto flex flex-col">
				{#if selectedModifiedItem}
					<div class="p-6 border-b border-white/5 flex items-center justify-between bg-[#15151c]">
						<h2 class="text-lg font-bold text-white">{selectedModifiedItem.title}</h2>
						<span class="text-xs text-gray-400">Comparing <span class="text-red-400">Old</span> to <span class="text-green-400">New</span></span>
					</div>
					
					<div class="p-6 space-y-8">
						{#each Object.entries(selectedModifiedItem.field_diffs) as [field, diff]}
							<div class="space-y-3">
								<h4 class="text-xs font-bold uppercase tracking-wider text-gray-500">{field}</h4>
								
								<div class="grid grid-cols-2 gap-4">
									<!-- OLD VERSION -->
									<div class="bg-red-900/10 border border-red-500/20 rounded-lg p-4">
										<div class="text-[10px] uppercase font-bold text-red-500/70 mb-2">Previous Version</div>
										<div class="text-sm text-red-200 whitespace-pre-wrap font-mono leading-relaxed">
											{#if Array.isArray(diff.old)}
												{formatArray(diff.old)}
											{:else}
												{diff.old || 'None'}
											{/if}
										</div>
									</div>
									
									<!-- NEW VERSION -->
									<div class="bg-green-900/10 border border-green-500/20 rounded-lg p-4 relative">
										<div class="text-[10px] uppercase font-bold text-green-500/70 mb-2">New Version</div>
										
										<!-- Connection Arrow Graphic -->
										<div class="absolute -left-[17px] top-1/2 -translate-y-1/2 w-[14px] h-[1px] bg-white/20"></div>
										<div class="absolute -left-[3px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r border-white/20 rotate-45"></div>

										<div class="text-sm text-green-200 whitespace-pre-wrap font-mono leading-relaxed">
											{#if Array.isArray(diff.new)}
												{formatArray(diff.new)}
											{:else}
												{diff.new || 'None'}
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="m-auto text-gray-500 flex flex-col items-center">
						<svg class="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
						<p>Select a modified requirement to view field-level differences.</p>
					</div>
				{/if}
			</div>

		{:else if activeTab === 'added'}
			<div class="w-full bg-[#111116] border border-white/5 rounded-xl overflow-hidden shadow-sm">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="bg-green-500/5 border-b border-green-500/20">
							<th class="py-4 px-6 text-xs font-semibold uppercase text-green-500">New Requirement Title</th>
							<th class="py-4 px-6 text-xs font-semibold uppercase text-green-500">Type</th>
							<th class="py-4 px-6 text-xs font-semibold uppercase text-green-500">Severity</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/5">
						{#each added as item}
							<tr class="hover:bg-white/[0.02] transition-colors">
								<td class="py-4 px-6 text-sm font-medium text-white">{item.title}</td>
								<td class="py-4 px-6 text-sm text-gray-400 capitalize">{item.new_data?.type}</td>
								<td class="py-4 px-6 text-sm text-gray-400 capitalize">{item.new_data?.severity}</td>
							</tr>
						{/each}
						{#if added.length === 0}
							<tr><td colspan="3" class="py-12 text-center text-gray-500">No new requirements added in this version.</td></tr>
						{/if}
					</tbody>
				</table>
			</div>

		{:else if activeTab === 'removed'}
			<div class="w-full bg-[#111116] border border-white/5 rounded-xl overflow-hidden shadow-sm">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="bg-red-500/5 border-b border-red-500/20">
							<th class="py-4 px-6 text-xs font-semibold uppercase text-red-500">Removed Requirement Title</th>
							<th class="py-4 px-6 text-xs font-semibold uppercase text-red-500">Type</th>
							<th class="py-4 px-6 text-xs font-semibold uppercase text-red-500">Severity</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/5">
						{#each removed as item}
							<tr class="hover:bg-white/[0.02] transition-colors">
								<td class="py-4 px-6 text-sm font-medium text-gray-400 line-through decoration-red-500/50">{item.title}</td>
								<td class="py-4 px-6 text-sm text-gray-500 capitalize">{item.old_data?.type}</td>
								<td class="py-4 px-6 text-sm text-gray-500 capitalize">{item.old_data?.severity}</td>
							</tr>
						{/each}
						{#if removed.length === 0}
							<tr><td colspan="3" class="py-12 text-center text-gray-500">No requirements were removed in this version.</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
		{/if}

	</div>
</div>
