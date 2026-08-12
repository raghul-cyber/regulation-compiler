<script lang="ts">
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    
    let { form } = $props();
    
    let isUploading = $state(false);
    let files = $state<FileList | null>(null);
    let selectedFileName = $derived(files && files.length > 0 ? files[0].name : null);
    let activeJobId = $state<string | null>(null);
    let jobStatus = $state<string | null>(null);
    let jobError = $state<string | null>(null);
    let pollInterval: any;

    function startPolling(jobId: string) {
        activeJobId = jobId;
        jobStatus = 'queued';
        
        pollInterval = setInterval(async () => {
            try {
                const res = await fetch(`/api/jobs/${jobId}`);
                if (res.ok) {
                    const data = await res.json();
                    jobStatus = data.status;
                    
                    if (data.status === 'completed') {
                        clearInterval(pollInterval);
                        isUploading = false;
                        goto('/regulations');
                    } else if (data.status === 'failed') {
                        clearInterval(pollInterval);
                        isUploading = false;
                        jobError = data.error_details || 'Job failed';
                    }
                }
            } catch(e) {
                console.error("Polling error", e);
            }
        }, 2000);
    }
</script>

<div class="mx-auto max-w-2xl p-6">
    <div class="mb-8">
        <button 
            onclick={() => goto('/regulations')}
            class="text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
            &larr; Back to Regulations
        </button>
        <h1 class="mt-4 text-3xl font-bold tracking-tight">Upload Regulation</h1>
        <p class="mt-2 text-zinc-500">Upload a PDF or HTML document for extraction.</p>
    </div>

    {#if form?.error || jobError}
        <div class="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <h3 class="text-sm font-medium text-red-800">Upload failed</h3>
            <div class="mt-2 text-sm text-red-700">
                <p>{form?.error || jobError}</p>
            </div>
        </div>
    {/if}

    <form 
        method="POST" 
        enctype="multipart/form-data" 
        class="space-y-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm"
        use:enhance={() => {
            isUploading = true;
            jobError = null;
            return async ({ update, result }) => {
                if (result.type === 'success' && result.data?.job_id) {
                    startPolling(result.data.job_id as string);
                } else {
                    await update();
                    isUploading = false;
                }
            };
        }}
    >
        <div class="space-y-2">
            <label for="name" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Regulation Name</label>
            <input 
                type="text" 
                id="name" 
                name="name" 
                required 
                placeholder="e.g. GDPR, HIPAA, CCPA"
                class="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
        </div>

        <div class="space-y-2">
            <label for="jurisdiction" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Jurisdiction</label>
            <input 
                type="text" 
                id="jurisdiction" 
                name="jurisdiction" 
                required 
                placeholder="e.g. EU, US-Federal, California"
                class="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
        </div>

        <div class="space-y-2">
            <label for="file" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Document File</label>
            <div
                role="button"
                tabindex="0"
                class="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-zinc-50 border-zinc-300 hover:bg-zinc-100 transition-colors relative"
                ondragover={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-zinc-500', 'bg-zinc-200'); }}
                ondragleave={(e) => { e.currentTarget.classList.remove('border-zinc-500', 'bg-zinc-200'); }}
                ondrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-zinc-500', 'bg-zinc-200');
                    if (e.dataTransfer?.files?.length) {
                        files = e.dataTransfer.files;
                    }
                }}
                onclick={() => document.getElementById('file')?.click()}
                onkeydown={(e) => e.key === 'Enter' && document.getElementById('file')?.click()}
            >
                <div class="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                    {#if selectedFileName}
                        <svg class="w-8 h-8 mb-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p class="mb-2 text-sm font-semibold text-zinc-900">{selectedFileName}</p>
                        <p class="text-xs text-zinc-500">Click or drag to replace</p>
                    {:else}
                        <svg class="w-8 h-8 mb-4 text-zinc-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p class="mb-2 text-sm text-zinc-500"><span class="font-semibold">Click to upload</span> or drag and drop</p>
                        <p class="text-xs text-zinc-500">PDF or HTML</p>
                    {/if}
                </div>
                <input 
                    type="file" 
                    id="file" 
                    name="file" 
                    accept=".pdf,.html,.htm" 
                    required
                    class="hidden"
                    bind:files={files}
                />
            </div>
        </div>

        <button 
            type="submit" 
            disabled={isUploading}
            class="inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50"
        >
            {#if isUploading}
                <svg class="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Uploading...
            {:else}
                Upload Document
            {/if}
        </button>
    </form>
</div>
