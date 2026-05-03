import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Globe2, Lightbulb, ShieldCheck, Target } from "lucide-react";
import { Button, Card, Input, Section } from "./components";

const defaultUrl = "https://kindaiestimator.com";

const mockFindings = [
  { label: "Positioning clarity", score: 88, note: "Clear promise with room to sharpen the founder offer." },
  { label: "Visual trust", score: 81, note: "Premium dark system, strong contrast and consistent calls to action." },
  { label: "Offer strength", score: 76, note: "Good outcome focus. Add a simple starter product or service ladder." },
];

const launchActions = [
  "Create one clear entry offer for founders who need systems fast.",
  "Add a lead magnet that turns a business idea into a 7-day launch plan.",
  "Connect scan results to email follow-up and dashboard tasks.",
];

export default function BrandScanPage() {
  const [url, setUrl] = useState(defaultUrl);
  const [scannedUrl, setScannedUrl] = useState(defaultUrl);

  const domain = useMemo(() => {
    try {
      return new URL(scannedUrl.startsWith("http") ? scannedUrl : `https://${scannedUrl}`).hostname;
    } catch {
      return scannedUrl || "your brand";
    }
  }, [scannedUrl]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setScannedUrl(url.trim() || defaultUrl);
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-[#E5E7EB]">
      <nav className="border-b border-white/10 bg-[#0A0A0A]/80 px-5 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="/launch-engine" className="text-sm font-black tracking-wide text-white">
            Kindai Launch Engine
          </a>
          <Button href="/launch-engine/dashboard" variant="secondary" className="min-h-10 px-4 py-2">
            Dashboard
          </Button>
        </div>
      </nav>

      <Section className="pt-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="p-6">
              <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-[#6C5CE7]/18 text-[#A9A1FF]">
                <Globe2 className="size-6" />
              </div>
              <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                Scan a brand URL and get the launch angle.
              </h1>
              <p className="mt-4 text-sm leading-6 text-[#9CA3AF]">
                This MVP uses mock analysis so the product flow can be tested before connecting live AI.
              </p>
              <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                <label className="block text-sm font-bold text-[#E5E7EB]" htmlFor="brand-url">
                  Brand URL
                </label>
                <Input
                  id="brand-url"
                  inputMode="url"
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://yourbrand.com"
                  value={url}
                />
                <Button className="w-full" type="submit">
                  Run mock scan <ArrowRight className="size-4" />
                </Button>
              </form>
            </Card>

            <Card className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#A9A1FF]">Brand scan result</p>
                  <h2 className="mt-2 text-2xl font-black text-white">{domain}</h2>
                  <p className="mt-2 text-sm text-[#9CA3AF]">Mock analysis generated for MVP review.</p>
                </div>
                <div className="rounded-2xl border border-[#6C5CE7]/35 bg-[#6C5CE7]/14 px-5 py-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A9A1FF]">Score</p>
                  <p className="mt-1 text-4xl font-black text-white">82</p>
                </div>
              </div>

              <div className="mt-7 grid gap-4">
                {mockFindings.map((finding) => (
                  <div key={finding.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="size-5 text-[#A9A1FF]" />
                        <h3 className="font-bold text-white">{finding.label}</h3>
                      </div>
                      <span className="text-sm font-black text-white">{finding.score}%</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#9CA3AF]">{finding.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-xl border border-white/10 bg-[#0A0A0A] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <Target className="size-5 text-[#A9A1FF]" />
                  <h3 className="font-black text-white">Next launch actions</h3>
                </div>
                <div className="space-y-3">
                  {launchActions.map((action) => (
                    <div key={action} className="flex gap-3 text-sm leading-6 text-[#9CA3AF]">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#6C5CE7]" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button href="/launch-engine/dashboard">
                  Open dashboard <ArrowRight className="size-4" />
                </Button>
                <Button href="/launch-engine" variant="ghost">
                  Back to overview
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Section>
    </main>
  );
}
