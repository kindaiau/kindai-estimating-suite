import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useIndustryStore } from "@/stores/industryStore";
import { industryList, type IndustryKey } from "@config/industries";
import { CheckCircle2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { selectedIndustry, setSelectedIndustry } = useIndustryStore();
  const industry = industryList.find((item) => item.key === selectedIndustry) ?? industryList[0];
  const complete = trpc.saas.completeOnboarding.useMutation();
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await complete.mutateAsync({
      industryKey: selectedIndustry,
      companyName,
      phone,
      website,
    });
    navigate("/dashboard");
  };

  return (
    <AppLayout title="Onboarding">
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">Workspace setup</p>
          <h1 className="mt-2 text-3xl font-black text-foreground sm:text-4xl">{industry.onboarding.headline}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{industry.onboarding.subcopy}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-[8px]">
            <CardHeader>
              <CardTitle>Choose your industry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {industryList.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedIndustry(item.key as IndustryKey)}
                  className={`w-full rounded-[8px] border p-4 text-left transition ${
                    selectedIndustry === item.key ? "border-pink-300 bg-pink-50" : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-black">{item.name}</div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.audience}</p>
                    </div>
                    {selectedIndustry === item.key ? <CheckCircle2 className="h-5 w-5 text-pink-500" /> : null}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[8px]">
            <CardHeader>
              <CardTitle>Business details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Business name</Label>
                  <Input id="company-name" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" value={website} onChange={(event) => setWebsite(event.target.value)} />
                  </div>
                </div>
                <div className="rounded-[8px] bg-muted p-4">
                  <div className="text-sm font-black">What gets configured</div>
                  <div className="mt-3 space-y-2">
                    {industry.onboarding.setupSteps.map((step) => (
                      <div key={step} className="flex gap-2 text-sm leading-6 text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="kindai-btn-primary min-h-11 w-full font-black" disabled={complete.isPending}>
                  {complete.isPending ? "Saving..." : "Finish setup"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
