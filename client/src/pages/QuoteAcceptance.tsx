import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, HardHat, XCircle } from "lucide-react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

export default function QuoteAcceptance() {
  const params = useParams<{ token: string }>();
  const [accepted, setAccepted] = useState<boolean | null>(null);

  // Public quote lookup by token would go here in a full implementation
  // For now show a placeholder that demonstrates the flow

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl kindai-gradient flex items-center justify-center mx-auto mb-4 shadow-lg">
            <HardHat className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Quote Acceptance</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and accept your quote below</p>
        </div>

        {accepted === null ? (
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quote Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Quote token: <span className="font-mono text-xs">{params.token}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Full client quote acceptance portal — available in the next release.
                  Contact your contractor directly to accept this quote.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                  onClick={() => { setAccepted(true); toast.success("Quote accepted!"); }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Accept Quote
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive/5"
                  onClick={() => { setAccepted(false); toast.info("Quote declined"); }}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : accepted ? (
          <Card className="border-emerald-200 bg-emerald-50 shadow-sm text-center">
            <CardContent className="p-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-emerald-800 mb-2">Quote Accepted!</h2>
              <p className="text-sm text-emerald-700">Your contractor will be in touch shortly to confirm next steps.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border shadow-sm text-center">
            <CardContent className="p-8">
              <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-lg font-bold text-foreground mb-2">Quote Declined</h2>
              <p className="text-sm text-muted-foreground">Your contractor has been notified.</p>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Powered by <span className="font-semibold">Kindai Estimating Suite</span>
        </p>
      </div>
    </div>
  );
}
