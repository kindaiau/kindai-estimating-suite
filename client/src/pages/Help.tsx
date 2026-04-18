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
    a: "Up to 50 pages per job. This covers the full drawing set for most commercial projects — architectural plans, structural drawings, electrical schematics, hydraulic layouts, and hardware schedules can all be uploaded together. Kindai analyses all pages as a single combined takeoff and merges the results automatically.",
  },
  {
    q: "What is the maximum file size?",
    a: "32MB per file. For large-format scans (A0/A1 plans), this is more than enough at 300 DPI. If your file exceeds 32MB, try reducing the scan resolution to 200 DPI — the AI can still read it accurately at that resolution.",
  },
  {
    q: "Can I scan plans on our office printer?",
    a: "Yes — this is the recommended workflow for most companies. Scan to PDF on your office multifunction printer (Ricoh, Konica Minolta, Canon, HP, Kyocera) and save at 200–300 DPI. Email or save to a shared drive, then upload directly to Kindai. The whole process takes under 2 minutes.",
  },
  {
    q: "Can I photograph plans with my phone?",
    a: "Yes. For best results: lay the plan flat on a clean surface, use good lighting (avoid shadows across the plan), hold the phone directly above the plan (not at an angle), and use the highest camera resolution. Modern smartphones produce excellent results. If the plan is large (A0/A1), photograph it in sections and upload each section as a separate page.",
  },
  {
    q: "How does Kindai handle multi-page uploads?",
    a: "Kindai processes your pages in batches of 5, then merges all results into a single combined takeoff. Duplicate items across pages are automatically summed — so if page 3 shows 12 power points and page 7 shows 8 more, the final takeoff shows 20. The confidence score reflects the overall quality across all pages.",
  },
  {
    q: "What if my plan is hand-drawn or low quality?",
    a: "Kindai can read hand-drawn plans, but accuracy improves significantly with printed or digital plans. For hand-drawn sketches, add a detailed job description in the text field to help the AI fill in any gaps. The confidence score on your results will indicate how much the AI relied on the plan vs. your description.",
  },
  {
    q: "Does Kindai work with CAD or BIM files?",
    a: "Not directly — Kindai reads images and PDFs. If you have DWG or Revit files, export them as PDF first (most CAD software has a PDF export option). PDF exports from CAD are usually the highest quality input you can give Kindai.",
  },
  {
    q: "How accurate is the AI takeoff?",
    a: "Accuracy depends on plan quality and complexity. For clear, printed plans at 200+ DPI, Kindai typically achieves 85–95% accuracy on item identification and 90%+ on quantities. The confidence score shown on every result tells you how certain the AI is. For critical quotes, always review the results and adjust any items where you have specific knowledge.",
  },
  {
    q: "Can I use Kindai for a 50-page commercial set?",
    a: "Yes — this is exactly what Kindai is built for. Upload all 50 pages at once. The AI will process them in batches and deliver a single merged takeoff. For very large commercial projects, we recommend grouping pages by trade (e.g. upload electrical drawings separately from hydraulic drawings) to get the most accurate trade-specific pricing.",
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
    badge: "Highest Accuracy",
    badgeColour: "bg-violet-100 text-violet-700",
    steps: [
      "In AutoCAD, Revit, or ArchiCAD: File → Export → PDF",
      "Select 'High Quality Print' or equivalent",
      "Include all relevant drawing sheets",
      "Upload the exported PDF directly",
    ],
    tip: "PDF exports from CAD software are the highest quality input. Kindai can read every line, symbol, and annotation with maximum accuracy.",
  },
  {
    icon: Smartphone,
    colour: "from-emerald-500 to-teal-500",
    title: "Large-Format Scanner",
    badge: "Enterprise",
    badgeColour: "bg-amber-100 text-amber-700",
    steps: [
      "Use HP DesignJet, Contex, or similar large-format scanner",
      "Set to 200 DPI minimum (300 DPI for complex drawings)",
      "Export as PDF — not TIFF",
      "Split very large files into logical sections if over 32MB",
    ],
    tip: "Large-format scanners produce the best results for A0/A1 engineering drawings. If your scan is over 32MB, reduce DPI to 200 — Kindai reads it just as accurately.",
  },
];

