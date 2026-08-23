import sys
with open('src/components/layout/top-nav.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('import { UserButton, SignedIn, SignedOut, SignInButton } from \'@clerk/nextjs\';', 'import { UserButton, SignInButton } from \'@clerk/nextjs\';\nimport { auth } from \'@clerk/nextjs/server\';')
text = text.replace('export function TopNav() {', 'export async function TopNav() {\n  const { userId } = await auth();')
text = text.replace('<SignedIn>\n            <UserButton />\n          </SignedIn>', '{userId && <UserButton />}')
text = text.replace('<SignedOut>\n            <SignInButton mode="modal">\n              <Button size="sm" variant="secondary">Sign In</Button>\n            </SignInButton>\n          </SignedOut>', '{!userId && <SignInButton mode="modal"><Button size="sm" variant="secondary">Sign In</Button></SignInButton>}')

with open('src/components/layout/top-nav.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
