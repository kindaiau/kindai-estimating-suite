import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import SEO from "@/components/SEO";

const TRADES = [
  "Electrician",
  "Plumber",
  "Builder / Carpenter",
  "Cabinet Maker / Joiner",
  "Painter",
  "Tiler",
  "HVAC / Air Conditioning",
  "Concreter",
  "Roofer",
  "Landscaper",
  "Other",
];

export default function EbookGuide() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [trade, setTrade] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const capture = trpc.ebook.capture.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      if (data.alreadyRegistered) {
        toast.success("You're already on the list — check your inbox!");
      } else {
        toast.success("Guide sent! Check your inbox.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Try again.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    capture.mutate({ name: name.trim(), email: email.trim(), trade: trade || undefined });
  }

  return (
    <>
      <SEO
        title="Free Guide: From Plans to Quote in Minutes | Kindai"
        description="Download the free 12-page guide for Australian tradies. Learn how to quote faster, protect your margins, and win more work using AI estimating."
        canonical="https://kindaiestimator.com/guide"
        keywords="tradie quoting guide, AI estimating, fast quotes, Australian tradies, construction estimating"
      />

      <div className="min-h-screen" style={{ background: "#0d1117", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

        {/* Nav */}
        <nav style={{ borderBottom: "1px solid #21262d", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png"
              alt="Kindai"
              style={{ height: 32 }}
            />
          </a>
          <a
            href="/beta"
            style={{
              background: "linear-gradient(135deg, #FF2D78, #FF6B35)",
              color: "#fff",
              padding: "8px 20px",
              borderRadius: 50,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Claim Pilot Spot
          </a>
        </nav>

        {/* Hero */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 60px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>

          {/* Left: Copy */}
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255, 107, 53, 0.12)", border: "1px solid rgba(255, 107, 53, 0.3)",
              borderRadius: 50, padding: "6px 16px", marginBottom: 28,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF6B35", display: "inline-block" }} />
              <span style={{ color: "#FF6B35", fontSize: 13, fontWeight: 600, letterSpacing: "0.5px" }}>FREE GUIDE FOR AUSTRALIAN TRADIES</span>
            </div>

            <h1 style={{ margin: "0 0 24px", color: "#fff", fontSize: 52, fontWeight: 800, lineHeight: 1.1 }}>
              Stop Losing Jobs<br />
              <span style={{ background: "linear-gradient(135deg, #FF2D78, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                to Slow Quotes
              </span>
            </h1>

            <p style={{ margin: "0 0 32px", color: "#c9d1d9", fontSize: 19, lineHeight: 1.7 }}>
              Download the free 12-page guide that shows Australian tradies how to quote faster, protect their margins, and win more work — without spending 3 hours on every job.
            </p>

            {/* What's inside */}
            <div style={{ marginBottom: 40 }}>
              {[
                "Why slow quotes are costing you jobs (and how to fix it)",
                "How AI reads your plans and builds a GST-ready quote in 60 seconds",
                "The 80% time saving that changes how you run your business",
                "Real numbers: what quoting is actually costing you per year",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "linear-gradient(135deg, #FF2D78, #FF6B35)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 2,
                  }}>
                    <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                      <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={{ color: "#c9d1d9", fontSize: 16, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex" }}>
                {["E", "P", "B", "C"].map((l, i) => (
                  <div key={i} style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: `hsl(${i * 60 + 20}, 70%, 50%)`,
                    border: "2px solid #0d1117",
                    marginLeft: i > 0 ? -10 : 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 13, fontWeight: 700,
                  }}>{l}</div>
                ))}
              </div>
              <p style={{ margin: 0, color: "#8b949e", fontSize: 14 }}>
                <strong style={{ color: "#c9d1d9" }}>340+ tradies</strong> have already downloaded this guide
              </p>
            </div>
          </div>

          {/* Right: Form or Success */}
          <div>
            {submitted ? (
              <div style={{
                background: "#161b22", border: "1px solid #30363d",
                borderRadius: 20, padding: "48px 40px", textAlign: "center",
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "linear-gradient(135deg, #FF2D78, #FF6B35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 24px",
                }}>
                  <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                    <path d="M2 12L12 22L30 2" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 style={{ margin: "0 0 16px", color: "#fff", fontSize: 28, fontWeight: 700 }}>
                  Check your inbox!
                </h2>
                <p style={{ margin: "0 0 32px", color: "#c9d1d9", fontSize: 16, lineHeight: 1.7 }}>
                  Your guide is on its way from <strong style={{ color: "#FF6B35" }}>matt@kindai.com.au</strong>. Check your spam folder if you don't see it in a few minutes.
                </p>
                <a
                  href="/demo"
                  style={{
                    display: "inline-block",
                    background: "linear-gradient(135deg, #FF2D78, #FF6B35)",
                    color: "#fff", padding: "14px 36px", borderRadius: 50,
                    textDecoration: "none", fontSize: 16, fontWeight: 700,
                  }}
                >
                  Try the Live Demo →
                </a>
              </div>
            ) : (
              <div style={{
                background: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 20,
                padding: "40px",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Gradient top bar */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 4,
                  background: "linear-gradient(135deg, #FF2D78, #FF6B35)",
                }} />

                {/* Ebook cover preview */}
                <div style={{
                  background: "linear-gradient(135deg, #1a1f2e, #0d1117)",
                  border: "1px solid #30363d",
                  borderRadius: 12,
                  padding: "24px 20px",
                  marginBottom: 32,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}>
                  <div style={{
                    width: 56, height: 72,
                    background: "linear-gradient(135deg, #FF2D78, #FF6B35)",
                    borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
                      <rect x="2" y="2" width="20" height="24" rx="2" fill="rgba(255,255,255,0.2)" />
                      <path d="M6 8h12M6 12h12M6 16h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 4px", color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>
                      From Plans to Quote in Minutes
                    </p>
                    <p style={{ margin: 0, color: "#8b949e", fontSize: 13 }}>
                      12-page guide · Free download
                    </p>
                  </div>
                </div>

                <h2 style={{ margin: "0 0 8px", color: "#fff", fontSize: 24, fontWeight: 700 }}>
                  Get your free copy
                </h2>
                <p style={{ margin: "0 0 28px", color: "#8b949e", fontSize: 15 }}>
                  Delivered instantly to your inbox. No spam, ever.
                </p>

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", color: "#c9d1d9", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Your name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dave Smith"
                      required
                      style={{
                        width: "100%", padding: "12px 16px",
                        background: "#0d1117", border: "1px solid #30363d",
                        borderRadius: 10, color: "#fff", fontSize: 15,
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", color: "#c9d1d9", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="dave@yourbusiness.com.au"
                      required
                      style={{
                        width: "100%", padding: "12px 16px",
                        background: "#0d1117", border: "1px solid #30363d",
                        borderRadius: 10, color: "#fff", fontSize: 15,
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 28 }}>
                    <label style={{ display: "block", color: "#c9d1d9", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Your trade <span style={{ color: "#8b949e", fontWeight: 400 }}>(optional)</span>
                    </label>
                    <select
                      value={trade}
                      onChange={(e) => setTrade(e.target.value)}
                      style={{
                        width: "100%", padding: "12px 16px",
                        background: "#0d1117", border: "1px solid #30363d",
                        borderRadius: 10, color: trade ? "#fff" : "#8b949e", fontSize: 15,
                        outline: "none", boxSizing: "border-box",
                      }}
                    >
                      <option value="">Select your trade...</option>
                      {TRADES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={capture.isPending || !name.trim() || !email.trim()}
                    style={{
                      width: "100%", padding: "16px",
                      background: capture.isPending ? "#333" : "linear-gradient(135deg, #FF2D78, #FF6B35)",
                      color: "#fff", border: "none", borderRadius: 50,
                      fontSize: 17, fontWeight: 700, cursor: capture.isPending ? "not-allowed" : "pointer",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {capture.isPending ? "Sending your guide..." : "Send Me the Free Guide →"}
                  </button>

                  <p style={{ margin: "16px 0 0", color: "#484f58", fontSize: 12, textAlign: "center" }}>
                    No spam. Unsubscribe anytime. Your info stays private.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Social proof strip */}
        <div style={{ borderTop: "1px solid #21262d", borderBottom: "1px solid #21262d", padding: "32px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {[
              { stat: "3 hrs → 40 min", label: "Average time saved per quote" },
              { stat: "80%", label: "Reduction in quoting time" },
              { stat: "$41K+", label: "Estimated annual time savings" },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 6px", fontSize: 32, fontWeight: 800, background: "linear-gradient(135deg, #FF2D78, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {item.stat}
                </p>
                <p style={{ margin: 0, color: "#8b949e", fontSize: 14 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div style={{ maxWidth: 700, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{
            background: "#161b22", border: "1px solid #30363d",
            borderRadius: 16, padding: "40px",
          }}>
            <p style={{ margin: "0 0 24px", color: "#c9d1d9", fontSize: 18, lineHeight: 1.7, fontStyle: "italic" }}>
              "I uploaded the plans and had a first-pass quote in about 40 minutes instead of half a day. The AI got most of it right — I just adjusted a couple of line items. Sent it that afternoon."
            </p>
            <p style={{ margin: 0, color: "#8b949e", fontSize: 14 }}>
              — Cabinet maker, Adelaide SA · Kindai Beta User
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid #21262d", padding: "32px 24px", textAlign: "center" }}>
          <p style={{ margin: "0 0 8px", color: "#484f58", fontSize: 13 }}>
            <a href="/" style={{ color: "#FF6B35", textDecoration: "none", fontWeight: 600 }}>kindaiestimator.com</a>
            {" · "}
            <a href="/privacy-policy" style={{ color: "#484f58", textDecoration: "none" }}>Privacy</a>
            {" · "}
            <a href="/terms" style={{ color: "#484f58", textDecoration: "none" }}>Terms</a>
          </p>
          <p style={{ margin: 0, color: "#30363d", fontSize: 12 }}>
            Kindai Pty Ltd · Australia · AI Estimating for Australian Tradies
          </p>
        </footer>
      </div>
    </>
  );
}
