import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Download, Fence, Printer, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { sampleFencingVideo, type SurveyFrame } from "@/lib/fencingVideo";
import {
  fencingConfig,
  fencingProducts,
  type FencingProductKey,
} from "../../../config/industries/fencing";
import {
  calculateFence,
  defaultFenceInput,
  fenceInputSchema,
  fencingCsv,
  priceFence,
  type FenceInput,
  type FencePrices,
} from "@shared/fencing";

const money = (n: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
    n
  );
const numericFields: {
  key: Exclude<keyof FenceInput, "runs" | "style">;
  label: string;
  min: number;
  max: number;
  step?: number;
}[] = [
  {
    key: "spacing",
    label: "Maximum post spacing (m)",
    min: 0.5,
    max: 5,
    step: 0.1,
  },
  { key: "gates", label: "Complete gate sets", min: 0, max: 50 },
  { key: "waste", label: "Waste allowance (%)", min: 0, max: 30 },
  { key: "railRows", label: "Timber rail rows", min: 1, max: 5 },
  {
    key: "railLength",
    label: "Rail stock length (m)",
    min: 1,
    max: 6,
    step: 0.1,
  },
  { key: "wireRows", label: "Plain wire strands", min: 1, max: 12 },
  { key: "wireRoll", label: "Plain wire roll length (m)", min: 10, max: 2000 },
  {
    key: "concreteBagsPerPost",
    label: "20kg concrete bags per post",
    min: 0,
    max: 20,
    step: 0.5,
  },
  {
    key: "fastenersPerPack",
    label: "Nails / screws per pack",
    min: 1,
    max: 2000,
  },
  {
    key: "staplesPerPack",
    label: "Staples / ties per pack",
    min: 1,
    max: 2000,
  },
];

