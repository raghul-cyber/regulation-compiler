<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { InstancedMesh, Instance } from '@threlte/extras'

  let { scrollY = 0 } = $props();

  // Premium Particle/Node Abstraction
  const numNodes = 150;
  const nodes = Array.from({ length: numNodes }, () => ({
    x: (Math.random() - 0.5) * 20,
    y: (Math.random() - 0.5) * 20,
    z: (Math.random() - 0.5) * 10 - 5,
    speed: Math.random() * 0.2 + 0.1,
    offset: Math.random() * Math.PI * 2
  }));

  let time = $state(0);
  useTask((delta) => {
    time += delta;
  });

  // Scroll-driven camera parallax
  let camZ = $derived(5 + (scrollY * 0.005));
  let camY = $derived(-(scrollY * 0.002));
</script>

<T.PerspectiveCamera
  makeDefault
  position={[0, camY, camZ]}
  fov={60}
/>

<T.DirectionalLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
<T.DirectionalLight position={[-10, -10, -10]} intensity={1} color="#3b82f6" />
<T.AmbientLight intensity={0.2} />

<!-- Data Node Particles -->
<InstancedMesh limit={numNodes} range={numNodes}>
  <T.SphereGeometry args={[0.08, 16, 16]} />
  <T.MeshPhysicalMaterial 
    color="#3b82f6" 
    emissive="#1d4ed8"
    emissiveIntensity={0.5}
    roughness={0.2} 
    metalness={0.8} 
    transmission={0.5}
  />
  
  {#each nodes as node, i}
    <Instance 
      position={[
        node.x + Math.sin(time * node.speed + node.offset) * 2, 
        node.y + Math.cos(time * node.speed + node.offset) * 2, 
        node.z
      ]}
      scale={Math.sin(time + node.offset) * 0.5 + 0.8}
    />
  {/each}
</InstancedMesh>
