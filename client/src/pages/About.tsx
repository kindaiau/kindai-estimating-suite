import { useEffect } from "react";
import { Link } from "wouter";
import { pixelViewContent } from "@/lib/metaPixel";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

export default function About() {
  useEffect(() => {
    pixelViewContent({ content_name: "About" });
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <img src={LOGO_URL} alt="Kindai Estimating Suite" className="h-8 w-auto cursor-pointer" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:inline">Pricing</Link>
            <Link href="/pricing" className="bg-[#ff6b35] hover:bg-[#ff8c42] text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-full transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block bg-[#ff6b35]/10 border border-[#ff6b35]/20 rounded-full px-4 py-1.5 mb-8">
            <span className="text-[#ff6b35] text-sm font-semibold tracking-wide uppercase">About Kindai</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            We built Kindai because tradies deserve{" "}
            <span className="text-[#ff6b35]">better tools.</span>
          </h1>
        </div>
      </section>

      {/* Story */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <p className="text-base sm:text-xl text-white/70 leading-relaxed">
            Every day, skilled tradespeople across Australia spend hours doing work that has nothing to do with their trade — writing up quotes, calculating materials, chasing numbers, second-guessing their margins. A full-time estimator costs $130,000 a year. Most small builders and sole traders can't afford that. So they guess. And guessing costs them jobs, money, and sleep.
          </p>

          <div className="border-l-4 border-[#ff6b35] pl-6">
            <p className="text-2xl font-bold text-white">Kindai changes that.</p>
          </div>

          <p className="text-base sm:text-xl text-white/70 leading-relaxed">
            We're an Australian AI startup built around one idea: the best tradies shouldn't lose work because they're slow at paperwork. Our estimating suite uses AI to read your plans, understand your trade, calculate your materials and labour, and deliver a GST-compliant quote in under 60 seconds — whether you're a cabinet maker in Brisbane, an electrician in Melbourne, or a concreter in Perth.
          </p>

          <p className="text-base sm:text-xl text-white/70 leading-relaxed">
            We cover all 10 major trades. We know Australian pricing, Australian compliance, and Australian conditions. We're not a US product bolted onto the local market — we were built here, for here.
          </p>
        </div>
      </section>

      {/* Underdog section */}
      <section className="py-20 px-6 bg-[#111111]">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-[#ff6b35]/10 to-[#ff8c42]/5 border border-[#ff6b35]/20 rounded-2xl p-6 sm:p-10">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
              Kindai is for the underdog.
            </h2>
            <div className="space-y-4 text-lg text-white/70 leading-relaxed">
              <p>The sole trader quoting on a Saturday night.</p>
              <p>The small builder competing against companies three times their size.</p>
              <p>The tradie who's brilliant at their craft but never had the tools to match.</p>
            </div>
            <p className="mt-8 text-2xl font-bold text-[#ff6b35]">That changes now.</p>
          </div>
        </div>
      </section>

      {/* Founder note */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff8c42] flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                M
              </div>
              <div>
                <p className="text-white/70 text-lg leading-relaxed mb-6">
                  "I built this because I've seen too many good tradies lose work not because they weren't good enough — but because they couldn't get a quote out fast enough. That's not a skills problem. That's a tools problem. Kindai is the fix."
                </p>
                <div>
                  <p className="font-bold text-white">Matt Symons</p>
                  <p className="text-white/50 text-sm">Co-founder, Kindai</p>
                  <a
                    href="mailto:matt@kindaiestimator.com"
                    className="text-[#ff6b35] text-sm hover:underline mt-1 inline-block"
                  >
                    matt@kindaiestimator.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-[#111111]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">Ready to stop guessing?</h2>
          <p className="text-white/60 text-lg mb-8">AI estimating that learns your rates, your rules, your business.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <button className="bg-[#ff6b35] hover:bg-[#ff8c42] text-white font-bold px-8 py-4 rounded-full text-lg transition-colors">
                See Pricing
              </button>
            </Link>
            <Link href="/pricing">
              <button className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-full text-lg transition-colors">
                See Pricing
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={LOGO_URL} alt="Kindai" className="h-7 w-auto" />
          <p className="text-white/30 text-sm">
            &copy; {new Date().getFullYear()} Kindai Pty Ltd · Australia
          </p>
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/privacy-policy" className="hover:text-white/70 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white/70 transition-colors">Terms</Link>
            <a href="mailto:hello@kindaiestimator.com" className="hover:text-white/70 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
