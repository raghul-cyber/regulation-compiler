<script lang="ts">
	import { ClerkProvider } from 'svelte-clerk';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ClerkProvider>
	{@render children()}
</ClerkProvider>
