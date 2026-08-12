<script lang="ts">
	import { env } from '$env/dynamic/public';
	
	let { data } = $props();
	let requirements = $state(data.requirements);
	let selectedReqId = $state(data.selectedReqId || (requirements.length > 0 ? requirements[0].id : null));
	
	let selectedReq = $derived(requirements.find(r => r.id === selectedReqId));
	let reviewNote = $state('');
	let isUpdating = $state(false);

	async function updateStatus(newStatus: string) {
		if (!selectedReq) return;
		
		const prevStatus = selectedReq.validation_status;
		
		// Optimistic UI update
		selectedReq.validation_status = newStatus;
		isUpdating = true;
		
		try {
			const res = await fetch(`${env.PUBLIC_API_URL || 'http://localhost:8000'}/v1/requirements/${selectedReq.id}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus, reviewer_note: reviewNote })
			});
			
			if (!res.ok) throw new Error('Failed to update status');
			reviewNote = ''; // clear on success
		} catch (e) {
			console.error(e);
			// Rollback
			selectedReq.validation_status = prevStatus;
			alert("Failed to update status. Please try again.");
		} finally {
			isUpdating = false;
		}
	}

	async function exportJSON() {
		try {
			const res = await fetch(`${env.PUBLIC_API_URL || 'http://localhost:8000'}/v1/regulations/${data.regulationId}/requirements/export`);
			if (!res.ok) throw new Error('Failed to export');
			
			const json = await res.json();
			const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `requirements_export_${data.regulationId}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch(e) {
			alert('Export failed.');
		}
	}

	function getSeverityColor(sev: string) {
		if (sev === 'critical') return 'bg-red-900/50 text-red-400 border-red-500/20';
		if (sev === 'high') return 'bg-orange-900/50 text-orange-400 border-orange-500/20';
		if (sev === 'medium') return 'bg-yellow-900/50 text-yellow-400 border-yellow-500/20';
		return 'bg-blue-900/50 text-blue-400 border-blue-500/20';
	}

	function getStatusColor(stat: string) {
		if (stat === 'approved') return 'bg-green-900/50 text-green-400 border-green-500/20';
		if (stat === 'pending_review') return 'bg-purple-900/50 text-purple-400 border-purple-500/20';
		return 'bg-gray-800 text-gray-400 border-gray-600';
	}
</script>

<div class="h-[calc(100vh-56px)] flex overflow-hidden">
	
	<!-- Left Panel: Browser List -->
	<aside class="w-1/3 border-r border-white/10 bg-[#0a0a0c] flex flex-col">
		<div class="p-4 border-b border-white/10 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-gray-200">Review Queue</h2>
			<button 
				onclick={exportJSON}
				class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors flex items-center space-x-2 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
			>
				<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
				<span>Export JSON</span>
			</button>
		</div>
		
		<div class="flex-1 overflow-y-auto p-2 space-y-1">
			{#each requirements as req}
				<button 
					class="w-full text-left p-3 rounded-lg transition-colors border {selectedReqId === req.id ? 'bg-blue-500/10 border-blue-500/30' : 'bg-transparent border-transparent hover:bg-white/5'}"
					onclick={() => selectedReqId = req.id}
				>
					<div class="flex justify-between items-start mb-1">
						<span class="text-xs font-mono text-gray-500">{req.reference_label || 'N/A'}</span>
						{#if req.meta_data?.potential_duplicates?.length > 0}
							<span class="text-[10px] uppercase bg-amber-900/40 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded">Duplicates?</span>
						{/if}
					</div>
					<h3 class="text-sm font-medium text-gray-200 truncate">{req.title}</h3>
					<div class="flex space-x-2 mt-2">
						<span class="text-[10px] uppercase px-1.5 py-0.5 rounded border {getSeverityColor(req.severity)}">{req.severity}</span>
						<span class="text-[10px] uppercase px-1.5 py-0.5 rounded border {getStatusColor(req.validation_status)}">{req.validation_status.replace('_', ' ')}</span>
					</div>
				</button>
			{/each}
		</div>
	</aside>

	<!-- Right Panel: Detail View -->
	<main class="flex-1 overflow-y-auto bg-[#0a0a0c] p-8">
		{#if selectedReq}
			<div class="max-w-3xl mx-auto space-y-8">
				
				<!-- Header & Controls -->
				<div class="flex justify-between items-start">
					<div>
						<h1 class="text-2xl font-bold text-white mb-2">{selectedReq.title}</h1>
						<div class="flex space-x-3 text-sm text-gray-400">
							<span><strong class="text-gray-300">Type:</strong> {selectedReq.type}</span>
							<span>&bull;</span>
							<span><strong class="text-gray-300">Ref:</strong> {selectedReq.reference_label}</span>
						</div>
					</div>
					
					<div class="bg-[#111116] p-4 rounded-xl border border-white/5 space-y-3 min-w-[250px] shadow-[0_0_30px_rgba(0,0,0,0.5)]">
						<h3 class="text-xs font-semibold uppercase text-gray-500">Review Action</h3>
						<textarea 
							bind:value={reviewNote} 
							placeholder="Optional reviewer note..." 
							class="w-full bg-[#1a1a24] text-sm text-gray-200 p-2 rounded border border-white/10 focus:outline-none focus:border-blue-500 resize-none h-16"
						></textarea>
						<div class="flex space-x-2">
							<button 
								disabled={isUpdating}
								onclick={() => updateStatus('approved')}
								class="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-medium py-1.5 rounded transition-colors disabled:opacity-50"
							>Approve</button>
							<button 
								disabled={isUpdating}
								onclick={() => updateStatus('draft')}
								class="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-1.5 rounded transition-colors disabled:opacity-50"
							>Reject</button>
						</div>
					</div>
				</div>

				<!-- Source Context -->
				{#if selectedReq.source_text}
				<div class="bg-blue-900/10 border border-blue-500/20 rounded-xl p-5 relative overflow-hidden">
					<div class="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
					<h3 class="text-xs font-semibold uppercase text-blue-400 mb-2">Original Legal Text</h3>
					<p class="text-sm text-gray-300 font-serif leading-relaxed">
						"{selectedReq.source_text}"
					</p>
				</div>
				{/if}

				<!-- Extracted Data -->
				<div class="grid grid-cols-2 gap-6">
					<div>
						<h3 class="text-xs font-semibold uppercase text-gray-500 mb-2">Description</h3>
						<p class="text-sm text-gray-300 leading-relaxed bg-[#111116] border border-white/5 p-4 rounded-xl">{selectedReq.description}</p>
					</div>
					
					<div class="space-y-6">
						{#if selectedReq.conditions && selectedReq.conditions.length > 0}
							<div>
								<h3 class="text-xs font-semibold uppercase text-gray-500 mb-2">Conditions</h3>
								<ul class="list-disc list-inside text-sm text-gray-300 space-y-1 bg-[#111116] border border-white/5 p-4 rounded-xl">
									{#each selectedReq.conditions as c}<li>{c}</li>{/each}
								</ul>
							</div>
						{/if}

						{#if selectedReq.actions && selectedReq.actions.length > 0}
							<div>
								<h3 class="text-xs font-semibold uppercase text-gray-500 mb-2">Required Actions</h3>
								<ul class="list-disc list-inside text-sm text-gray-300 space-y-1 bg-[#111116] border border-white/5 p-4 rounded-xl">
									{#each selectedReq.actions as a}<li>{a}</li>{/each}
								</ul>
							</div>
						{/if}
						
						{#if selectedReq.evidence_required && selectedReq.evidence_required.length > 0}
							<div>
								<h3 class="text-xs font-semibold uppercase text-gray-500 mb-2">Evidence Needed</h3>
								<ul class="list-disc list-inside text-sm text-gray-300 space-y-1 bg-[#111116] border border-white/5 p-4 rounded-xl">
									{#each selectedReq.evidence_required as e}<li>{e}</li>{/each}
								</ul>
							</div>
						{/if}
					</div>
				</div>

			</div>
		{:else}
			<div class="h-full flex items-center justify-center text-gray-500">
				Select a requirement to review
			</div>
		{/if}
	</main>
</div>
