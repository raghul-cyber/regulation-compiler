import sys
with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";', 'import { UserButton, SignInButton } from "@clerk/nextjs";')
text = text.replace('<SignedIn>\n            <UserButton />\n          </SignedIn>', '{userId && <UserButton />}')
text = text.replace('<SignedOut>\n            <SignInButton mode="modal">\n              <Button>Sign In</Button>\n            </SignInButton>\n          </SignedOut>', '{!userId && <SignInButton mode="modal"><Button>Sign In</Button></SignInButton>}')

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
