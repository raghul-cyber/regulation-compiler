<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { Canvas } from '@threlte/core';
	import PipelineScene from '$lib/components/PipelineScene.svelte';

	let { data } = $props();

	// Animated Counter logic
	function countUp(target: number, duration: number = 1000) {
		let current = $state(0);
		onMount(() => {
			if (target === 0) return;
			const steps = 30;
			const stepTime = duration / steps;
			const increment = target / steps;
			
			const timer = setInterval(() => {
				if (current + increment >= target) {
					current = target;
					clearInterval(timer);
				} else {
					current += increment;
				}
			}, stepTime);
			
			return () => clearInterval(timer);
		});
		return { get value() { return Math.floor(current); } };
	}

	const reqs = countUp(data.summary.total_requirements);
	const obs = countUp(data.summary.total_obligations);
	const pro = countUp(data.summary.total_prohibitions);
	const high = countUp(data.summary.high_risk_controls);
	const recent = countUp(data.summary.recent_additions);

	// Custom SVG Donut Chart Logic
	const severityCounts = [
		{ label: 'High', value: data.summary.severity_distribution.high || 0, color: '#ef4444' }, // Red-500
		{ label: 'Medium', value: data.summary.severity_distribution.medium || 0, color: '#eab308' }, // Yellow-500
		{ label: 'Low', value: data.summary.severity_distribution.low || 0, color: '#22c55e' } // Green-500
	].filter(item => item.value > 0);

	const totalSev = severityCounts.reduce((acc, curr) => acc + curr.value, 0) || 1; // Prevent div by 0
	let chartDraw = $state(0);
	
	onMount(() => {
		setTimeout(() => { chartDraw = 1; }, 100);
	});

	let cumulativePercent = 0;
	const donutSegments = severityCounts.map(segment => {
		const percent = segment.value / totalSev;
		const dasharray = `${percent * 100} 100`;
		const dashoffset = -cumulativePercent * 100;
		cumulativePercent += percent;
		return { ...segment, dasharray, dashoffset, percent };
	});
</script>

<div class="px-6 py-6 pb-24 space-y-8 max-w-7xl mx-auto" in:fade={{ duration: 400, delay: 100 }}>
	
	<!-- Hero Banner -->
	<section class="relative h-[300px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.1)] bg-[#0f1115]">
		<!-- Threlte Scene -->
		<div class="absolute inset-0 z-0">
			<Canvas>
				<PipelineScene />
			</Canvas>
		</div>
		
		<!-- Overlay Text -->
		<div class="absolute inset-0 z-10 p-8 flex flex-col justify-end bg-gradient-to-t from-[#0f1115] via-[#0f1115]/50 to-transparent pointer-events-none">
			<h1 class="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">Data Compliance Engine</h1>
			<p class="text-gray-400 mt-2 text-sm font-medium">Real-time ingestion and continuous policy extraction.</p>
		</div>
	</section>

	<!-- Metrics Grid -->
	<section class="grid grid-cols-1 md:grid-cols-5 gap-4">
		{#each [
			{ label: 'Total Requirements', value: reqs, color: 'text-blue-400' },
			{ label: 'Obligations', value: obs, color: 'text-purple-400' },
			{ label: 'Prohibitions', value: pro, color: 'text-orange-400' },
			{ label: 'High-Risk Controls', value: high, color: 'text-red-400' },
			{ label: 'Recent (7 Days)', value: recent, color: 'text-emerald-400' }
		] as metric}
			<div class="bg-[#111116] border border-white/5 rounded-xl p-5 flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,255,255,0.03)] duration-300">
				<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{metric.label}</h3>
				<p class="text-3xl font-bold mt-3 {metric.color} drop-shadow-sm">{metric.value.value}</p>
			</div>
		{/each}
	</section>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- SVG Donut Chart -->
		<section class="lg:col-span-1 bg-[#111116] border border-white/5 rounded-2xl p-6">
			<h2 class="text-sm font-bold text-gray-200 mb-6">Severity Distribution</h2>
			<div class="flex flex-col items-center justify-center relative">
				<svg viewBox="0 0 36 36" class="w-48 h-48 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
					{#each donutSegments as seg}
						<circle
							cx="18" cy="18" r="15.91549430918954"
							fill="transparent"
							stroke={seg.color}
							stroke-width="3"
							stroke-dasharray={seg.dasharray}
							stroke-dashoffset={seg.dashoffset}
							stroke-linecap="round"
							style="transition: stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1); stroke-dasharray: {chartDraw * seg.percent * 100} 100;"
						/>
					{/each}
				</svg>
				
				<!-- Center Text -->
				<div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
					<span class="text-2xl font-bold text-white">{data.summary.total_requirements}</span>
					<span class="text-xs text-gray-500 uppercase">Total</span>
				</div>
			</div>
			
			<!-- Legend -->
			<div class="mt-8 space-y-3">
				{#each donutSegments as seg}
					<div class="flex items-center justify-between text-sm">
						<div class="flex items-center space-x-2">
							<span class="w-3 h-3 rounded-full" style="background-color: {seg.color}; box-shadow: 0 0 10px {seg.color};"></span>
							<span class="text-gray-400">{seg.label}</span>
						</div>
						<span class="text-gray-200 font-medium">{seg.value}</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- Activity Feed -->
		<section class="lg:col-span-2 bg-[#111116] border border-white/5 rounded-2xl p-6 flex flex-col h-full">
			<h2 class="text-sm font-bold text-gray-200 mb-6">Recent Validation Activity</h2>
			
			<div class="flex-1 overflow-y-auto pr-2 space-y-4">
				{#each data.activity as log}
					<div class="flex items-start space-x-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
						<div class="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
							<svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm text-gray-300">
								<span class="font-medium text-gray-100">{log.actor_email}</span> 
								{#if log.action === 'UPDATE_REQUIREMENT_STATUS'}
									transitioned a requirement from 
									<span class="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-xs">{log.metadata.old_status}</span> 
									to 
									<span class="px-1.5 py-0.5 rounded bg-green-900/50 text-green-400 text-xs border border-green-500/20">{log.metadata.new_status}</span>
								{:else}
									performed {log.action}
								{/if}
							</p>
							{#if log.metadata.note}
								<p class="mt-2 text-xs text-gray-500 italic border-l-2 border-gray-700 pl-2">"{log.metadata.note}"</p>
							{/if}
						</div>
						<div class="text-xs text-gray-600 whitespace-nowrap">
							{new Date(log.timestamp).toLocaleDateString()}
						</div>
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center h-40 text-gray-500">
						<p>No recent activity found.</p>
					</div>
				{/each}
			</div>
		</section>
	</div>
</div>
