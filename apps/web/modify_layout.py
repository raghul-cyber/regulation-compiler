import sys

with open("src/app/layout.tsx", "r") as f:
    text = f.read()

text = text.replace("import { Geist, Geist_Mono } from \"next/font/google\";", "import { Geist, Geist_Mono } from \"next/font/google\";\nimport { ClerkProvider } from \"@clerk/nextjs\";")
text = text.replace("<html", "<ClerkProvider>\n    <html")
text = text.replace("</html>", "</html>\n    </ClerkProvider>")

with open("src/app/layout.tsx", "w") as f:
    f.write(text)
