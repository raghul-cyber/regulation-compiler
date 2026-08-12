<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { interactivity, OrbitControls, Float, Grid } from '@threlte/extras';
	import { Vector3, MathUtils } from 'three';

	interactivity();

	// Particle System for the "Data Flow"
	const PARTICLE_COUNT = 40;
	let particles = $state(Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
		id: i,
		x: MathUtils.randFloat(-10, -8),
		y: MathUtils.randFloat(-0.5, 0.5),
		z: MathUtils.randFloat(-0.5, 0.5),
		speed: MathUtils.randFloat(0.05, 0.15),
		phase: 0 // 0: Ingestion -> Ext, 1: Ext -> Policy
	})));

	useTask((delta) => {
		for (let i = 0; i < particles.length; i++) {
			let p = particles[i];
			
			// Move right
			p.x += p.speed;
			
			// If it passes Extraction (x=0), switch phase
			if (p.x > 0 && p.phase === 0) p.phase = 1;
			
			// If it passes Policy (x=8), reset to start
			if (p.x > 10) {
				p.x = MathUtils.randFloat(-10, -8);
				p.y = MathUtils.randFloat(-0.5, 0.5);
				p.z = MathUtils.randFloat(-0.5, 0.5);
				p.phase = 0;
			}
		}
	});

	let mouseX = $state(0);
	let mouseY = $state(0);

	function onPointerMove(e: PointerEvent) {
		mouseX = (e.clientX / window.innerWidth) * 2 - 1;
		mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
	}
</script>

<svelte:window onpointermove={onPointerMove} />

<!-- Camera with slight mouse parallax -->
<T.PerspectiveCamera 
	makeDefault 
	position={[mouseX * 1, 5 + mouseY * 1, 15]} 
	fov={45} 
>
	<OrbitControls 
		enableDamping 
		dampingFactor={0.05} 
		enableZoom={false} 
		enablePan={false}
		maxPolarAngle={Math.PI / 2 + 0.1}
		minPolarAngle={Math.PI / 4}
	/>
</T.PerspectiveCamera>

<!-- Lighting -->
<T.AmbientLight intensity={0.2} />
<T.DirectionalLight position={[5, 10, 5]} intensity={1.5} color="#4f46e5" /> <!-- Blue tint -->
<T.DirectionalLight position={[-5, 5, -5]} intensity={1} color="#06b6d4" /> <!-- Cyan tint -->
<T.PointLight position={[0, 0, 2]} intensity={2} color="#ffffff" distance={10} />

<!-- Subtle Grid Floor -->
<Grid 
	position={[0, -2, 0]} 
	infiniteGrid 
	fadeDistance={30} 
	cellColor="#ffffff" 
	sectionColor="#ffffff" 
	cellThickness={0.5}
	sectionThickness={1}
	opacity={0.05}
/>

<!-- Nodes (System Architecture) -->

<!-- 1. Ingestion Node -->
<Float speed={2} floatIntensity={0.5}>
	<T.Mesh position={[-8, 0, 0]}>
		<T.BoxGeometry args={[2, 2, 2]} />
		<T.MeshPhysicalMaterial color="#1e293b" metalness={0.8} roughness={0.2} clearcoat={1.0} />
	</T.Mesh>
	<!-- Node Label (Fake using simple geometry or just rely on HTML overlay in real app, but we keep it simple here) -->
</Float>

<!-- 2. AI Extraction Engine Node (Center) -->
<Float speed={1.5} floatIntensity={1} rotationIntensity={0.5}>
	<T.Mesh position={[0, 0, 0]}>
		<T.IcosahedronGeometry args={[1.5, 1]} />
		<T.MeshPhysicalMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.5} wireframe={true} />
	</T.Mesh>
	<!-- Core glow -->
	<T.Mesh position={[0, 0, 0]}>
		<T.IcosahedronGeometry args={[1.2, 0]} />
		<T.MeshPhysicalMaterial color="#60a5fa" metalness={1} roughness={0} transmission={0.9} thickness={0.5} />
	</T.Mesh>
</Float>

<!-- 3. Policy Node -->
<Float speed={2.5} floatIntensity={0.5}>
	<T.Mesh position={[8, 0, 0]}>
		<T.CylinderGeometry args={[1, 1, 2, 32]} />
		<T.MeshPhysicalMaterial color="#0f172a" metalness={0.9} roughness={0.1} clearcoat={1.0} />
	</T.Mesh>
</Float>

<!-- Flow Particles -->
{#each particles as p (p.id)}
	<T.Mesh position={[p.x, p.y + Math.sin(p.x)*0.5, p.z]}>
		<T.SphereGeometry args={[0.1, 8, 8]} />
		<T.MeshBasicMaterial color={p.phase === 0 ? "#94a3b8" : "#38bdf8"} />
	</T.Mesh>
{/each}

<!-- Connecting Beams (Visual hint of the path) -->
<T.Mesh position={[-4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
	<T.CylinderGeometry args={[0.02, 0.02, 8, 8]} />
	<T.MeshBasicMaterial color="#334155" transparent opacity={0.5} />
</T.Mesh>
<T.Mesh position={[4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
	<T.CylinderGeometry args={[0.02, 0.02, 8, 8]} />
	<T.MeshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
</T.Mesh>
