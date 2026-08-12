<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	let reports = $state(data.reports);

	let isModalOpen = $state(false);
	let selectedReportType = $state('executive_summary');
	let isGenerating = $state(false);

	const reportTypes = [
		{ id: 'executive_summary', title: 'Executive Summary', desc: 'High-level overview of total requirements and key obligations.' },
		{ id: 'technical', title: 'Technical System Mapping', desc: 'Detailed mapping of required technical actions.' },
		{ id: 'audit_evidence', title: 'Audit Evidence', desc: 'Comprehensive list of required evidence and documentation.' },
		{ id: 'gap_analysis', title: 'Gap Analysis', desc: 'Highlights missing controls and critical risk areas.' },
		{ id: 'checklist', title: 'Implementation Checklist', desc: 'Actionable checklist for compliance teams.' }
	];

	async function generateReport() {
		isGenerating = true;
		try {
			const res = await fetch(`${env.PUBLIC_API_URL || 'http://localhost:8000'}/v1/reports`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					regulation_id: data.regulationId,
					report_type: selectedReportType
				})
			});
			if (!res.ok) throw new Error('Failed to start report generation');
			
			isModalOpen = false;
			// Optimistically poll for completion or just invalidate to show "generating" state
			await invalidateAll();
			// Re-assign reports from new data
			reports = data.reports;
		} catch (e) {
			console.error(e);
			alert('Failed to trigger report generation.');
		} finally {
			isGenerating = false;
		}
	}
	
	function getStatusColor(status: string) {
		if (status === 'completed') return 'text-green-400 bg-green-900/30 border-green-500/30';
		if (status === 'failed') return 'text-red-400 bg-red-900/30 border-red-500/30';
		return 'text-blue-400 bg-blue-900/30 border-blue-500/30 animate-pulse';
	}
</script>

<div class="max-w-6xl mx-auto px-6 py-8">
	
	<div class="flex justify-between items-end mb-8">
		<div>
			<h1 class="text-2xl font-bold text-white mb-2">Reports Library</h1>
			<p class="text-gray-400 text-sm">Download immutable, point-in-time compliance reports generated from your enforceable requirements.</p>
		</div>
		<button 
			onclick={() => isModalOpen = true}
			class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]"
		>
			Generate New Report
		</button>
	</div>

	<!-- Reports Grid -->
	{#if reports.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each reports as report}
				<div class="bg-[#111116] border border-white/5 rounded-xl p-5 flex flex-col hover:border-white/10 transition-colors shadow-sm">
					<div class="flex justify-between items-start mb-4">
						<div class="bg-white/5 p-2 rounded-lg border border-white/10">
							<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
						</div>
						<span class="text-xs uppercase px-2 py-1 rounded border {getStatusColor(report.status)}">
							{report.status}
						</span>
					</div>
					
					<h3 class="text-base font-semibold text-gray-100 mb-1 capitalize">
						{report.report_type.replace('_', ' ')}
					</h3>
					<p class="text-xs text-gray-500 mb-6 flex-1">
						Generated on {new Date(report.generated_at).toLocaleDateString()} at {new Date(report.generated_at).toLocaleTimeString()}
					</p>
					
					{#if report.status === 'completed' && report.download_url}
						<a 
							href={report.download_url} 
							target="_blank" 
							class="w-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-sm font-medium py-2 rounded border border-white/10 transition-colors flex justify-center items-center"
						>
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
							Download PDF
						</a>
					{:else if report.status === 'generating'}
						<button disabled class="w-full bg-transparent text-gray-600 border border-gray-800 text-sm font-medium py-2 rounded cursor-not-allowed flex justify-center items-center">
							<div class="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
							Processing...
						</button>
					{:else}
						<button disabled class="w-full bg-red-900/20 text-red-500 border border-red-900/50 text-sm font-medium py-2 rounded cursor-not-allowed">
							Generation Failed
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="w-full border border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
			<div class="bg-white/5 p-4 rounded-full mb-4">
				<svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
			</div>
			<h3 class="text-lg font-semibold text-gray-200 mb-2">No Reports Yet</h3>
			<p class="text-gray-500 text-sm max-w-sm mb-6">Generate your first point-in-time compliance report to share with stakeholders or auditors.</p>
			<button 
				onclick={() => isModalOpen = true}
				class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10"
			>
				Generate Report
			</button>
		</div>
	{/if}

</div>

<!-- Generate Modal -->
{#if isModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-sm" onclick={() => isModalOpen = false}></div>
		
		<div class="relative bg-[#111116] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
			<div class="p-5 border-b border-white/5 flex justify-between items-center bg-[#15151c]">
				<h2 class="text-lg font-bold text-white">Generate New Report</h2>
				<button onclick={() => isModalOpen = false} class="text-gray-500 hover:text-white transition-colors">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
				</button>
			</div>
			
			<div class="p-6 overflow-y-auto">
				<p class="text-sm text-gray-400 mb-6">Select a report template. The system will compile the current state of all approved requirements into a signed PDF.</p>
				
				<div class="space-y-3">
					{#each reportTypes as type}
						<button 
							onclick={() => selectedReportType = type.id}
							class="w-full text-left p-4 rounded-xl border transition-all {selectedReportType === type.id ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.1)]' : 'bg-[#15151c] border-white/5 hover:border-white/20'}"
						>
							<div class="flex items-center justify-between mb-1">
								<span class="font-semibold text-gray-100">{type.title}</span>
								{#if selectedReportType === type.id}
									<div class="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
										<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
									</div>
								{:else}
									<div class="w-4 h-4 rounded-full border border-gray-600"></div>
								{/if}
							</div>
							<p class="text-xs text-gray-500">{type.desc}</p>
						</button>
					{/each}
				</div>
			</div>
			
			<div class="p-5 border-t border-white/5 bg-[#15151c] flex justify-end space-x-3">
				<button onclick={() => isModalOpen = false} class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
				<button 
					onclick={generateReport}
					disabled={isGenerating}
					class="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
				>
					{#if isGenerating}
						<div class="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin mr-2"></div>
						Initiating...
					{:else}
						Generate PDF
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
