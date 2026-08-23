import sys

with open("src/app/globals.css", "r", encoding="utf-8") as f:
    text = f.read()

# Replace body styles
base_layer_str = """@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}"""

new_base_layer = """@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  :root {
    color-scheme: dark;
  }
  body {
    @apply bg-[#0a0a0c] text-gray-100 antialiased selection:bg-blue-500/30 selection:text-blue-200;
  }
  html {
    @apply font-sans;
  }
}"""

text = text.replace(base_layer_str, new_base_layer)

# Also override the dark theme background token just in case shadcn primitives use bg-background
text = text.replace('--background: oklch(0.145 0 0);', '--background: #0a0a0c;')
# Keep standard zinc as requested, just changing the root body styles.

with open("src/app/globals.css", "w", encoding="utf-8") as f:
    f.write(text)
