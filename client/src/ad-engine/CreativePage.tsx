import { FormEvent, useState } from "react";
import { FilePlus2, Send, Sparkles } from "lucide-react";
import { ActionButton, AdEngineShell, Field, Panel } from "./components";
import {
  createCampaignDraft,
  generateCopy,
  publishPausedCampaignDraft,
  type CampaignDraft,
  type GeneratedCopy,
  type MetaDraftPublishResult,
} from "./api";

export default function AdEngineCreativePage() {
  const [productBenefits, setProductBenefits] = useState("AI systems that turn messy founder ideas into simple launch actions.");
  const [audiencePainPoints, setAudiencePainPoints] = useState("Overwhelm, unclear priorities, too much manual work and slow launches.");
  const [offer, setOffer] = useState("Kindai Launch System");
  const [variants, setVariants] = useState<GeneratedCopy[]>([]);
  const [draft, setDraft] = useState<CampaignDraft | null>(null);
  const [publishResult, setPublishResult] = useState<MetaDraftPublishResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      setVariants(await generateCopy({ productBenefits, audiencePainPoints, offer, tone: "direct and supportive" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDraftCampaign() {
    setIsDrafting(true);
    setError("");
    try {
      setDraft(
        await createCampaignDraft({
          product: "kindai_estimator",
          dailyBudgetAud: 30,
          audienceFocus: "Australian builders and trades",
        })
      );
      setPublishResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Campaign draft failed");
    } finally {
      setIsDrafting(false);
    }
  }

  async function handlePublishPausedDraft() {
    setIsPublishing(true);
    setError("");
    try {
      const result = await publishPausedCampaignDraft({
        product: "kindai_estimator",
        dailyBudgetAud: draft?.dailyBudgetAud ?? 30,
        audienceFocus: "Australian builders and trades",
      });
      setDraft(result.draft);
      setPublishResult(result.publishResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Meta draft publish failed");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <AdEngineShell>
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel className="p-6">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#A9A1FF]">Creative generation</p>
          <h1 className="mt-2 text-3xl font-black text-white">Generate ad copy that sells the outcome</h1>
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-bold text-[#E5E7EB]">
              Product benefits
              <Field className="mt-2" onChange={(event) => setProductBenefits(event.target.value)} value={productBenefits} />
            </label>
            <label className="block text-sm font-bold text-[#E5E7EB]">
              Audience pain points
              <Field className="mt-2" onChange={(event) => setAudiencePainPoints(event.target.value)} value={audiencePainPoints} />
            </label>
            <label className="block text-sm font-bold text-[#E5E7EB]">
              Offer
              <input
                className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm text-[#E5E7EB] outline-none placeholder:text-[#9CA3AF] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/35"
                onChange={(event) => setOffer(event.target.value)}
                value={offer}
              />
            </label>
            <ActionButton disabled={isLoading} type="submit">
              <Sparkles className="size-4" />
              {isLoading ? "Generating..." : "Generate copy"}
            </ActionButton>
            <button
              className="ml-0 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/8 px-5 py-3 text-sm font-bold text-[#E5E7EB] transition hover:bg-white/12 disabled:pointer-events-none disabled:opacity-60 sm:ml-3"
              disabled={isDrafting}
              onClick={handleDraftCampaign}
              type="button"
            >
              <FilePlus2 className="size-4" />
              {isDrafting ? "Drafting..." : "Draft Kindai Estimator campaign"}
            </button>
            {error ? <p className="text-sm text-[#FCA5A5]">{error}</p> : null}
          </form>
        </Panel>

        <Panel className="p-6">
          <h2 className="text-xl font-black text-white">AI scored variants</h2>
          <div className="mt-5 space-y-4">
            {variants.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 p-6 text-sm leading-6 text-[#9CA3AF]">
                Generated copy will appear here with clarity, emotional pull and CTA strength scores.
              </div>
            ) : (
              variants.map((variant) => (
                <div key={`${variant.headline}-${variant.cta}`} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-lg font-black text-white">{variant.headline}</p>
                  <p className="mt-3 text-sm leading-6 text-[#D1D5DB]">{variant.primaryText}</p>
                  <p className="mt-3 text-sm font-bold text-[#A9A1FF]">{variant.cta}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    {Object.entries(variant.scores).map(([label, score]) => (
                      <div key={label} className="rounded-lg bg-[#0F172A] p-3">
                        <p className="capitalize text-[#9CA3AF]">{label.replace(/([A-Z])/g, " $1")}</p>
                        <p className="mt-1 text-lg font-black text-white">{score}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        {draft ? (
          <Panel className="p-6 lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#A9A1FF]">Draft only</p>
                <h2 className="mt-2 text-2xl font-black text-white">{draft.name}</h2>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <p className="rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 px-3 py-2 text-sm font-bold text-[#BBF7D0]">
                  ${draft.dailyBudgetAud}/day
                </p>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#6C5CE7] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_45px_rgba(108,92,231,0.35)] transition hover:bg-[#7C6CF0] disabled:pointer-events-none disabled:opacity-60"
                  disabled={isPublishing}
                  onClick={handlePublishPausedDraft}
                  type="button"
                >
                  <Send className="size-4" />
                  {isPublishing ? "Creating paused Meta draft..." : "Create paused draft in Meta"}
                </button>
              </div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {draft.audiences.map((audience) => (
                <div key={audience.name} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-bold text-white">{audience.name}</p>
                  <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">{audience.painPoint}</p>
                  <p className="mt-3 text-xs text-[#A9A1FF]">{audience.interests.join(" · ")}</p>
                </div>
              ))}
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 lg:col-span-1">
                <p className="font-bold text-white">Learning rule</p>
                <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">{draft.prediction.successThreshold}</p>
                <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">{draft.prediction.scaleRule}</p>
              </div>
            </div>
            {publishResult ? (
              <div className="mt-5 rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 p-4">
                <p className="font-bold text-[#BBF7D0]">
                  {publishResult.createdInMeta ? "Paused Meta draft created" : "Meta draft not created"}
                </p>
                {publishResult.campaign ? (
                  <p className="mt-2 text-sm text-[#D1FAE5]">Campaign ID: {publishResult.campaign.id}</p>
                ) : null}
                <p className="mt-2 text-sm text-[#D1FAE5]">Ad sets created: {publishResult.adSets.length}</p>
                {publishResult.skipped.map((item) => (
                  <p key={`${item.asset}-${item.reason}`} className="mt-2 text-sm text-[#FDE68A]">
                    {item.asset}: {item.reason}
                  </p>
                ))}
              </div>
            ) : null}
          </Panel>
        ) : null}
      </div>
    </AdEngineShell>
  );
}
