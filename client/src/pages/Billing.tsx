import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard, ExternalLink, Sparkles, CheckCircle2, AlertTriangle, Clock,
} from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { useEffect } from "react";
import { pixelPurchase } from "@/lib/metaPixel";

const TIER_COLOURS: Record<string, string> = {
  free: "bg-slate-100 text-slate-700 border-slate-200",
  sole_trader: "bg-gradient-to-r from-pink-500 to-orange-500 text-white border-transparent",
  small_builder: "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent",
  mid_builder: "bg-gradient-to-r from-purple-500 to-pink-600 text-white border-transparent",
  enterprise: "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-transparent",
};

const TIER_NAMES: Record<string, string> = {
  free: "Starter (Free)",
  sole_trader: "Sole Tradie",
  small_builder: "Pro",
  mid_builder: "Commercial",
  enterprise: "Enterprise & Custom",
};

const STATUS_BADGES: Record<string, { label: string; icon: typeof CheckCircle2; colour: string }> = {
  active: { label: "Active", icon: CheckCircle2, colour: "text-green-600 bg-green-50 border-green-200" },
  cancelling: { label: "Cancelling", icon: Clock, colour: "text-orange-600 bg-orange-50 border-orange-200" },
  past_due: { label: "Past Due", icon: AlertTriangle, colour: "text-red-600 bg-red-50 border-red-200" },
  cancelled: { label: "Cancelled", icon: AlertTriangle, colour: "text-slate-600 bg-slate-50 border-slate-200" },
  none: { label: "No Subscription", icon: CreditCard, colour: "text-slate-500 bg-slate-50 border-slate-200" },
};

export default function Billing() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const success = new URLSearchParams(search).get("success");

  const { data: subscription, refetch } = trpc.billing.getSubscription.useQuery();
  const portalMutation = trpc.billing.createPortal.useMutation({
    onSuccess: (data) => {
      toast.info("Opening billing portal...");
      window.open(data.url, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (success === "true") {
      toast.success("Subscription activated! Welcome to Kindai Pro.");
      refetch();
      // Fire Purchase pixel event when Stripe redirects back with success
      pixelPurchase({
        value: 0, // actual value tracked server-side via webhook
        content_name: "Kindai Subscription",
      });
    }
  }, [success]);

  const tier = subscription?.tier ?? "free";
  const status = subscription?.status ?? "none";
  const statusInfo = STATUS_BADGES[status] ?? STATUS_BADGES.none;
  const StatusIcon = statusInfo.icon;

  return (
    <AppLayout title="Billing">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">

        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-pink-500" />
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your Kindai subscription and billing details.
          </p>
        </div>

        {/* Current Plan Card */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge className={`${TIER_COLOURS[tier]} text-sm font-black px-3 py-1 rounded-full`}>
                  {TIER_NAMES[tier] ?? tier}
                </Badge>
                <Badge variant="outline" className={`${statusInfo.colour} text-xs font-bold rounded-full`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusInfo.label}
                </Badge>
              </div>

              <div className="flex gap-2">
                {tier === "free" ? (
                  <Button
                    onClick={() => navigate("/pricing")}
                    className="kindai-btn-primary rounded-full font-bold text-sm"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" /> Upgrade
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="rounded-full font-bold text-sm"
                    disabled={portalMutation.isPending}
                    onClick={() =>
                      portalMutation.mutate({ origin: window.location.origin })
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-1.5" />
                    {portalMutation.isPending ? "Opening..." : "Manage Billing"}
                  </Button>
                )}
              </div>
            </div>

            {subscription?.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                {subscription.cancelAtPeriodEnd
                  ? `Your plan will be cancelled on ${new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`
                  : `Next billing date: ${new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Plan Limits */}
        {subscription?.limits && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Your Plan Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Estimates/mo", value: subscription.limits.estimatesPerMonth === -1 ? "Unlimited" : subscription.limits.estimatesPerMonth },
                  { label: "AI Takeoffs/mo", value: subscription.limits.aiTakeoffsPerMonth === -1 ? "Unlimited" : subscription.limits.aiTakeoffsPerMonth },
                  { label: "Total Projects", value: subscription.limits.projectsTotal === -1 ? "Unlimited" : subscription.limits.projectsTotal },
                  { label: "Team Members", value: subscription.limits.teamMembers === -1 ? "Unlimited" : subscription.limits.teamMembers },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center p-3 rounded-xl bg-muted/50">
                    <div className="text-2xl font-black text-foreground">{value}</div>
                    <div className="text-xs text-muted-foreground font-medium mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upgrade CTA for free users */}
        {tier === "free" && (
          <Card className="border-2 border-pink-200 shadow-sm overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl kindai-gradient flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-foreground">Upgrade to Sole Tradie</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Unlimited estimates, 20 AI Vision Takeoffs/mo, trade pricing, supplier recommendations, and PDF export.
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/pricing")}
                  className="kindai-btn-primary rounded-full font-bold text-sm flex-shrink-0"
                >
                  View Plans
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test mode notice */}
        <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
          <strong>Test Mode:</strong> Use card number <code className="bg-yellow-100 px-1.5 py-0.5 rounded font-mono text-xs">4242 4242 4242 4242</code> with any future expiry and any CVC to test payments.
        </div>
      </div>
    </AppLayout>
  );
}
