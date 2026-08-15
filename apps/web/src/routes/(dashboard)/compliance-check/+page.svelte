<script lang="ts">
    import { env } from '$env/dynamic/public';
    import { slide, fade } from 'svelte/transition';

    let jsonPayload = $state('{\n  "system": {\n    "data_retention_days": 30,\n    "encryption": "AES-256",\n    "mfa_enabled": true\n  }\n}');
    let isLoading = $state(false);
    let result = $state<any>(null);
    let errorMsg = $state<string | null>(null);
    
    // Defaulting to GDPR for demo
    let targetRegulation = $state('GDPR');

    async function runCheck() {
        isLoading = true;
        errorMsg = null;
        result = null;

        try {
            let parsed;
            try {
                parsed = JSON.parse(jsonPayload);
            } catch (e) {
                throw new Error("Invalid JSON payload");
            }

            const res = await fetch(`${env.PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/check-compliance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    regulation_id: targetRegulation, // Mock ID or identifier
                    payload: parsed
                })
            });

            if (!res.ok) {
                throw new Error(`API Error: ${res.statusText}`);
            }

            result = await res.json();
        } catch (err: any) {
            errorMsg = err.message;
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="px-6 py-8 max-w-5xl mx-auto" in:fade={{ duration: 300 }}>
    <header class="mb-8">
        <h1 class="text-3xl font-extrabold text-white tracking-tight">Compliance Simulator</h1>
        <p class="text-gray-400 mt-2 text-sm">Test a system configuration payload against live regulatory policies.</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Input Section -->
        <div class="space-y-4">
            <div class="bg-[#111116] border border-white/10 rounded-xl overflow-hidden shadow-lg focus-within:border-blue-500/50 transition-colors">
                <div class="bg-white/5 px-4 py-2 border-b border-white/5 flex justify-between items-center">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">System Payload (JSON)</span>
                    <select bind:value={targetRegulation} class="bg-transparent text-sm text-gray-300 outline-none cursor-pointer">
                        <option value="GDPR">GDPR (EU)</option>
                        <option value="CCPA">CCPA (CA)</option>
                    </select>
                </div>
                <textarea 
                    bind:value={jsonPayload}
                    class="w-full h-[400px] bg-transparent p-4 text-sm font-mono text-gray-300 focus:outline-none resize-none"
                    spellcheck="false"
                ></textarea>
            </div>
            
            <button 
                onclick={runCheck}
                disabled={isLoading}
                class="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]"
            >
                {#if isLoading}
                    <span class="flex items-center justify-center">
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Evaluating Policy...
                    </span>
                {:else}
                    Run Compliance Check
                {/if}
            </button>
        </div>

        <!-- Output Section -->
        <div class="bg-[#0f1115] border border-white/5 rounded-xl p-6 shadow-inner relative overflow-hidden min-h-[400px]">
            {#if errorMsg}
                <div transition:slide class="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm">
                    {errorMsg}
                </div>
            {/if}

            {#if result}
                <div transition:slide={{ duration: 400, delay: 100 }} class="space-y-6">
                    <div class="flex items-center justify-between border-b border-white/5 pb-4">
                        <h2 class="text-lg font-bold text-gray-200">Evaluation Result</h2>
                        <span class="px-3 py-1 rounded-full text-sm font-bold border {result.status === 'pass' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}">
                            {result.status?.toUpperCase() || 'FAIL'}
                        </span>
                    </div>

                    {#if result.violations && result.violations.length > 0}
                        <div class="space-y-3">
                            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Violations Detected</h3>
                            {#each result.violations as violation}
                                <div class="bg-red-500/5 border border-red-500/10 p-3 rounded-lg" transition:slide>
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="text-sm font-medium text-red-300">{violation.rule_id}</span>
                                        <span class="text-xs px-2 py-0.5 rounded bg-red-900/50 text-red-400">{violation.severity}</span>
                                    </div>
                                    <p class="text-xs text-gray-400">{violation.message}</p>
                                </div>
                            {/each}
                        </div>
                    {:else if result.status === 'pass'}
                        <div class="flex flex-col items-center justify-center h-48 text-center" transition:fade>
                            <div class="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h3 class="text-gray-200 font-medium">All Checks Passed</h3>
                            <p class="text-sm text-gray-500 mt-1">System payload complies with the active policy.</p>
                        </div>
                    {/if}
                </div>
            {:else if !isLoading && !errorMsg}
                <div class="absolute inset-0 flex flex-col items-center justify-center text-gray-600 pointer-events-none">
                    <svg class="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    <p class="text-sm">Awaiting payload evaluation...</p>
                </div>
            {/if}
        </div>
    </div>
</div>

