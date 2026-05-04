import { SignIn } from "@clerk/clerk-react";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function SignInPage() {
  usePageTitle("Sign in");
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] py-10">
      <SignIn routing="path" path={`${import.meta.env.BASE_URL}sign-in`} signUpUrl={`${import.meta.env.BASE_URL}sign-up`} />
    </div>
  );
}
