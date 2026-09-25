import { useState } from "react";
import { useLocation } from "wouter";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileImage, ScanLine, Upload, Layers, Zap, CheckCircle2,
  AlertTriangle, Building2, Camera, ChevronDown, ChevronUp,
  ArrowRight, BookOpen, Shield, Printer, Monitor, Smartphone,
  HelpCircle, Star
} from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "What file formats does Kindai accept?",
    a: "Kindai accepts JPG, PNG, WebP, and PDF files. PDF is the preferred format for scanned plans as it preserves the highest resolution. HEIC files from iPhone cameras should be converted to JPG first — most iPhones do this automatically when you share or email the photo.",
  },
  {
    q: "How many pages can I upload per job?",
    a: "The Founding Workflow Setup is limited to up to five agreed files for each reviewed job. Larger drawing sets are not part of the public offer and must be assessed separately before private files are accepted.",
  },
  {
    q: "What is the maximum file size?",
    a: "32MB per file. If a scan is larger, reduce its resolution and confirm that dimensions, notes and schedules remain readable before handover.",
  },
  {
    q: "Can I scan plans on our office printer?",
    a: "Yes. Scan to PDF on your office multifunction printer and aim for readable dimensions, notes and schedules. Keep each agreed file below 32MB and inspect the export before handover.",
  },
  {
    q: "Can I photograph plans with my phone?",
    a: "Yes. For best results: lay the plan flat on a clean surface, use good lighting (avoid shadows across the plan), hold the phone directly above the plan (not at an angle), and use the highest camera resolution. Modern smartphones produce excellent results. If the plan is large (A0/A1), photograph it in sections and upload each section as a separate page.",
  },
  {
    q: "How does Kindai handle multi-page uploads?",
    a: "For the founding workflow, up to five agreed files can be considered together. The estimator must check duplicate references, schedules, quantities and exclusions across every file before the draft is accepted.",
  },
  {
    q: "What if my plan is hand-drawn or low quality?",
    a: "Printed or digital plans with clear dimensions are the safer input. Hand-drawn or low-quality plans may produce incomplete evidence, so missing or uncertain items must be flagged and checked rather than filled in by assumption.",
  },
  {
    q: "Does Kindai work with CAD or BIM files?",
    a: "Not directly — Kindai reads images and PDFs. If you have DWG or Revit files, export them as PDF first (most CAD software has a PDF export option). PDF exports from CAD are usually the highest quality input you can give Kindai.",
  },
  {
    q: "How accurate is the AI takeoff?",
    a: "Reliability depends on plan quality, drawing conventions, trade and job complexity. KindAI provides source notes, assumptions and review flags, but these do not replace checking the underlying quantities. A qualified estimator must review the scope, rates, exclusions and compliance before any quote is issued.",
  },
  {
    q: "Can I use Kindai for a 50-page commercial set?",
    a: "Not under the public founding scope. The paid setup covers up to five agreed files per reviewed job. A 50-page commercial set requires separate product, workflow and support validation before it can be offered.",
  },
];

// ─── Best Practice Cards ───────────────────────────────────────────────────────
const BEST_PRACTICES = [
  {
    icon: Printer,
    colour: "from-blue-500 to-cyan-500",
    title: "Office Scanner (Recommended)",
    badge: "Best Quality",
    badgeColour: "bg-green-100 text-green-700",
    steps: [
      "Place plans face-down on the scanner glass",
      "Set resolution to 200–300 DPI",
      "Select PDF output (not JPG)",
      "Save to email or shared drive",
      "Upload directly to Kindai",
    ],
    tip: "Most office MFPs (Ricoh, Konica, Canon, HP) produce excellent results at 200 DPI. No need to go higher — it just creates larger files.",
  },
  {
    icon: Camera,
    colour: "from-pink-500 to-orange-500",
    title: "Phone Camera",
    badge: "Quick & Easy",
    badgeColour: "bg-blue-100 text-blue-700",
    steps: [
      "Lay the plan flat on a clean, well-lit surface",
      "Hold phone directly above the plan (not at an angle)",
      "Avoid shadows — use natural light or overhead lighting",
      "Use the highest camera resolution setting",
      "For A0/A1 plans, photograph in sections",
    ],
    tip: "iPhone and modern Android cameras produce excellent results. The key is avoiding shadows and keeping the phone parallel to the plan surface.",
  },
  {
    icon: Monitor,
    colour: "from-violet-500 to-purple-500",
    title: "CAD / Digital Export",
    badge: "Strongest Input",
    badgeColour: "bg-violet-100 text-violet-700",
    steps: [
      "In AutoCAD, Revit, or ArchiCAD: File → Export → PDF",
      "Select 'High Quality Print' or equivalent",
      "Include all relevant drawing sheets",
      "Upload the exported PDF directly",
    ],
    tip: "A clear vector PDF generally gives the model more readable detail than a compressed photo. Review every extracted item and dimension against the drawing.",
  },
  {
    icon: Smartphone,
    colour: "from-emerald-500 to-teal-500",
    title: "Large-Format Scanner",
    badge: "Large Plan Scan",
    badgeColour: "bg-amber-100 text-amber-700",
    steps: [
      "Use HP DesignJet, Contex, or similar large-format scanner",
      "Set to 200 DPI minimum (300 DPI for complex drawings)",
      "Export as PDF — not TIFF",
      "Split very large files into logical sections if over 32MB",
    ],
    tip: "Large-format scanners preserve detail on A0/A1 drawings. If a scan is over 32MB, reduce the DPI and check that dimensions and annotations remain readable before uploading.",
  },
];

