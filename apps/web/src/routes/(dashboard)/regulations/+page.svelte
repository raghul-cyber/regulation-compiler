<script lang="ts">
    import { goto } from '$app/navigation';
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

    <div class="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div class="flex flex-col items-center justify-center space-y-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-10 w-10 text-zinc-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            <h3 class="text-lg font-semibold text-zinc-900">No regulations uploaded yet</h3>
            <p class="text-sm text-zinc-500">Get started by uploading a regulatory document (PDF or HTML) to begin extraction.</p>
        </div>
    </div>
</div>
