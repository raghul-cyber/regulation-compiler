import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
      <SignIn />
    </div>
  );
}
