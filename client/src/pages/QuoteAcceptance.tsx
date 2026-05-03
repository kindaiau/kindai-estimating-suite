import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2, XCircle, Clock, FileText, Building2,
  Phone, Mail, AlertCircle, Loader2, Shield,
  User, Wrench
} from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

const TRADE_EMOJI: Record<string, string> = {
  electrical: "⚡", plumbing: "🔧", carpentry: "🪚", concreting: "🏗️",
  hvac: "❄️", flooring: "🏠", landscaping: "🌿", cabinetry: "🪵",
  rendering: "🧱", painting: "🎨", bricklaying: "🧱", roofing: "🏠",
  tiling: "⬜", waterproofing: "💧", "fire-protection": "🔥",
  glazing: "🪟", "quantity-surveying": "📊", demolition: "⚒️",
  "swimming-pool": "🏊", "steel-fabrication": "⚙️",
};

export default function QuoteAcceptance() {
  const { token } = useParams<{ token: string }>();
  const [signature, setSignature] = useState("");
  const [notes, setNotes] = useState("");
  const [responded, setResponded] = useState<"accepted" | "declined" | null>(null);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const viewTrackedRef = useRef(false);

  const { data, isLoading, error } = trpc.quoteTokens.getByToken.useQuery(
    { token: token ?? "" },
    { enabled: !!token, retry: false }
  );

  const quoteAnalyticsProps = () => ({
    trade: data?.estimate?.trade ?? "",
    status: data?.token?.status ?? "",
    total: parseFloat(String(data?.estimate?.total ?? "0")) || 0,
    lineItemCount: data?.items?.length ?? 0,
    hasMessage: Boolean(data?.token?.message),
  });

  useEffect(() => {
    if (viewTrackedRef.current) return;
    if (data) {
      viewTrackedRef.current = true;
      trackEvent("quote_link_viewed", {
        ...quoteAnalyticsProps(),
        valid: true,
      });
    } else if (error) {
      viewTrackedRef.current = true;
      trackEvent("quote_link_viewed", {
        valid: false,
        reason: "not_found_or_expired",
      });
    }
  }, [data, error]);

  const respondMutation = trpc.quoteTokens.respond.useMutation({
    onSuccess: (result) => {
      setResponded(result.status);
      trackEvent("quote_response_submitted", {
        ...quoteAnalyticsProps(),
        action: result.status,
        success: true,
        hasNotes: Boolean(notes.trim()),
      });
      if (result.status === "accepted") {
        toast.success("Quote accepted! The contractor will be in touch shortly.");
      } else {
        toast.info("Quote declined. The contractor has been notified.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
      trackEvent("quote_response_submitted", {
        ...quoteAnalyticsProps(),
        success: false,
        reason: "server_error",
      });
    },
  });

  const handleRespond = (action: "accepted" | "declined") => {
    if (action === "accepted" && !signature.trim()) {
      toast.error("Please type your name to confirm acceptance.");
      trackEvent("quote_response_submitted", {
        ...quoteAnalyticsProps(),
        action,
        success: false,
        reason: "validation_missing_signature",
      });
      return;
    }
    respondMutation.mutate({
      token: token ?? "",
      action,
      clientSignature: signature.trim() || undefined,
      clientNotes: notes.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-zinc-500">Loading your quote...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Quote Not Found</h1>
          <p className="text-zinc-500">
            {error?.message || "This quote link is invalid or has expired. Please contact the contractor for a new link."}
          </p>
        </div>
      </div>
    );
  }

  const { token: qt, estimate, items, sender } = data;

  // Already responded
  if (responded || qt.status === "accepted" || qt.status === "declined") {
    const status = responded || qt.status;
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          {status === "accepted" ? (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-zinc-900 mb-2">Quote Accepted!</h1>
              <p className="text-zinc-600 mb-4">
                You've accepted this quote. {sender?.name || "The contractor"} will be in touch shortly to confirm the start date and next steps.
              </p>
              <div className="bg-green-50 rounded-xl p-4 text-left">
                <p className="text-sm text-green-700 font-medium">What happens next:</p>
                <ul className="text-sm text-green-600 mt-2 space-y-1">
                  <li>✓ The contractor has been notified</li>
                  <li>✓ A confirmation email will be sent to you</li>
                  <li>✓ You'll receive a formal contract shortly</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-zinc-900 mb-2">Quote Declined</h1>
              <p className="text-zinc-600">
                You've declined this quote. {sender?.name || "The contractor"} has been notified.
              </p>
            </>
          )}
          <div className="mt-6 pt-6 border-t border-zinc-100">
            <p className="text-xs text-zinc-400">Powered by Kindai Estimating Suite</p>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = parseFloat(estimate.subtotal || "0");
  const gst = parseFloat(estimate.gstAmount || "0");
  const total = parseFloat(estimate.total || "0");
  const safeSubtotal = isNaN(subtotal) ? 0 : subtotal;
  const safeGst = isNaN(gst) ? 0 : gst;
  const safeTotal = isNaN(total) ? 0 : total;
  const tradeEmoji = TRADE_EMOJI[estimate.trade] || "🔧";

  // Group line items by section
  const sections = items.reduce((acc, item) => {
    const section = (item as { section?: string }).section || "General";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <div>
              <p className="font-semibold text-zinc-900 text-sm">Kindai Estimating</p>
              <p className="text-xs text-zinc-500">Secure Quote Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-xs text-zinc-500">Secure & Encrypted</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Quote header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{tradeEmoji}</span>
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                    {estimate.trade?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold">{estimate.title}</h1>
                {estimate.notes && (
                  <p className="text-zinc-300 text-sm mt-1">{estimate.notes}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-zinc-400 text-xs">Total (inc. GST)</p>
                <p className="text-3xl font-bold text-orange-400">
                  ${total.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Sender info */}
          {sender && (
            <div className="p-6 border-b border-zinc-100">
              <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-3">Prepared by</p>
              <div className="flex flex-wrap gap-4">
                {sender.companyName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-900">{sender.companyName}</span>
                  </div>
                )}
                {sender.name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-600">{sender.name}</span>
                  </div>
                )}
                {sender.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-600">{sender.phone}</span>
                  </div>
                )}
                {sender.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-600">{sender.email}</span>
                  </div>
                )}
                {sender.abn && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-600">ABN: {sender.abn}</span>
                  </div>
                )}
                {sender.licenseNumber && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-600">Lic: {sender.licenseNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message from contractor */}
          {qt.message && (
            <div className="p-6 border-b border-zinc-100 bg-amber-50">
              <p className="text-xs text-amber-700 uppercase tracking-wide font-medium mb-2">Message from contractor</p>
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">{qt.message}</p>
            </div>
          )}

          {/* Expiry notice */}
          {qt.expiresAt && (
            <div className="px-6 py-3 bg-zinc-50 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-500">
                Quote valid until {new Date(qt.expiresAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          )}
        </div>

        {/* Scope of works */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-500" />
              Scope of Works
            </h2>
          </div>

          {Object.entries(sections).map(([section, sectionItems]) => {
            const sectionTotal = sectionItems.reduce((sum, item) => {
              return sum + parseFloat(item.subtotal || "0");
            }, 0);
            return (
              <div key={section} className="border-b border-zinc-100 last:border-0">
                <div className="px-6 py-3 bg-zinc-50 flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-700">{section}</span>
                  <span className="text-sm font-medium text-zinc-600">
                    ${sectionTotal.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="divide-y divide-zinc-50">
                  {sectionItems.map((item) => (
                    <div key={item.id} className="px-6 py-3 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900">{item.description}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {item.quantity} {item.unit} × ${parseFloat(item.unitRate || "0").toFixed(2)}
                          {item.category && (
                            <span className="ml-2 text-zinc-400">({item.category})</span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-zinc-900 flex-shrink-0">
                        ${parseFloat(item.subtotal || "0").toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Totals */}
          <div className="p-6 bg-zinc-50 space-y-2">
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Subtotal (excl. GST)</span>
              <span>${safeSubtotal.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-600">
              <span>GST (10%)</span>
              <span>${safeGst.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-zinc-900">
              <span>Total (inc. GST)</span>
              <span className="text-orange-600 text-lg">
                ${safeTotal.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Accept / Decline */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
          <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Your Response
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Type your full name to accept this quote *
              </label>
              <Input
                value={signature}
                onChange={e => setSignature(e.target.value)}
                placeholder="e.g. John Smith"
                className="border-zinc-300"
              />
              <p className="text-xs text-zinc-500 mt-1">
                By typing your name and clicking Accept, you agree to the terms of this quote.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Notes or questions (optional)
              </label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any questions or special requests..."
                className="border-zinc-300 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => handleRespond("accepted")}
                disabled={respondMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              >
                {respondMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Accept Quote
              </Button>
              <Button
                onClick={() => setDeclineDialogOpen(true)}
                disabled={respondMutation.isPending}
                variant="outline"
                className="flex-1 border-zinc-300 text-zinc-600 hover:bg-zinc-50 py-3"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>

            <AlertDialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Decline this quote?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will notify the contractor that you've declined. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => { setDeclineDialogOpen(false); handleRespond("declined"); }}
                  >
                    Yes, Decline
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-xs text-zinc-400">
            This quote was prepared using{" "}
            <span className="font-medium text-orange-500">Kindai Estimating Suite</span>
            {" "}· Secure quote portal · Australian pricing standards
          </p>
        </div>
      </div>
    </div>
  );
}
