<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { Canvas } from '@threlte/core'
  import Scene from './Scene.svelte'
  
  let prefersReducedMotion = $state(false);
  let scrollY = $state(0);
  
  onMount(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion = mediaQuery.matches;
    
    const handler = (e: MediaQueryListEvent) => prefersReducedMotion = e.matches;
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  });
</script>

<svelte:window bind:scrollY />

<main class="relative w-full min-h-[200vh] bg-[#0a0a0c] text-white overflow-x-hidden">
  
  <!-- Premium 3D Background (Lazy/Reduced Motion Handled) -->
  {#if !prefersReducedMotion}
    <div class="fixed inset-0 z-0 pointer-events-none opacity-60">
      <Canvas>
        <Scene {scrollY} />
      </Canvas>
    </div>
  {/if}

  <!-- Content Overlay -->
  <div class="relative z-10">
    <!-- Navbar -->
    <nav class="absolute top-0 w-full p-6 flex justify-between items-center border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md">
      <div class="text-xl font-bold tracking-tight">Antigravity<span class="text-blue-500">RAC</span></div>
      <div class="space-x-4">
        <a href="/sign-in" class="text-sm font-medium text-gray-400 hover:text-white transition-colors">Sign In</a>
        <a href="/regulations" class="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">Launch Compiler</a>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
      <h1 class="text-5xl md:text-7xl font-extrabold tracking-tighter max-w-4xl leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
        The Future of <br/> Regulation as Code.
      </h1>
      <p class="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl font-medium">
        Instantly compile archaic legal text into executable, highly-structured enforcement policies.
      </p>
      <div class="mt-10 flex space-x-4">
        <a href="/regulations" class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]">
          Explore Dashboard
        </a>
      </div>
    </section>

    <!-- Feature Section (To demonstrate scroll) -->
    <section class="min-h-screen flex items-center px-6 md:px-20">
      <div class="max-w-xl">
        <h2 class="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Semantic Processing</h2>
        <p class="text-gray-400 text-lg">
          Powered by state-of-the-art vector embeddings, our engine doesn't just read words—it understands intent.
          Automatically diff laws and trigger zero-downtime compliance pipelines.
        </p>
      </div>
    </section>
  </div>
</main>
