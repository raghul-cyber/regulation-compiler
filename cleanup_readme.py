import os

readme_path = "README.md"
if os.path.exists(readme_path):
    with open(readme_path, 'r', encoding='utf-8') as f:
        readme_content = f.read()
    
    readme_content = readme_content.replace(
        "svelte,ts,tailwind,threejs,python,fastapi,postgres,redis,docker",
        "nextjs,ts,tailwind,threejs,python,fastapi,postgres,redis,docker"
    )
    readme_content = readme_content.replace(
        "UI[SvelteKit Web App]",
        "UI[Next.js Web App]"
    )
    readme_content = readme_content.replace(
        "| **Frontend** | SvelteKit, TypeScript, TailwindCSS, shadcn-svelte, Threlte/Three.js* |",
        "| **Frontend** | Next.js, TypeScript, TailwindCSS, React Three Fiber |"
    )
    
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    print("Cleaned up remaining Svelte references in README")

