import { Link } from "@tanstack/react-router";
import { Bug } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-primary" />
          <span className="font-display font-bold">X-Debug</span>
          <span className="text-sm text-muted-foreground">— reverse debugging for Python & C</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/" hash="engine" className="hover:text-foreground">
            Engine
          </Link>
          <Link to="/" hash="features" className="hover:text-foreground">
            Features
          </Link>
          <Link to="/auth" className="hover:text-foreground">
            Sign in
          </Link>
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-muted-foreground/60">
        © {new Date().getFullYear()} X-Debug. Built for developers who move fast.
      </p>
    </footer>
  );
}