import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Loader2, Zap, ArrowRight } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { session, signInWithPassword, signUpWithPassword } = useSupabaseAuth();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(() => {
    const next = new URLSearchParams(search).get("next");
    return next?.startsWith("/") ? next : "/dashboard";
  }, [search]);

  // Redirect if already authenticated via either path
  useEffect(() => {
    if (session || user) {
      setLocation(nextPath, { replace: true });
    }
  }, [nextPath, session, user, setLocation]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      if (mode === "signin") {
        await signInWithPassword(email, password);
        setLocation(nextPath, { replace: true });
      } else {
        await signUpWithPassword(email, password);
        setMessage(
          "Account created! Check your email if confirmation is enabled."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManusLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10">
      {/* ── Background ── */}
      <div className="absolute inset-0 bg-[#0a0a0f]" />
      <div
        className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full opacity-20 blur-[120px]"
        style={{ background: "oklch(0.58 0.28 0)" }}
      />
      <div
        className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] rounded-full opacity-15 blur-[100px]"
        style={{ background: "oklch(0.88 0.18 88)" }}
      />

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo + Brand */}
        <div className="flex flex-col items-center mb-8">
          <img src={LOGO_URL} alt="Kindai" className="w-16 h-16 mb-4" />
          <h1 className="text-3xl font-black text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Sign in to your Kindai estimating workspace
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
          {/* ── Manus OAuth (primary for existing users) ── */}
          <Button
            onClick={handleManusLogin}
            className="w-full h-12 rounded-xl font-bold text-base gap-2 kindai-btn-primary"
          >
            <Zap className="w-5 h-5" />
            Sign in with Kindai Account
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>

          {/* ── Divider ── */}
          {isSupabaseConfigured && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-white/30 uppercase tracking-wider">
                  or use email
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* ── Email/Password Form ── */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/70 text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-orange-500/50"
                    placeholder="you@company.com.au"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/70 text-sm">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={
                      mode === "signin" ? "current-password" : "new-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-orange-500/50"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {message && (
                  <Alert className="rounded-xl border-green-500/30 bg-green-500/10">
                    <AlertDescription className="text-green-300">
                      {message}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full h-11 rounded-xl font-semibold border-white/10 text-white hover:bg-white/10"
                  disabled={submitting}
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {mode === "signin" ? "Sign in with email" : "Create account"}
                </Button>

                <button
                  type="button"
                  className="w-full text-center text-sm text-white/40 hover:text-white/60 transition-colors"
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setError(null);
                    setMessage(null);
                  }}
                >
                  {mode === "signin"
                    ? "Need an account? Create one"
                    : "Already have an account? Sign in"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-xs text-white/20 mt-6">
          By signing in you agree to our{" "}
          <a href="/terms" className="underline hover:text-white/40">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline hover:text-white/40">
            Privacy Policy
          </a>
        </p>
      </div>
    </main>
  );
}
