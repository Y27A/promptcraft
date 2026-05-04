import { SignUp } from "@clerk/clerk-react";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function SignUpPage() {
  usePageTitle("Sign up");
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] py-10">
      <SignUp routing="path" path={`${import.meta.env.BASE_URL}sign-up`} signInUrl={`${import.meta.env.BASE_URL}sign-in`} />
    </div>
  );
}
