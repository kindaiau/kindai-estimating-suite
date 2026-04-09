import { useEffect, useState } from "react";

const FAQ_ITEMS = [
  {
    q: "How accurate is the AI for cabinet making and commercial joinery?",
    a: "Kindai's AI is trained on cabinet-native language: sheet goods, door profiles, hardware systems, benchtop specifications, and labour models. For commercial joinery projects — office fitouts, kitchen cabinets, custom joinery — accuracy typically ranges from 85–95% on materials quantities when clear drawings are provided. All outputs are clearly marked as drafts for review by your estimator before sending to clients. We recommend running 2–3 test jobs against your known pricing to calibrate confidence for your specific workflow."
  },
  {
    q: "How is my data and uploaded plans handled?",
    a: "Your plans and job data are encrypted in transit (TLS) and at rest (AES-256). Files are stored in secure Australian and US-based cloud infrastructure. We never use your uploaded plans or job data to train AI models — your business data is yours. Files associated with deleted accounts are purged within 30 days. Enterprise accounts can request a Data Processing Agreement (DPA) for compliance purposes."
  },
  {
    q: "Can I use my enterprise agreement rates instead of Award rates?",
    a: "Yes. Kindai's pre-loaded Fair Work Award rates are a starting point only. Enterprise accounts can upload a custom labour schedule that overrides all default rates. Your custom rates — including EA-specific classifications, allowances, and penalty rates — are applied to every estimate generated under your account. This is a core feature for larger construction businesses operating under enterprise agreements."
  },
  {
    q: "Can I import my own supplier price book?",
    a: "Yes. The Supplier Manager allows you to add custom suppliers, upload your negotiated trade pricing, and set default suppliers per material category. Your price book overrides Kindai's default pricing for all estimates. For enterprise onboarding, our team will assist you in importing your existing price book during the setup process. Bulk CSV import is supported."
  },
  {
    q: "What plan and drawing formats does Kindai accept?",
    a: "Kindai accepts PDF (recommended), JPG, PNG, and HEIC formats up to 16MB per file. For best results, use clear architectural or shop drawings at A3 or A1 scale. The AI Vision Takeoff works with both scanned physical drawings and digital PDF exports from CAD software (AutoCAD, Revit, ArchiCAD). For complex commercial projects, you can also describe the scope in text and Kindai will generate a takeoff from the description."
  }
];

export default function Support() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0f0f0f]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="#f97316" />
              <path d="M12 28L20 12L28 28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 22H25" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="font-bold text-white text-lg">Kindai</span>
          </a>
          <span className="text-white/20">/</span>
          <span className="text-white/60 text-sm">Support</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Support Centre</h1>
        <p className="text-white/40 text-sm mb-10">We're here to help you get the most out of Kindai.</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          {/* Contact Cards */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Get in Touch</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white">Email Support</h3>
                </div>
                <a href="mailto:support@kindai.com.au" className="text-orange-400 hover:underline text-sm">support@kindai.com.au</a>
                <p className="text-gray-500 text-xs mt-2">Standard response: within 24 business hours</p>
              </div>

              <div className="bg-orange-500/10 rounded-lg p-5 border border-orange-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white">Enterprise Support</h3>
                </div>
                <a href="mailto:enterprise@kindai.com.au" className="text-orange-400 hover:underline text-sm">enterprise@kindai.com.au</a>
                <p className="text-orange-300/70 text-xs mt-2">Priority response: within 4 business hours</p>
              </div>
            </div>
          </section>

          {/* Enterprise Onboarding */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Enterprise Onboarding</h2>
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <p className="text-gray-300 mb-4">
                Design Partner and enterprise accounts receive dedicated onboarding support. Before your team's first day on the platform, we will:
              </p>
              <ul className="space-y-3">
                {[
                  "Configure your trade profile and default trade settings",
                  "Import your supplier price book and set default suppliers by category",
                  "Set up your custom labour schedule (Award rates or enterprise agreement)",
                  "Configure team access and role-based permissions",
                  "Run a test job using your actual plans to validate AI accuracy",
                  "Provide a 60-minute walkthrough with your estimating team"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400">To arrange enterprise onboarding, contact us at{" "}
                  <a href="mailto:enterprise@kindai.com.au" className="text-orange-400 hover:underline">enterprise@kindai.com.au</a>
                </p>
              </div>
            </div>
          </section>

          {/* Enterprise Support Tier */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Support Tiers</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/60 font-medium">Feature</th>
                    <th className="text-left py-3 px-4 text-white/60 font-medium">Standard</th>
                    <th className="text-left py-3 px-4 text-orange-400 font-medium">Enterprise / Design Partner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ["Email support", "✓", "✓"],
                    ["Response time", "24 business hours", "4 business hours"],
                    ["Dedicated onboarding", "—", "✓ Included"],
                    ["Custom price book import", "Self-serve", "Assisted setup"],
                    ["Enterprise agreement rates", "Self-serve", "Assisted setup"],
                    ["Team training session", "—", "✓ 60-minute session"],
                    ["Data Processing Agreement", "—", "✓ On request"],
                    ["Product roadmap input", "—", "✓ Design partner access"],
                  ].map(([feature, standard, enterprise], i) => (
                    <tr key={i} className="hover:bg-white/3">
                      <td className="py-3 px-4 text-gray-300">{feature}</td>
                      <td className="py-3 px-4 text-gray-500">{standard}</td>
                      <td className="py-3 px-4 text-orange-300">{enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                  <button
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-medium text-white text-sm">{item.q}</span>
                    <svg
                      className={`w-4 h-4 text-orange-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-white/10 pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Contact block */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Contact Details</h2>
            <div className="bg-white/5 rounded-lg p-5 border border-white/10">
              <p className="font-semibold text-white mb-3">Kindai Pty Ltd</p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>General support: <a href="mailto:support@kindai.com.au" className="text-orange-400 hover:underline">support@kindai.com.au</a></p>
                <p>Enterprise enquiries: <a href="mailto:enterprise@kindai.com.au" className="text-orange-400 hover:underline">enterprise@kindai.com.au</a></p>
                <p>Privacy & data: <a href="mailto:privacy@kindai.com.au" className="text-orange-400 hover:underline">privacy@kindai.com.au</a></p>
                <p>Legal: <a href="mailto:legal@kindai.com.au" className="text-orange-400 hover:underline">legal@kindai.com.au</a></p>
                <p className="pt-2">Website: <a href="https://kindaiestimator.com" className="text-orange-400 hover:underline">kindaiestimator.com</a></p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm text-white/40">
          <a href="/" className="hover:text-orange-400 transition-colors">Home</a>
          <a href="/privacy-policy" className="hover:text-orange-400 transition-colors">Privacy Policy</a>
          <a href="/terms" className="hover:text-orange-400 transition-colors">Terms of Service</a>
          <a href="/data-deletion" className="hover:text-orange-400 transition-colors">Data Deletion</a>
        </div>
      </div>
    </div>
  );
}
