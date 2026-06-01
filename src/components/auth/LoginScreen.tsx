import { Github, ShieldCheck, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function LoginScreen({ reason }: { reason?: string }) {
  const { loginWithGitHub, isLoading } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Sign in to Stella Hosting</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {reason ?? "Connect your GitHub account to manage your deployments and services."}
        </p>

        <Button
          variant="hero"
          size="lg"
          className="mt-6 w-full"
          onClick={loginWithGitHub}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Github className="size-4" />}
          Continue with GitHub
        </Button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-success" />
          Secure cookie-based session · GitHub OAuth
        </p>
      </div>
    </div>
  );
}
