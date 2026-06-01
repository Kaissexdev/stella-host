import { useEffect } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { useAuth } from "@/lib/auth";

const errorMessages: Record<string, string> = {
  state_mismatch: "Sign-in could not be verified. Please try again.",
  invalid_request: "Invalid sign-in request. Please try again.",
  banned: "This account has been banned.",
  abuse_detected: "Sign-in blocked by our abuse-prevention system.",
};

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · Stella Hosting" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { error } = useSearch({ from: "/login" });
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return <LoginScreen reason={error ? errorMessages[error] ?? "Sign-in failed. Please try again." : undefined} />;
}