// ─── Enterprise Workflow ───────────────────────────────────────────────────────
const ENTERPRISE_STEPS = [
  { num: "01", title: "Gather your drawing set", desc: "Collect all relevant plan sheets: architectural, structural, electrical, hydraulic, mechanical, hardware schedules. No need to sort them — Kindai handles mixed drawing types." },
  { num: "02", title: "Scan or export to PDF", desc: "Use your office scanner or CAD export. Aim for 200–300 DPI. Save as PDF. One file per drawing sheet is fine — Kindai accepts up to 50 pages per job." },
  { num: "03", title: "Upload all pages at once", desc: "Drag and drop all your PDF/image files into the upload zone. Kindai uploads them in parallel and shows you a page list with upload status for each file." },
  { num: "04", title: "Select your trade and set pricing", desc: "Choose the relevant trade from the dropdown. Set your markup percentage and labour rate. Kindai uses your saved rates automatically if you have a trade profile set up." },
  { num: "05", title: "Generate the takeoff", desc: "Hit Generate. Kindai processes your pages in batches of 5, analyses each batch with GPT-4 Vision, then merges all results into a single combined takeoff. For 50 pages, expect 2–4 minutes." },
  { num: "06", title: "Review and export", desc: "Review the materials list, check the confidence score, and adjust any items as needed. Export to PDF or send directly to your quoting software via the export options." },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Help() {
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Help & Best Practices | Kindai Estimating Suite"
        description="Learn how to get the best results from Kindai AI estimating software. Scanning tips, multi-page upload guide, enterprise workflow, and FAQs for construction companies."
        canonical="/help"
        keywords="Kindai help, construction estimating software guide, plan scanning tips, multi-page upload, AI takeoff best practices, enterprise construction estimating"
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
              Try Free Demo
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
            Everything you need to know about uploading plans, scanning best practices, and getting accurate takeoffs — whether you're a sole trader or a 200-person construction company.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><Upload className="w-4 h-4 text-pink-400" /> Up to 50 pages per job</span>
            <span className="flex items-center gap-1.5"><FileImage className="w-4 h-4 text-blue-400" /> 32MB per file</span>
            <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-green-400" /> PDF, JPG, PNG, WebP</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-yellow-400" /> AI batching for large sets</span>
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
              { icon: Upload, title: "Upload up to 50 pages", desc: "Drag and drop all pages at once. Kindai handles the rest automatically.", colour: "text-blue-500" },
              { icon: CheckCircle2, title: "Get your combined takeoff", desc: "AI analyses every page and delivers one merged materials list with pricing.", colour: "text-green-500" },
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

        {/* ── Enterprise Workflow ── */}
        <section>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Enterprise Workflow</h2>
          </div>
          <p className="text-gray-500 mb-6 ml-11">For companies with full drawing sets (20–50 pages), here's the recommended end-to-end workflow.</p>
          <div className="space-y-3">
            {ENTERPRISE_STEPS.map((step, i) => (
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
              { icon: CheckCircle2, colour: "text-green-500", title: "Do this", items: ["Use PDF format wherever possible", "Scan at 200–300 DPI minimum", "Upload all pages for a job together", "Add a job description for extra context", "Select the correct trade before generating", "Review the confidence score on results"] },
              { icon: AlertTriangle, colour: "text-amber-500", title: "Avoid this", items: ["Blurry or out-of-focus photos", "Plans photographed at an angle", "Very dark or shadowed images", "Files over 32MB (reduce DPI instead)", "Uploading unrelated drawings in the same job", "Ignoring a low confidence score without reviewing"] },
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
            <h2 className="text-2xl sm:text-3xl font-black mb-3">Ready to try it?</h2>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">No account needed. Upload a plan and get a full AI takeoff in 60 seconds.</p>
            <button
              onClick={() => navigate("/demo")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 text-white font-black text-sm shadow-lg hover:shadow-pink-500/30 transition-all"
            >
              Try Free Demo <ArrowRight className="w-4 h-4" />
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
