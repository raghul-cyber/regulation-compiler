<script lang="ts">
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';

    let { data } = $props<{ data: PageData }>();
</script>

<div class="flex flex-col gap-6 p-6">
    <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold tracking-tight">Regulations</h1>
        <button 
            onclick={() => goto('/regulations/upload')}
            class="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50"
        >
            Upload Regulation
        </button>
    </div>

    {#if data.regulations && data.regulations.length > 0}
        <div class="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <table class="w-full text-left text-sm text-zinc-500">
                <thead class="bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500 uppercase">
                    <tr>
                        <th class="px-6 py-4">Name</th>
                        <th class="px-6 py-4">Jurisdiction</th>
                        <th class="px-6 py-4">Uploaded At</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-200">
                    {#each data.regulations as reg}
                        <tr class="hover:bg-zinc-50">
                            <td class="px-6 py-4 font-medium text-zinc-900">{reg.name}</td>
                            <td class="px-6 py-4">{reg.jurisdiction}</td>
                            <td class="px-6 py-4">{new Date(reg.created_at).toLocaleDateString()}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {:else}
        <div class="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <div class="flex flex-col items-center justify-center space-y-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-10 w-10 text-zinc-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                <h3 class="text-lg font-semibold text-zinc-900">No regulations uploaded yet</h3>
                <p class="text-sm text-zinc-500">Get started by uploading a regulatory document (PDF or HTML) to begin extraction.</p>
            </div>
        </div>
    {/if}
</div>
