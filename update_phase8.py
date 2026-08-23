import os

# Update CI
ci_path = ".github/workflows/ci.yml"
if os.path.exists(ci_path):
    with open(ci_path, 'r', encoding='utf-8') as f:
        ci_content = f.read()
    
    ci_content = ci_content.replace(
        "name: SvelteKit Check", "name: Next.js Build Check"
    ).replace(
        "run: cd apps/web && pnpm check || echo \"No type errors\"",
        "run: cd apps/web && pnpm run build"
    )
    with open(ci_path, 'w', encoding='utf-8') as f:
        f.write(ci_content)
    print("Updated CI/CD config")

# Update README
readme_path = "README.md"
if os.path.exists(readme_path):
    with open(readme_path, 'r', encoding='utf-8') as f:
        readme_content = f.read()
    
    # Remove caveat
    readme_content = readme_content.replace(
        "*Note: The originally drafted Next.js stack was replaced with SvelteKit + Threlte to achieve higher performance 3D rendering natively inside Svelte components.*",
        ""
    )
    # Update text
    readme_content = readme_content.replace("Monorepo setup with SvelteKit & FastAPI", "Monorepo setup with Next.js & FastAPI")
    readme_content = readme_content.replace("Basic SvelteKit dashboard", "Next.js dashboard")
    readme_content = readme_content.replace("Scroll-driven Threlte data-pipeline visualization", "React Three Fiber data-pipeline visualization")
    readme_content = readme_content.replace("SvelteKit Frontend", "Next.js Frontend")
    readme_content = readme_content.replace("Reusable Svelte components (Threlte scenes)", "React UI & 3D Components")
    readme_content = readme_content.replace("File-based routing", "Next.js App Router")
    readme_content = readme_content.replace("vite.config.ts", "next.config.ts")
    
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    print("Updated README")

