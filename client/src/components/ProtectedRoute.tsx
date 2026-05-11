import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, session } = useSupabaseAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (loading || session) return;

    const next = encodeURIComponent(location);
    setLocation(`/login?next=${next}`, { replace: true });
  }, [loading, location, session, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm font-medium text-muted-foreground">
          Checking your session...
        </div>
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
}
