import sys
with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('<UserButton afterSignOutUrl="/" />', '<UserButton />')

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
