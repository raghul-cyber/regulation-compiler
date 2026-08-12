<script lang="ts">
	import { UserButton } from 'svelte-clerk';
</script>

<div class="p-8">
	<header class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Dashboard</h1>
		<UserButton />
	</header>
	<p class="mt-4">Welcome to your secure dashboard.</p>
</div>
