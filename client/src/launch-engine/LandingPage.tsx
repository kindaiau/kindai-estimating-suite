import { ArrowRight, BarChart3, Blocks, ScanSearch, Sparkles } from "lucide-react";
import { Button, Card, Section } from "./components";

const steps = [
  {
    icon: ScanSearch,
    title: "Scan the brand",
    text: "Review positioning, message clarity, visual trust and offer strength from a single URL.",
  },
  {
    icon: Blocks,
    title: "Build the launch system",
    text: "Turn the scan into landing pages, lead magnets, emails, offers and automations.",
  },
  {
    icon: BarChart3,
    title: "Track what moves",
    text: "Use a simple dashboard to see the next action, funnel health and launch readiness.",
  },
];

const proof = [
  "Brand score",
  "Offer angle",
  "Launch checklist",
  "Automation priorities",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-[#E5E7EB]">
      <nav className="border-b border-white/10 bg-[#0A0A0A]/80 px-5 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="/launch-engine" className="text-sm font-black tracking-wide text-white">
            Kindai Launch Engine
          </a>
          <Button href="/launch-engine/brand-scan" className="min-h-10 px-4 py-2">
            Start scan
          </Button>
        </div>
      </nav>

      <Section className="pb-10 pt-16 sm:pt-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#6C5CE7]/35 bg-[#6C5CE7]/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#A9A1FF]">
              <Sparkles className="size-4" />
              AI launch system for founders
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Turn a rough idea into a launch-ready business system.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#9CA3AF] sm:text-lg">
              Kindai Launch Engine scans your brand, finds the clearest offer, then gives you the
              next launch actions without the noise.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/launch-engine/brand-scan">
                Run brand scan <ArrowRight className="size-4" />
              </Button>
              <Button href="/launch-engine/dashboard" variant="secondary">
                View dashboard
              </Button>
            </div>
          </div>

          <Card className="p-5 sm:p-6">
            <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#9CA3AF]">Launch readiness</p>
                  <p className="mt-1 text-4xl font-black text-white">82%</p>
                </div>
                <div className="rounded-xl bg-[#6C5CE7]/18 p-3 text-[#A9A1FF]">
                  <BarChart3 className="size-7" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {proof.map((item, index) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="h-2 rounded-full bg-[#6C5CE7]" style={{ width: `${72 - index * 9}%` }} />
                    <span className="w-36 text-sm text-[#9CA3AF]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section className="pt-6">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="p-6">
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-[#6C5CE7]/18 text-[#A9A1FF]">
                  <Icon className="size-5" />
                </div>
                <h2 className="text-xl font-black text-white">{step.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#9CA3AF]">{step.text}</p>
              </Card>
            );
          })}
        </div>
      </Section>
    </main>
  );
}