export default function FencingEstimator() {
  const [input, setInput] = useState<FenceInput>({ ...defaultFenceInput });
  const [runs, setRuns] = useState("30");
  const [store, setStore] = useState("");
  const [prices, setPrices] = useState<FencePrices>({});
  const [delivery, setDelivery] = useState("");
  const [extras, setExtras] = useState("");
  const [notes, setNotes] = useState("");
  const [goats, setGoats] = useState<"unknown" | "adults" | "kids" | "mixed">(
    "unknown"
  );
  const [horns, setHorns] = useState<"unknown" | "yes" | "no">("unknown");
  const [frames, setFrames] = useState<SurveyFrame[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [clipName, setClipName] = useState("");
  const [priceMessage, setPriceMessage] = useState("");
  const [reviewedSnapshot, setReviewedSnapshot] = useState("");
  const status = trpc.fencing.status.useQuery(undefined, { retry: false });
  const survey = trpc.fencing.survey.useMutation();
  const priceLookup = trpc.fencing.price.useMutation();
  const parsed = fenceInputSchema.safeParse({
    ...input,
    runs: runs.split(/[,\n]/).map(v => Number(v.trim())),
  });
  const estimate = parsed.success ? calculateFence(parsed.data) : null;
  const priced = estimate ? priceFence(estimate.lines, prices) : null;
  const allowancesValid = [delivery, extras].every(
    v => v !== "" && Number.isFinite(Number(v)) && Number(v) >= 0
  );
  const complete = priced?.complete && allowancesValid;
  const allowance = (value: string) => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
  const total = (priced?.subtotal ?? 0) + allowance(delivery) + allowance(extras);
  const snapshot = JSON.stringify({
    notes,
    goats,
    horns,
    clipName,
    frames: frames.map(f => f.image),
  });
  const stale = !!survey.data && reviewedSnapshot !== snapshot;

  async function loadVideo(file?: File) {
    if (!file) return;
    setFrames([]);
    setVideoError("");
    survey.reset();
    setExtracting(true);
    setClipName(file.name);
    try {
      setFrames(await sampleFencingVideo(file));
    } catch (error) {
      setVideoError(
        error instanceof Error ? error.message : "Could not read this video."
      );
    } finally {
      setExtracting(false);
    }
  }
  function setManualPrice(key: FencingProductKey, value: string) {
    setPrices(old => {
      const next = { ...old };
      if (value === "" || !Number.isFinite(Number(value)) || Number(value) < 0)
        delete next[key];
      else
        next[key] = {
          amount: Number(value),
          checkedAt: new Date().toISOString(),
          store: store.trim() || "Store not recorded",
          source: "manual",
          url: fencingProducts[key].url,
        };
      return next;
    });
  }
  async function lookup(key: "mesh" | "paling" | "concrete") {
    setPriceMessage("");
    try {
      const price = await priceLookup.mutateAsync({ key });
      setPrices(old => ({ ...old, [key]: price }));
      setPriceMessage(
        "Online listing price retrieved. Confirm your local store and product suitability before buying."
      );
    } catch (error) {
      setPriceMessage(
        error instanceof Error
          ? error.message
          : "Price unavailable; enter the store price."
      );
    }
  }
  function download() {
    if (!estimate) return;
    const csv =
      fencingCsv(estimate.lines, prices) +
      `\r\n\r\n"Estimate status","${complete ? "Priced budget — suitability still requires review" : "INCOMPLETE — prices or allowances missing"}"\r\n"Delivery incl GST","${delivery || "NOT ENTERED"}"\r\n"Other site costs incl GST","${extras || "NOT ENTERED"}"\r\n"${complete ? "Budget total" : "Known costs only"}","${total.toFixed(2)}"\r\n"Scope","Materials budget only; no labour or profit added. Gate widths excluded from runs. Separate run ends are not shared. Confirm goat suitability, post specification and footing requirements."`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "kindai-fencing-materials.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <AppLayout title="Fencing">
      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-pink-600">
              kindai · personal projects
            </p>
            <h1 className="mt-2 text-3xl font-black">{fencingConfig.title}</h1>
            <p className="mt-2 text-muted-foreground">
              Walk the paddock. Check the risks. Build your materials list.
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={download} disabled={!estimate}>
              <Download className="mr-2 h-4 w-4" />
              Materials CSV
            </Button>
          </div>
        </header>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fence className="h-5 w-5 text-pink-600" />
                1. Your fence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fence-style">Fence type</Label>
                <Select
                  value={input.style}
                  onValueChange={v =>
                    setInput(old => ({
                      ...old,
                      style: v as FenceInput["style"],
                    }))
                  }
                >
                  <SelectTrigger id="fence-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timber_mesh">
                      Timber posts + rails + wire mesh
                    </SelectItem>
                    <SelectItem value="mesh">
                      Timber posts + wire mesh
                    </SelectItem>
                    <SelectItem value="timber">Timber paling fence</SelectItem>
                    <SelectItem value="wire">
                      Timber posts + plain wire strands
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fence-runs">
                  Measured fence runs, in metres
                </Label>
                <Input
                  id="fence-runs"
                  value={runs}
                  onChange={e => setRuns(e.target.value)}
                  placeholder="30, 18, 12"
                />
                <p className="text-sm text-muted-foreground">
                  Separate each straight run with a comma. Split at corners and
                  gates. Exclude gate openings. Each run has its own end posts;
                  no shared corners assumed.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {numericFields.slice(0, 3).map(f => (
                  <div key={f.key} className="space-y-2">
                    <Label htmlFor={f.key}>{f.label}</Label>
                    <Input
                      id={f.key}
                      type="number"
                      min={f.min}
                      max={f.max}
                      step={f.step || 1}
                      value={Number.isNaN(input[f.key]) ? "" : input[f.key]}
                      onChange={e =>
                        setInput(old => ({
                          ...old,
                          [f.key]:
                            e.target.value === ""
                              ? NaN
                              : Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <details>
                <summary className="cursor-pointer py-2 font-bold">
                  Adjust construction & pack sizes
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  {numericFields.slice(3).map(f => (
                    <div key={f.key} className="space-y-2">
                      <Label htmlFor={f.key}>{f.label}</Label>
                      <Input
                        id={f.key}
                        type="number"
                        min={f.min}
                        max={f.max}
                        step={f.step || 1}
                        value={Number.isNaN(input[f.key]) ? "" : input[f.key]}
                        onChange={e =>
                          setInput(old => ({
                            ...old,
                            [f.key]:
                              e.target.value === ""
                                ? NaN
                                : Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </details>
              {!parsed.success && (
                <p role="alert" className="text-red-600">
                  Enter positive run lengths and valid construction values.{" "}
                  {parsed.error.issues[0]?.message}
                </p>
              )}
              <div className="rounded-xl bg-muted p-4 text-sm leading-6">
                Budget assumptions, not a construction design: palings are 1.8m
                high; the linked mesh is 1.22m high. Confirm post length,
                in-ground treatment, embedment, bracing and concrete quantities
                for your site. Rails can reduce effective bay spacing. No labour
                or profit is added.
              </div>
            </CardContent>
          </Card>
          <Card className="border-pink-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-pink-600" />
                2. Walkthrough for the AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6">
                Film a slow 20–60 second walk along the fence line. Show the
                ground, corners, gates, slopes and nearby climbable objects. Up
                to 120 seconds / 100 MB. Type any spoken measurements below;
                audio is not analysed.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="record-fence" className="mb-2 block">
                    Record on your phone
                  </Label>
                  <Input
                    className="h-auto py-3"
                    id="record-fence"
                    type="file"
                    accept="video/*"
                    capture="environment"
                    disabled={extracting || survey.isPending}
                    onChange={e => {
                      void loadVideo(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="upload-fence" className="mb-2 block">
                    Choose an existing video
                  </Label>
                  <Input
                    className="h-auto py-3"
                    id="upload-fence"
                    type="file"
                    accept="video/*,.mov,.mp4"
                    disabled={extracting || survey.isPending}
                    onChange={e => {
                      void loadVideo(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
              {extracting && <p role="status">Preparing eight video frames…</p>}
              {videoError && (
                <p role="alert" className="text-red-600">
                  {videoError}
                </p>
              )}
              {frames.length > 0 && (
                <div>
                  <p className="mb-2 text-sm">
                    {clipName} · {frames.length} frames ready
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {frames.map(f => (
                      <figure key={f.seconds}>
                        <img
                          src={f.image}
                          alt={`Fence area at ${f.seconds.toFixed(1)} seconds`}
                          className="aspect-video w-full rounded object-cover"
                        />
                        <figcaption className="text-sm text-muted-foreground">
                          {f.seconds.toFixed(1)}s
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="goats">Goats</Label>
                  <Select
                    value={goats}
                    onValueChange={v => setGoats(v as typeof goats)}
                  >
                    <SelectTrigger id="goats">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Not sure yet</SelectItem>
                      <SelectItem value="adults">Adults</SelectItem>
                      <SelectItem value="kids">Kids</SelectItem>
                      <SelectItem value="mixed">Adults and kids</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horns">Any horns?</Label>
                  <Select
                    value={horns}
                    onValueChange={v => setHorns(v as typeof horns)}
                  >
                    <SelectTrigger id="horns">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Not sure</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-notes">
                  Site notes & measured dimensions
                </Label>
                <Textarea
                  id="site-notes"
                  maxLength={4000}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Goat size, fence purpose, gate widths, known wet ground, existing posts…"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Only the displayed frames and these notes are sent to the
                estimator’s AI provider when you press Review. The original
                video stays on your device. This page does not save your work;
                download the CSV or print before leaving.
              </p>
              <Button
                className="min-h-12 w-full kindai-btn-primary"
                disabled={
                  !frames.length ||
                  extracting ||
                  survey.isPending ||
                  !status.data?.aiReady
                }
                onClick={() => {
                  setReviewedSnapshot(snapshot);
                  survey.mutate({ frames, notes, goats, horns });
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {survey.isPending
                  ? "Reviewing the fence area…"
                  : "Review for goat fencing"}
              </Button>
              <p className="text-sm" role="status">
                {status.isLoading
                  ? "Checking AI connection…"
                  : status.isError
                    ? "Could not check AI connection. Refresh or sign in again."
                    : status.data?.aiReady
                      ? `Uses your estimator’s configured AI (${status.data.model}).`
                      : "AI connection not configured. Quantities and price entry still work."}
              </p>
              {survey.error && (
                <p role="alert" className="text-red-600">
                  {survey.error.message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        {survey.data && (
          <Card>
            <CardHeader>
              <CardTitle>
                AI site review {stale && "— inputs changed; review again"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                {survey.data.frameCount} sampled frames ·{" "}
                {new Date(survey.data.reviewedAt).toLocaleString("en-AU")} ·
                Visual guidance, not measured takeoff. Verify on site.
              </p>
              <div className="whitespace-pre-wrap leading-7">
                {survey.data.report}
              </div>
            </CardContent>
          </Card>
        )}
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
          <h2 className="font-bold">Goat suitability needs a separate check</h2>
          <p className="mt-2 text-sm leading-6">
            Check openings against your goats’ heads, horns and kid size.
            Inspect gaps at ground level, gates, washouts and climbable objects.
            The linked Bunnings mesh is a pricing candidate, not an approved
            goat-fence specification.{" "}
            {input.style === "wire" &&
              "Plain wire is not assumed to contain your goats; a complete design is still needed."}{" "}
            {input.style === "timber" &&
              "Check timber treatment suitability where goats can chew it."}
          </p>
          <a
            className="mt-2 inline-block text-sm underline"
            href={fencingConfig.guidanceUrl}
            target="_blank"
            rel="noreferrer"
          >
            NSW Agriculture goat fencing guide (2003; background guidance)
          </a>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>3. Bunnings materials & budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid items-start gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="store">Your Bunnings store / postcode</Label>
                <Input
                  id="store"
                  value={store}
                  onChange={e => setStore(e.target.value)}
                  placeholder="Enter the store used for your manual prices"
                />
                <p className="text-sm text-muted-foreground">
                  This records your manual price source; it does not set
                  Bunnings’ online store. All prices include GST. Search links
                  require you to choose a matching product.
                </p>
              </div>
              <div className="rounded-xl bg-slate-950 p-5 text-white">
                <p className="text-sm">
                  {complete
                    ? "Materials budget + allowances"
                    : "Known costs only — incomplete"}
                </p>
                <p className="mt-1 text-3xl font-black">{money(total)}</p>
                <p className="mt-2 text-sm text-slate-300">
                  {estimate
                    ? `${estimate.length.toFixed(1)}m · ${estimate.bays} bays · ${estimate.posts} fence-line posts`
                    : "Enter valid measurements"}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {priced?.missing.length ?? 0} unpriced materials
                  {!allowancesValid
                    ? " · enter delivery and site allowances"
                    : ""}
                  . No extra GST added.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Product links reviewed {fencingConfig.sourceReviewed}. No prices
              have been assumed. “Check price” tries the exact Bunnings listing;
              if unavailable, open Bunnings and enter the price. Online prices
              and stock require local confirmation.
            </p>
            {priceMessage && (
              <p role="status" className="rounded-lg bg-muted p-3 text-sm">
                {priceMessage}
              </p>
            )}
            <div className="space-y-3">
              {estimate?.lines.map(line => {
                const product = fencingProducts[line.key];
                const price = prices[line.key];
                return (
                  <article
                    key={line.key}
                    className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_110px_150px]"
                  >
                    <div>
                      <h3 className="font-bold">{product.label}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {line.basis}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-4">
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-pink-600 underline"
                        >
                          {product.exact
                            ? "Open Bunnings product"
                            : "Find matching materials"}
                        </a>
                        {(line.key === "mesh" ||
                          line.key === "paling" ||
                          line.key === "concrete") && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={priceLookup.isPending}
                            onClick={() =>
                              void lookup(
                                line.key as "mesh" | "paling" | "concrete"
                              )
                            }
                          >
                            Check price
                          </Button>
                        )}
                      </div>
                      {price && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {price.source === "manual"
                            ? "Entered by you"
                            : "Bunnings listing"}{" "}
                          · {price.store} ·{" "}
                          {new Date(price.checkedAt).toLocaleDateString(
                            "en-AU"
                          )}
                        </p>
                      )}
                    </div>
                    <div className="font-bold">
                      {line.quantity}{" "}
                      <span className="text-sm font-normal">
                        {product.unit}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`price-${line.key}`}>
                        AUD / {product.unit}
                      </Label>
                      <Input
                        id={`price-${line.key}`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price needed"
                        value={price?.amount ?? ""}
                        onChange={e => setManualPrice(line.key, e.target.value)}
                      />
                      <p className="text-right font-bold">
                        {price
                          ? money(price.amount * line.quantity)
                          : "Unpriced"}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="delivery">
                  Delivery / collection cost incl GST (enter 0 if none)
                </Label>
                <Input
                  id="delivery"
                  type="number"
                  min="0"
                  step="0.01"
                  value={delivery}
                  onChange={e => setDelivery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="extras">
                  Other site costs incl GST (enter 0 if none)
                </Label>
                <Input
                  id="extras"
                  type="number"
                  min="0"
                  step="0.01"
                  value={extras}
                  onChange={e => setExtras(e.target.value)}
                />
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Allow separately for removal, clearing, auger hire, difficult
              ground, creek crossings, finishing, electric fencing and labour.
              Bracing and gate sets must include all their posts and hardware.
              Confirm waste, joins, fastener pack counts and the actual product
              specifications before ordering.
            </p>
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
}
