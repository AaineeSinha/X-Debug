import { Link } from "@tanstack/react-router";
import { Bug, LayoutDashboard, LogOut, Terminal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, signOut } = useAuth();
  return (
    <header className="glass sticky top-0 z-50 border-b border-border/40">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="clay-sm flex h-9 w-9 items-center justify-center rounded-xl bg-card">
            <Bug className="h-5 w-5 text-primary" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            X-<span className="text-gradient">Debug</span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              </Button>
              <Button asChild variant="clay" size="sm">
                <Link to="/debug">
                  <Terminal className="h-4 w-4" /> New analysis
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => signOut()} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild variant="clay" size="sm">
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}