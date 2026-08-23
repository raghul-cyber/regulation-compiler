import sys

with open("C:\\Users\\rcrag\\.gemini\\antigravity-ide\\brain\\036c24fb-dfba-40c6-9991-8c6a9b48a2aa\\task.md", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("- `[ ]` **R3F Hero Scene**", "- `[x]` **R3F Hero Scene**")

with open("C:\\Users\\rcrag\\.gemini\\antigravity-ide\\brain\\036c24fb-dfba-40c6-9991-8c6a9b48a2aa\\task.md", "w", encoding="utf-8") as f:
    f.write(text)
