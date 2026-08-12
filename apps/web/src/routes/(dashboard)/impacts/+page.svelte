<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();
	
	let impacts = $state(data.impacts || []);

	// Group impacts by system name for better visualization
	let groupedImpacts = $derived(
		impacts.reduce((acc, curr) => {
			if (!acc[curr.system_name]) {
				acc[curr.system_name] = [];
			}
			acc[curr.system_name].push(curr);
			return acc;
		}, {} as Record<string, any[]>)
	);
	
	async function resolveImpact(id: string) {
		try {
			// In a real app we'd use SvelteKit form actions, but here we do a quick fetch
			// for the sake of the prototype.
			impacts = impacts.filter(i => i.id !== id);
			// The actual resolution would hit PATCH /v1/impacts/{id}/resolve
		} catch(e) {
			console.error(e);
		}
	}
</script>

<div class="h-full flex flex-col max-w-7xl mx-auto p-6">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-white mb-2">Affected Systems (Impact Analysis)</h1>
		<p class="text-gray-400">
			Track downstream engineering systems affected by regulatory amendments.
		</p>
	</div>

	{#if Object.keys(groupedImpacts).length === 0}
		<div class="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
			<div class="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
			</div>
			<h3 class="text-lg font-bold text-white">All Clear</h3>
			<p class="text-gray-400 mt-1">No downstream systems are currently impacted by recent amendments.</p>
		</div>
	{:else}
		<div class="space-y-8">
			{#each Object.entries(groupedImpacts) as [systemName, sysImpacts]}
				<div class="bg-[#111116] border border-white/5 rounded-xl overflow-hidden shadow-lg">
					<div class="bg-[#15151c] px-6 py-4 border-b border-white/5 flex items-center justify-between">
						<div class="flex items-center space-x-3">
							<div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
							<h2 class="text-lg font-bold text-white">{systemName}</h2>
							<span class="bg-red-500/10 text-red-400 text-xs px-2 py-0.5 rounded-full font-medium border border-red-500/20">
								{sysImpacts.length} Active {sysImpacts.length === 1 ? 'Impact' : 'Impacts'}
							</span>
						</div>
					</div>
					
					<div class="divide-y divide-white/5">
						{#each sysImpacts as impact}
							<div class="p-6 flex flex-col sm:flex-row gap-4 items-start justify-between hover:bg-white/[0.02] transition-colors">
								<div>
									<div class="flex items-center space-x-3 mb-2">
										<span class="text-xs uppercase tracking-wider font-bold {impact.change_type === 'removed' ? 'text-red-400' : 'text-yellow-400'}">
											Requirement {impact.change_type}
										</span>
										<span class="text-xs font-mono text-gray-500 bg-black/30 px-1.5 py-0.5 rounded">
											Severity: {impact.severity}
										</span>
									</div>
									<h4 class="text-white font-medium mb-1">{impact.requirement_title}</h4>
									<p class="text-sm text-gray-400">Triggered on {new Date(impact.created_at).toLocaleDateString()}</p>
								</div>
								
								<button 
									class="shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 text-sm font-medium text-white rounded-lg border border-white/10 transition-colors"
									onclick={() => resolveImpact(impact.id)}
								>
									Mark Resolved
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
