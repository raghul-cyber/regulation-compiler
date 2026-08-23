import sys
with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('import { UserButton } from "@clerk/nextjs";', 'import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";\nimport { auth } from "@clerk/nextjs/server";')

replacement = """<div className="flex items-center gap-4">
          <Link href="/r3f-test">
            <Button variant="outline" className="text-zinc-900 cursor-pointer">Test R3F WebGL</Button>
          </Link>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button>Sign In</Button>
            </SignInButton>
          </SignedOut>
        </div>"""

text = text.replace('<div className="flex items-center gap-4">\n          <Link href="/r3f-test">\n            <Button variant="outline" className="text-zinc-900 cursor-pointer">Test R3F WebGL</Button>\n          </Link>\n          <UserButton />\n        </div>', replacement)

auth_block = """const { userId, sessionId } = await auth();"""
text = text.replace('let backendStatus = "Checking...";', auth_block + '\n  let backendStatus = "Checking...";')

session_ui = """<section className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-zinc-100">Clerk Session</h2>
          <pre className="text-xs text-zinc-400 bg-zinc-950 p-4 rounded overflow-auto border border-zinc-800">
            {JSON.stringify({ userId, sessionId }, null, 2)}
          </pre>
        </section>"""

text = text.replace('</section>\n\n        <section className="bg-zinc-900', '</section>\n\n        ' + session_ui + '\n\n        <section className="bg-zinc-900')

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
