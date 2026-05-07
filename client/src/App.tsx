import { Router, Route, Switch, Redirect, useLocation } from "wouter";
import { useEffect } from "react";
import { ThemeProvider } from "./components/theme-provider";
import { Navbar } from "./components/layout/navbar";
import { Footer } from "./components/layout/footer";
import { Toaster } from "sonner";
import { setTokenGetter } from "./lib/auth";
import { useSafeAuth, HAS_CLERK } from "./lib/clerk-safe";

// Pages
import Landing from "./pages/Landing";
import Builder from "./pages/Builder";
import Templates from "./pages/Templates";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import SettingsPage from "./pages/Settings";
import Billing from "./pages/Billing";
import Analytics from "./pages/Analytics";
import Admin from "./pages/Admin";
import Projects from "./pages/Projects";
import Gallery from "./pages/Gallery";
import Guide from "./pages/Guide";
import SharePage from "./pages/Share";
import PublicSession from "./pages/PublicSession";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function Protected({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useSafeAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect to={`${BASE}/sign-in`} />;
  return <>{children}</>;
}

function TokenSync() {
  const { getToken } = useSafeAuth();
  useEffect(() => {
    if (HAS_CLERK) setTokenGetter(() => getToken());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function AppShell() {
  const [location] = useLocation();
  const noFooter = location === "/builder";
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/builder" component={Builder} />
          <Route path="/templates" component={Templates} />
          <Route path="/gallery" component={Gallery} />
          <Route path="/guide" component={Guide} />
          <Route path="/billing" component={Billing} />
          <Route path="/share/:token" component={SharePage} />
          <Route path="/p/:slug" component={PublicSession} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/dashboard">
            <Protected><Dashboard /></Protected>
          </Route>
          <Route path="/history">
            <Protected><History /></Protected>
          </Route>
          <Route path="/settings">
            <Protected><SettingsPage /></Protected>
          </Route>
          <Route path="/projects" component={Projects} />
          <Route path="/analytics">
            <Protected><Analytics /></Protected>
          </Route>
          <Route path="/admin">
            <Protected><Admin /></Protected>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      {!noFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TokenSync />
      <Router base={BASE}>
        <AppShell />
      </Router>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
