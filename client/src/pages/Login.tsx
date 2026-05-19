import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Loader2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { industryList, type IndustryKey } from "@config/industries";

export default function Login() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { session, signInWithPassword, signUpWithPassword } = useSupabaseAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [industryKey, setIndustryKey] = useState<IndustryKey>("cabinet-makers");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(() => {
    const next = new URLSearchParams(search).get("next");
    return next?.startsWith("/") ? next : "/dashboard";
  }, [search]);

  useEffect(() => {
    if (session) {
      setLocation(nextPath, { replace: true });
    }
  }, [nextPath, session, setLocation]);

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
        await signUpWithPassword(email, password, {
          industry_key: industryKey,
          default_trade: industryList.find((industry) => industry.key === industryKey)?.tradeId ?? "cabinetry",
        });
        setMessage("Account created. Check your email if confirmation is enabled, then finish industry setup.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in to Kindai</CardTitle>
          <CardDescription>
            Use your email and password to access the estimating workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSupabaseConfigured ? (
            <Alert variant="destructive">
              <AlertDescription>
                Supabase is not configured. Add VITE_SUPABASE_URL and
                VITE_SUPABASE_ANON_KEY to the app environment.
              </AlertDescription>
            </Alert>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                />
              </div>
              {mode === "signup" ? (
                <div className="space-y-2">
                  <Label>Industry type</Label>
                  <div className="grid gap-2">
                    {industryList.map((industry) => (
                      <button
                        key={industry.key}
                        type="button"
                        onClick={() => setIndustryKey(industry.key as IndustryKey)}
                        className={`rounded-[8px] border px-3 py-2 text-left text-sm font-semibold transition ${
                          industryKey === industry.key ? "border-pink-300 bg-pink-50 text-pink-700" : "border-border hover:bg-muted"
                        }`}
                      >
                        {industry.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              {message ? (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              ) : null}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                  setMessage(null);
                }}
              >
                {mode === "signin"
                  ? "Need an account? Create one"
                  : "Already have an account? Sign in"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
