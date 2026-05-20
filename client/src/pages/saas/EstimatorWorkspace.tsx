import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useIndustryStore } from "@/stores/industryStore";
import { FileText } from "lucide-react";
import { useState } from "react";

export default function EstimatorWorkspace() {
  const { selectedIndustry } = useIndustryStore();
  const [scope, setScope] = useState("");
  const generate = trpc.saas.generateEstimateDraft.useMutation();
  const draft = generate.data?.draft as any;

  return (
    <AppLayout title="Estimator">
      <div className="mx-auto grid max-w-7xl gap-5 p-4 sm:p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
        <Card className="rounded-[8px]">
          <CardHeader>
            <CardTitle>AI Estimator Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              rows={12}
              placeholder="Paste the customer enquiry, plan notes, measurements, photos summary, materials, or scope details here."
            />
            <Button
              className="kindai-btn-primary min-h-11 w-full font-black"
              disabled={scope.length < 10 || generate.isPending}
              onClick={() => generate.mutate({ industryKey: selectedIndustry, scope })}
            >
              {generate.isPending ? "Drafting..." : "Generate quote draft"}
            </Button>
            <p className="text-xs leading-5 text-muted-foreground">AI may draft and structure. It must not send quotes automatically.</p>
          </CardContent>
        </Card>

        <Card className="rounded-[8px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-pink-500" /> Draft output</CardTitle>
          </CardHeader>
          <CardContent>
            {!draft ? (
              <div className="rounded-[8px] bg-muted p-6 text-sm leading-6 text-muted-foreground">
                Your estimate draft will appear here with line items, assumptions, GST, and total.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-black">{draft.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{draft.summary}</p>
                </div>
                <div className="space-y-2">
                  {(draft.items ?? []).map((item: any, index: number) => (
                    <div key={`${item.description}-${index}`} className="grid grid-cols-[1fr_auto] gap-4 rounded-[8px] border p-3 text-sm">
                      <div>
                        <div className="font-bold">{item.description}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{item.quantity} {item.unit} at ${item.unitRate}</div>
                      </div>
                      <div className="font-black">${Number(item.subtotal ?? 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-[8px] bg-slate-950 p-4 text-white">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><strong>${Number(draft.subtotal ?? 0).toFixed(2)}</strong></div>
                  <div className="mt-2 flex justify-between text-sm"><span>GST</span><strong>${Number(draft.gst ?? 0).toFixed(2)}</strong></div>
                  <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-lg"><span>Total</span><strong>${Number(draft.total ?? 0).toFixed(2)}</strong></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
