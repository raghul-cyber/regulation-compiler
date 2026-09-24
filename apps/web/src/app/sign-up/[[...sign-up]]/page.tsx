import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
        signInFallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
