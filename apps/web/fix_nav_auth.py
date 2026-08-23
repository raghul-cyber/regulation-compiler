import sys

with open("src/components/layout/nav-auth.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("<UserButton afterSignOutUrl=\"/\" />", "<UserButton />")

with open("src/components/layout/nav-auth.tsx", "w", encoding="utf-8") as f:
    f.write(text)
