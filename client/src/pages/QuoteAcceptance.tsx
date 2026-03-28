import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

export default function QuoteAcceptance() {
  const params = useParams<{ token: string }>();
  const [accepted, setAccepted] = useState<boolean | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-5">
        {/* Header */}
        <div className="text-center">
          <img src={LOGO_URL} alt="Kindai" className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
          <h1 className="text-2xl font-black text-foreground">Quote Acceptance</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and accept your quote below</p>
        </div>

        {accepted === null ? (
          <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-black">Quote Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              <div className="bg-gray-50 rounded-2xl p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Quote token: <span className="font-mono text-xs bg-white px-2 py-0.5 rounded-lg">{params.token}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Full client quote acceptance portal — available in the next release.
                  Contact your contractor directly to accept this quote.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0 rounded-xl font-bold"
                  onClick={() => { setAccepted(true); toast.success("Quote accepted!"); }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Accept Quote
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold"
                  onClick={() => { setAccepted(false); toast.info("Quote declined"); }}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : accepted ? (
          <Card className="border-0 bg-emerald-50 shadow-md rounded-2xl overflow-hidden text-center">
            <CardContent className="p-8">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-xl font-black text-emerald-800 mb-2">Quote Accepted!</h2>
              <p className="text-sm text-emerald-700">Your contractor will be in touch shortly to confirm next steps.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-md rounded-2xl overflow-hidden text-center">
            <CardContent className="p-8">
              <XCircle className="w-14 h-14 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-xl font-black text-foreground mb-2">Quote Declined</h2>
              <p className="text-sm text-muted-foreground">Your contractor has been notified.</p>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Powered by <span className="font-black kindai-gradient-text">kindai</span>
        </p>
      </div>
    </div>
  );
}
