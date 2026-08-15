<script lang="ts">
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';

    let { data } = $props<{ data: PageData }>();
    
    let searchQuery = $state('');
    
    let displayedReqs = $derived(
        searchQuery.trim() === '' 
            ? data.requirements 
            : data.requirements.filter((r: any) => 
                r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                r.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
    );
</script>

<div class="flex flex-col gap-6 p-6">
    <div class="mb-2">
        <button 
            onclick={() => goto('/regulations')}
            class="text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
            &larr; Back to Regulations
        </button>
    </div>

    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-3xl font-bold tracking-tight">Extracted Requirements</h1>
            <p class="mt-1 text-zinc-500">Review the AI-extracted compliance policies.</p>
        </div>
    </div>

    <div class="flex items-center gap-4">
        <div class="relative flex-1 max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
                type="text" 
                bind:value={searchQuery}
                placeholder="Filter requirements..."
                class="flex h-10 w-full rounded-md border border-zinc-200 bg-white pl-10 pr-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
            />
        </div>
    </div>

    {#if displayedReqs.length > 0}
        <div class="grid gap-4">
            {#each displayedReqs as req}
                <div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div class="flex items-start justify-between">
                        <div class="flex gap-3 items-center mb-3">
                            {#if req.severity === 'critical'}
                                <span class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Critical</span>
                            {:else if req.severity === 'high'}
                                <span class="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">High</span>
                            {:else if req.severity === 'medium'}
                                <span class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">Medium</span>
                            {:else}
                                <span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Low</span>
                            {/if}
                            
                            <span class="text-xs font-medium text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{req.type}</span>
                            
                            <div class="text-xs text-zinc-400 flex items-center gap-1" title="AI Confidence Score">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                {Math.round(req.confidence_score * 100)}% Match
                            </div>
                        </div>
                        
                        {#if req.validation_status === 'approved'}
                            <span class="text-xs font-medium text-emerald-600 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Approved</span>
                        {:else if req.validation_status === 'pending_review'}
                            <span class="text-xs font-medium text-amber-600 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Review Needed</span>
                        {/if}
                    </div>
                    
                    <h3 class="text-lg font-semibold text-zinc-900 mb-2">{req.title}</h3>
                    <p class="text-sm text-zinc-600 mb-4">{req.description}</p>
                    
                    <div class="grid grid-cols-2 gap-4">
                        {#if req.actions?.items && req.actions.items.length > 0}
                        <div class="bg-zinc-50 rounded-lg p-4 border border-zinc-100">
                            <h4 class="text-xs font-bold text-zinc-500 uppercase mb-2">Required Actions</h4>
                            <ul class="list-disc list-inside text-sm text-zinc-700 space-y-1">
                                {#each req.actions.items as action}
                                    <li>{action}</li>
                                {/each}
                            </ul>
                        </div>
                        {/if}

                        {#if req.conditions?.items && req.conditions.items.length > 0}
                        <div class="bg-zinc-50 rounded-lg p-4 border border-zinc-100">
                            <h4 class="text-xs font-bold text-zinc-500 uppercase mb-2">Trigger Conditions</h4>
                            <ul class="list-disc list-inside text-sm text-zinc-700 space-y-1">
                                {#each req.conditions.items as cond}
                                    <li>{cond}</li>
                                {/each}
                            </ul>
                        </div>
                        {/if}
                    </div>
                    
                    <details class="mt-4 group">
                        <summary class="text-xs font-medium text-blue-600 cursor-pointer hover:underline list-none flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-open:rotate-90"><polyline points="9 18 15 12 9 6"/></svg>
                            View Original Legal Text
                        </summary>
                        <div class="mt-2 p-3 bg-zinc-100 rounded text-xs font-mono text-zinc-600 border border-zinc-200">
                            {req.source_text}
                        </div>
                    </details>
                </div>
            {/each}
        </div>
    {:else}
        <div class="rounded-xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto h-12 w-12 text-zinc-300 mb-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
            <h3 class="text-lg font-semibold text-zinc-900">No requirements extracted yet</h3>
            <p class="mt-2 text-sm text-zinc-500">The AI is either still processing the document, or it found no concrete obligations.</p>
        </div>
    {/if}
</div>
