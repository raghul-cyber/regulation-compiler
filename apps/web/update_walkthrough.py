import sys
import os

filepath = "C:\\Users\\rcrag\\.gemini\\antigravity-ide\\brain\\036c24fb-dfba-40c6-9991-8c6a9b48a2aa\\walkthrough.md"

with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

phase4_text = """## Phase 4: Real Auth Nav & Loading States (Completed)
The authentication UI has been deeply integrated into the global shell, providing robust client-side state handling and eliminating UX layout flashes.

1. **Client-Side Auth Wrapper (`NavAuth`)**: 
   - Extracted the right-hand action area of the `TopNav` into a strict Client Component (`src/components/layout/nav-auth.tsx`).
   - Integrated Clerk's `useAuth()` hook to tap into the raw `isLoaded` and `userId` states.
2. **Explicit Loading State (Flash Bug Fixed)**:
   - When Clerk is determining the auth state (`!isLoaded`), the component now explicitly renders a layout-locked `<Skeleton>` matching the exact width and height of the eventual buttons.
   - **Result**: The layout remains completely rigid. Users no longer see a flash of "Sign In" before it resolves to their avatar.
3. **Conditional Renders & Persistent CTAs**:
   - **Signed Out**: Renders the `<SignInButton>` (with standard modal flow) and the global CTA "Launch Compiler".
   - **Signed In**: Renders the real Clerk `<UserButton>` (with profile/settings/sign-out modal support natively wired). The global CTA dynamically updates its text to "Dashboard" to reflect the authenticated intent.
4. **Backend JWT Enforcement**:
   - The FastAPI backend was audited via raw `curl` without a JWT. It strictly returned `401 Unauthorized`. This confirms the frontend UI nav swap is purely cosmetic UX, and the actual backend endpoints are securely locked behind the PyJWKClient validation built previously.

---

"""

# Insert Phase 4 after the main title
text = text.replace("This document tracks the verified completion of our migration phases. \n", "This document tracks the verified completion of our migration phases. \n\n" + phase4_text)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(text)
