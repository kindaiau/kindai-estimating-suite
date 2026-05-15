import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * ProtectedRoute — guards pages that require authentication.
 *
 * Accepts EITHER auth path:
 *  1. Supabase session (email/password users)
 *  2. Manus OAuth cookie (legacy beta users + OAuth users)
 *
 * If neither is present, redirects to /login?next=<current-path>.
 * If user is an expired beta user on free tier, redirects to /beta-expired.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading: supabaseLoading, session } = useSupabaseAuth();
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();

  const isLoading = supabaseLoading || authLoading;
  const isAuthenticated = Boolean(session) || Boolean(user);

  // Only fetch subscription when authenticated
  const { data: subscription, isLoading: subLoading } = trpc.billing.getSubscription.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (isLoading || isAuthenticated) return;

    const next = encodeURIComponent(location);
    setLocation(`/login?next=${next}`, { replace: true });
  }, [isLoading, isAuthenticated, location, setLocation]);

  // Redirect expired beta users to upgrade page
  useEffect(() => {
    if (!isAuthenticated || subLoading || !subscription) return;

    // If beta expired AND still on free tier with no active subscription → show upgrade
    if (
      subscription.isBetaExpired &&
      subscription.tier === "free" &&
      (subscription.status === "none" || subscription.status === "cancelled")
    ) {
      // Allow access to billing and pricing pages so they can upgrade
      if (location === "/billing" || location === "/pricing" || location === "/beta-expired") return;
      setLocation("/beta-expired", { replace: true });
    }
  }, [isAuthenticated, subLoading, subscription, location, setLocation]);

  if (isLoading || (isAuthenticated && subLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">
            Checking your session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
