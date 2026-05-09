import { useEffect, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, CircleDollarSign, Gauge, Sparkles, TrendingUp } from "lucide-react";
import { AdEngineShell, Panel } from "./components";
import { fetchAdEngineOverview, type AdEngineOverview } from "./api";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(value);

export default function AdEngineOverviewPage() {
  const [data, setData] = useState<AdEngineOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdEngineOverview().then(setData).catch((err) => setError(err instanceof Error ? err.message : "Load failed"));
  }, []);

  const metrics = data
    ? [
        { label: "Spend", value: formatMoney(data.summary.spend), icon: CircleDollarSign },
        { label: "ROAS", value: `${data.summary.roas.toFixed(2)}x`, icon: TrendingUp },
        { label: "CPA", value: formatMoney(data.summary.cpa), icon: Gauge },
        { label: "CTR", value: `${data.summary.ctr.toFixed(2)}%`, icon: BarChart3 },
      ]
    : [];

  return (
    <AdEngineShell>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#A9A1FF]">Paid acquisition</p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Ad performance command centre</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9CA3AF]">
              See spend, predicted performance and the next action without digging through Ads Manager.
            </p>
          </div>
          <a
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/8 px-5 py-3 text-sm font-bold text-[#E5E7EB] hover:bg-white/12"
            href="/ad-engine/creative"
          >
            Generate copy <Sparkles className="size-4" />
          </a>
        </div>

        {error ? (
          <Panel className="mt-8 flex items-center gap-3 p-5 text-[#FCA5A5]">
            <AlertTriangle className="size-5" />
            {error}
          </Panel>
        ) : null}

        {!data ? (
          <Panel className="mt-8 p-6 text-sm text-[#9CA3AF]">Loading Ad Engine...</Panel>
        ) : (
          <>
            <Panel
              className={`mt-8 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                data.isLive ? "border-[#22C55E]/30 bg-[#22C55E]/10" : "border-[#F59E0B]/30 bg-[#F59E0B]/10"
              }`}
            >
              <div className="flex items-start gap-3">
                {data.isLive ? (
                  <CheckCircle2 className="mt-0.5 size-5 text-[#86EFAC]" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-5 text-[#FDE68A]" />
                )}
                <div>
                  <p className={`font-bold ${data.isLive ? "text-[#BBF7D0]" : "text-[#FDE68A]"}`}>
                    {data.isLive ? "Live Meta data" : "Mock data"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#D1D5DB]">
                    {data.dataWarning ??
                      `Rows stored today: ${data.storage?.stored ?? 0}. Use this view to monitor spend before approving budget changes.`}
                  </p>
                </div>
              </div>
            </Panel>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <Panel key={metric.label} className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-[#9CA3AF]">{metric.label}</p>
                        <p className="mt-2 text-3xl font-black text-white">{metric.value}</p>
                      </div>
                      <div className="rounded-lg bg-[#6C5CE7]/18 p-3 text-[#A9A1FF]">
                        <Icon className="size-5" />
                      </div>
                    </div>
                  </Panel>
                );
              })}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Panel className="p-6">
                <h2 className="text-xl font-black text-white">Recommended actions</h2>
                <div className="mt-5 space-y-3">
                  {data.actions.map((action) => (
                    <div key={action.adSetId} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-bold text-white">{action.action.replace("_", " ")}</p>
                        <p className="text-sm text-[#A9A1FF]">
                          {formatMoney(action.currentBudget)} to {formatMoney(action.recommendedBudget)}
                        </p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">{action.reason}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel className="p-6">
                <h2 className="text-xl font-black text-white">Top creatives</h2>
                <div className="mt-5 space-y-3">
                  {data.topCreatives.map((creative) => (
                    <div key={creative.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <p className="font-bold text-white">{creative.name}</p>
                      <p className="mt-2 text-sm text-[#9CA3AF]">
                        ROAS {creative.roas.toFixed(2)}x · CTR {creative.ctr.toFixed(2)}% · Spend {formatMoney(creative.spend)}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </>
        )}
      </div>
    </AdEngineShell>
  );
}
