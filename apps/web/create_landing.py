import sys

page_code = """import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Canvas } from '@react-three/fiber';
import { HeroScene } from '@/components/3d/hero-scene';

export default function LandingPage() {
  return (
    <>
      {/* 
        BUG FIX EXPLANATION:
        The Canvas container is explicitly pulled OUT of the document flow using 'fixed inset-0'.
        Crucially, we set its z-index extremely low (-z-10) so it visually sits behind the app,
        and we set 'pointer-events-auto' so the user can interact with the scroll/orbit controls 
        by clicking the empty background space.
      */}
      <div className="fixed inset-0 -z-10 pointer-events-auto opacity-60">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <HeroScene />
        </Canvas>
      </div>

      {/* 
        The main content wrapper uses 'pointer-events-none' so that the invisible box model 
        doesn't intercept clicks meant for the Canvas behind it.
      */}
      <div className="relative z-10 w-full min-h-[150vh] pointer-events-none -mt-8">
        
        {/* 
          Hero Section 
          We explicitly re-enable pointer events ('pointer-events-auto') ONLY on the 
          interactive elements or their direct wrappers so they capture clicks naturally.
        */}
        <section className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter max-w-4xl leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 pointer-events-auto">
            The Future of <br /> Regulation as Code.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl font-medium pointer-events-auto">
            Instantly compile archaic legal text into executable, highly-structured enforcement policies.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4 pointer-events-auto">
            <Link href="/regulations">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all px-8 h-12">
                Explore Dashboard
              </Button>
            </Link>
            <Link href="/regulations">
              <Button size="lg" variant="secondary" className="rounded-full font-semibold px-8 h-12">
                Launch Compiler
              </Button>
            </Link>
          </div>
        </section>

        {/* Feature Section (To demonstrate scroll) */}
        <section className="min-h-screen flex items-center pointer-events-auto">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Semantic Processing</h2>
            <p className="text-zinc-400 text-lg">
              Powered by state-of-the-art vector embeddings, our engine doesn't just read words—it understands intent.
              Automatically diff laws and trigger zero-downtime compliance pipelines.
            </p>
          </div>
        </section>

      </div>
    </>
  );
}
"""

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(page_code)
