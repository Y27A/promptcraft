import { Link } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { motion } from "framer-motion";

export default function NotFound() {
  usePageTitle("404 Not Found");
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center px-4">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
        className="text-8xl font-extrabold mb-4" style={{ color: "hsl(var(--primary) / 0.2)" }}>404</motion.div>
      <h1 className="text-3xl font-bold mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist.</p>
      <Link href="/" className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:scale-[1.02] transition-all"
        style={{ boxShadow: "0 0 24px hsl(var(--primary) / 0.3)" }}>
        Go home
      </Link>
    </motion.div>
  );
}
