import { Link } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NotFound() {
  usePageTitle("404 Not Found");
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center px-4">
      <div className="text-8xl font-extrabold text-primary/20 mb-4">404</div>
      <h1 className="text-3xl font-bold mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist.</p>
      <Link href="/" className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:scale-[1.02] transition-all">
        Go home
      </Link>
    </div>
  );
}