// ─── Founding Workflow ─────────────────────────────────────────────────────────
const FOUNDING_STEPS = [
  { num: "01", title: "Agree one workflow", desc: "The application confirms one cabinet-making or commercial-joinery workflow and the estimator responsible for review." },
  { num: "02", title: "Prepare supported files", desc: "Provide up to five agreed PDF, JPG or PNG files. Each file must be no larger than 32MB and readable at normal zoom." },
  { num: "03", title: "Use the controlled handover", desc: "Private files are accepted only after application approval, payment and confirmation of the processing scope." },
  { num: "04", title: "Provide authorised inputs", desc: "Supply up to 150 approved price-book rows and 20 written estimating rules for the agreed workflow." },
  { num: "05", title: "Prepare a structured draft", desc: "KindAI uses the supported files and approved company inputs to propose quantities, source notes, assumptions and review flags." },
  { num: "06", title: "Review before issue", desc: "A qualified estimator checks quantities, rates, exclusions, compliance and client details before any quote is exported or sent." },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Help() {
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Help & Best Practices | Kindai Estimating Suite"
        description="Learn how to prepare supported files and review KindAI estimate drafts during the controlled cabinet and joinery founding workflow."
        canonical="/help"
        keywords="Kindai help, cabinet estimating workflow, joinery plan reading, plan scanning tips, AI draft review"
      />

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Kindai" className="h-8 w-8 object-contain" />
            <div>
              <span className="font-black text-lg tracking-tight kindai-gradient-text">kindai</span>
              <div className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest -mt-0.5">Estimating Suite</div>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/pricing")} className="text-sm text-gray-500 hover:text-gray-900 font-semibold hidden sm:block">Pricing</button>
            <button onClick={() => navigate("/demo")} className="text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-2 rounded-full">
              Explore Sample
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-bold mb-5">
            <BookOpen className="w-3.5 h-3.5" /> Help & Best Practices
          </div>
          <h1 className="text-3xl sm:text-5xl font-black mb-4">
            Get the most out of{" "}
            <span className="bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Kindai AI
            </span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Learn how to prepare agreed files, inspect source notes and assumptions, and review every draft before it becomes a quote.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><Upload className="w-4 h-4 text-pink-400" /> Up to five agreed files in the founding workflow</span>
            <span className="flex items-center gap-1.5"><FileImage className="w-4 h-4 text-blue-400" /> 32MB per file</span>
            <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-green-400" /> PDF, JPG, PNG, WebP</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-yellow-400" /> Estimator review required</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">

        {/* ── Quick Start ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Quick Start</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: ScanLine, title: "Scan or photograph your plans", desc: "Use your office scanner, phone camera, or CAD export. PDF is preferred.", colour: "text-pink-500" },
              { icon: Upload, title: "Hand over up to five agreed files", desc: "Use the controlled setup process after approval and payment. Keep each file under 32MB.", colour: "text-blue-500" },
              { icon: CheckCircle2, title: "Review the combined draft", desc: "Check quantities, assumptions, rates and exclusions against the source drawings before approval.", colour: "text-green-500" },
            ].map((item, i) => (
              <Card key={i} className="border-gray-100 shadow-sm">
                <CardContent className="p-5">
                  <item.icon className={`w-8 h-8 ${item.colour} mb-3`} />
                  <h3 className="font-black text-gray-900 mb-1.5">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Scanning Best Practices ── */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <ScanLine className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Scanning Best Practices</h2>
          </div>
          <p className="text-gray-500 mb-6 ml-11">The quality of your scan directly affects the accuracy of your takeoff. Here's how to get the best results from each method.</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {BEST_PRACTICES.map((bp, i) => (
              <Card key={i} className="border-gray-100 shadow-sm overflow-hidden">
                <div className={`h-1.5 bg-gradient-to-r ${bp.colour}`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${bp.colour} flex items-center justify-center`}>
                        <bp.icon className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-black text-gray-900">{bp.title}</h3>
                    </div>
                    <Badge className={`text-xs font-bold ${bp.badgeColour} border-0`}>{bp.badge}</Badge>
                  </div>
                  <ol className="space-y-1.5 mb-4">
                    {bp.steps.map((step, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{j + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <p className="text-xs text-amber-700"><span className="font-bold">Tip:</span> {bp.tip}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── File Format Guide ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <FileImage className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">File Format Guide</h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-black text-gray-700">Format</th>
                  <th className="text-left px-5 py-3 font-black text-gray-700">Best For</th>
                  <th className="text-left px-5 py-3 font-black text-gray-700">Max Size</th>
                  <th className="text-left px-5 py-3 font-black text-gray-700">Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { fmt: "PDF", best: "Office scans, CAD exports, multi-page sets", size: "32MB", quality: "Excellent", star: true },
                  { fmt: "JPG / JPEG", best: "Phone photos, scanned images", size: "32MB", quality: "Very Good", star: false },
                  { fmt: "PNG", best: "Screenshots, digital drawings", size: "32MB", quality: "Excellent", star: false },
                  { fmt: "WebP", best: "Web-optimised images", size: "32MB", quality: "Very Good", star: false },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-black text-gray-900 flex items-center gap-2">
                      {row.fmt}
                      {row.star && <Badge className="bg-green-100 text-green-700 border-0 text-[10px] font-bold">Recommended</Badge>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{row.best}</td>
                    <td className="px-5 py-3.5 text-gray-600">{row.size}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 font-semibold ${row.quality === "Excellent" ? "text-green-600" : "text-blue-600"}`}>
                        <Star className="w-3 h-3 fill-current" /> {row.quality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-start gap-2 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700"><span className="font-bold">Note:</span> HEIC files (iPhone default format) are not directly supported. iPhones automatically convert to JPG when you share or email a photo — just share the photo to yourself first, then upload the JPG.</p>
          </div>
        </section>

        {/* ── Founding Workflow ── */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Founding Workflow</h2>
          </div>
          <p className="text-gray-500 mb-6 ml-11">The controlled process for the paid cabinet and joinery founding setup.</p>
          <div className="space-y-3">
            {FOUNDING_STEPS.map((step, i) => (
              <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-xs">{step.num}</span>
                </div>
                <div>
                  <h3 className="font-black text-gray-900 mb-0.5">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tips for Accuracy ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Tips for Maximum Accuracy</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: CheckCircle2, colour: "text-green-500", title: "Do this", items: ["Use PDF format wherever possible", "Keep dimensions and notes readable", "Use only the agreed files for the reviewed job", "Provide authorised rates and written rules", "Confirm the cabinet or joinery workflow", "Review source notes, assumptions and flags"] },
              { icon: AlertTriangle, colour: "text-amber-500", title: "Avoid this", items: ["Blurry or out-of-focus photos", "Plans photographed at an angle", "Very dark or shadowed images", "Files over 32MB", "Uploading unrelated drawings in the same job", "Ignoring missing evidence or review flags"] },
            ].map((col, i) => (
              <Card key={i} className={`border-${i === 0 ? "green" : "amber"}-100 shadow-sm`}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <col.icon className={`w-5 h-5 ${col.colour}`} />
                    <h3 className="font-black text-gray-900">{col.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {col.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? "bg-green-500" : "bg-amber-500"}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-black text-gray-900 pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center py-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 text-white">
            <h2 className="text-2xl sm:text-3xl font-black mb-3">Start with the transparent sample.</h2>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">Explore the estimate structure without uploading a private plan. The next step is an application for the A$2,500 plus GST cabinet and joinery Founding Workflow Setup.</p>
            <button
              onClick={() => navigate("/demo")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 text-white font-black text-sm shadow-lg hover:shadow-pink-500/30 transition-all"
            >
              Explore the Sample <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8 px-4 text-center text-sm text-gray-400">
        <div className="flex justify-center gap-6 mb-3">
          <button onClick={() => navigate("/")} className="hover:text-gray-600">Home</button>
          <button onClick={() => navigate("/pricing")} className="hover:text-gray-600">Pricing</button>
          <button onClick={() => navigate("/demo")} className="hover:text-gray-600">Demo</button>
          <button onClick={() => navigate("/about")} className="hover:text-gray-600">About</button>
        </div>
        <p>© {new Date().getFullYear()} Kindai. All rights reserved.</p>
      </footer>
    </div>
  );
}
