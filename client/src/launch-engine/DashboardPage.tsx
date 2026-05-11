import { ArrowRight, CheckCircle2, Clock3, Layers3, RadioTower, Rocket, TrendingUp } from "lucide-react";
import { Button, Card, Section } from "./components";

const metrics = [
  { label: "Launch readiness", value: "82%", icon: Rocket },
  { label: "Funnel assets", value: "6/10", icon: Layers3 },
  { label: "Automation status", value: "3 live", icon: RadioTower },
];

const tasks = [
  "Publish lead magnet landing page",
  "Write welcome email sequence",
  "Connect brand scan form to CRM",
  "Create founder offer checkout",
];

const pipeline = [
  { stage: "Scan", status: "Complete" },
  { stage: "Offer", status: "In progress" },
  { stage: "Funnel", status: "Next" },
  { stage: "Automate", status: "Next" },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-[#E5E7EB]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-[#0A0A0A] p-5 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-4 lg:block">
            <a href="/launch-engine" className="text-base font-black text-white">
              Kindai Launch Engine
            </a>
            <Button href="/launch-engine/brand-scan" className="min-h-10 px-4 py-2 lg:mt-8 lg:w-full">
              New scan
            </Button>
          </div>
          <nav className="mt-6 hidden space-y-2 lg:block">
            {["Overview", "Brand scans", "Launch assets", "Automations"].map((item, index) => (
              <div
                key={item}
                className={`rounded-xl px-4 py-3 text-sm font-bold ${
                  index === 0 ? "bg-[#6C5CE7] text-white" : "text-[#9CA3AF] hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {item}
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <Section className="py-8">
            <div className="mx-auto max-w-5xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#A9A1FF]">Dashboard</p>
                  <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Launch command centre</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9CA3AF]">
                    A simple MVP shell for tracking brand scans, launch assets and automation priorities.
                  </p>
                </div>
                <Button href="/launch-engine/brand-scan" variant="secondary">
                  Run another scan <ArrowRight className="size-4" />
                </Button>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <Card key={metric.label} className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-[#9CA3AF]">{metric.label}</p>
                          <p className="mt-2 text-3xl font-black text-white">{metric.value}</p>
                        </div>
                        <div className="rounded-xl bg-[#6C5CE7]/18 p-3 text-[#A9A1FF]">
                          <Icon className="size-5" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="size-5 text-[#A9A1FF]" />
                    <h2 className="text-xl font-black text-white">Launch pipeline</h2>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-4">
                    {pipeline.map((item, index) => (
                      <div key={item.stage} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="mb-4 flex size-8 items-center justify-center rounded-lg bg-[#6C5CE7]/18 text-sm font-black text-[#A9A1FF]">
                          {index + 1}
                        </div>
                        <p className="font-black text-white">{item.stage}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">
                          {item.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <Clock3 className="size-5 text-[#A9A1FF]" />
                    <h2 className="text-xl font-black text-white">Next actions</h2>
                  </div>
                  <div className="mt-6 space-y-3">
                    {tasks.map((task) => (
                      <div key={task} className="flex items-start gap-3 rounded-xl bg-white/[0.04] p-3">
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#6C5CE7]" />
                        <span className="text-sm leading-6 text-[#E5E7EB]">{task}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}
