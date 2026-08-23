import sys

with open("C:\\Users\\rcrag\\.gemini\\antigravity-ide\\brain\\036c24fb-dfba-40c6-9991-8c6a9b48a2aa\\task.md", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("- `[ ]` **Client-Side Auth Wrapper (`NavAuth`)**", "- `[x]` **Client-Side Auth Wrapper (`NavAuth`)**")
text = text.replace("- `[ ]` **TopNav Integration**", "- `[x]` **TopNav Integration**")

with open("C:\\Users\\rcrag\\.gemini\\antigravity-ide\\brain\\036c24fb-dfba-40c6-9991-8c6a9b48a2aa\\task.md", "w", encoding="utf-8") as f:
    f.write(text)
