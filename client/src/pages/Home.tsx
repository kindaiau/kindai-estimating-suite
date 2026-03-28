import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  HardHat,
  Shield,
  Sparkles,
  Zap,
  Building2,
  Droplets,
  Hammer,
  Wind,
  Grid3X3,
  Leaf,
  Package,
  Layers,
  Boxes,
} from "lucide-react";
import { useLocation } from "wouter";

const TRADES = [
  { id: "electrical", name: "Electrical", icon: Zap, color: "bg-amber-500", desc: "Points, circuits, switchboards" },
  { id: "plumbing", name: "Plumbing", icon: Droplets, color: "bg-blue-500", desc: "Fixtures, pipes, drainage" },
  { id: "carpentry", name: "Carpentry", icon: Hammer, color: "bg-amber-800", desc: "Framing, fit-out, timber" },
  { id: "concreting", name: "Concreting", icon: Building2, color: "bg-slate-500", desc: "Slabs, footings, driveways" },
  { id: "hvac", name: "HVAC", icon: Wind, color: "bg-cyan-500", desc: "Heating, cooling, ventilation" },
  { id: "flooring", name: "Flooring", icon: Grid3X3, color: "bg-violet-500", desc: "Tiles, timber, carpet, vinyl" },
  { id: "landscaping", name: "Landscaping", icon: Leaf, color: "bg-emerald-500", desc: "Gardens, paving, retaining" },
  { id: "cabinetry", name: "Cabinetry", icon: Package, color: "bg-orange-500", desc: "Kitchens, bathrooms, custom" },
  { id: "rendering", name: "Rendering", icon: Layers, color: "bg-pink-500", desc: "Render, plaster, set" },
  { id: "cabinet-making", name: "Cabinet Making", icon: Boxes, color: "bg-orange-600", desc: "Joinery, wardrobes, built-ins" },
];

const FEATURES = [
  { icon: Sparkles, title: "AI-Powered Takeoff", desc: "Describe your project and our AI extracts quantities, materials, and labour automatically." },
  { icon: Shield, title: "Australian Compliance", desc: "Built-in GST, state licensing prompts, WHS notices, and AS/NZS standards for every trade." },
  { icon: FileText, title: "Professional Quotes", desc: "Generate branded PDF quotes with digital signatures and client acceptance links." },
  { icon: BarChart3, title: "Real-Time Pricing", desc: "Current Australian market rates for materials and Fair Work Act-compliant labour rates." },
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  if (!loading && isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl kindai-gradient flex items-center justify-center shadow-sm">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Kindai
              </span>
              <span className="text-base font-normal text-muted-foreground ml-1.5">Estimating Suite</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="hidden sm:flex text-xs">
              🇦🇺 Built for Australia
            </Badge>
            <Button
              className="kindai-gradient text-white border-0 shadow-sm"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="container relative py-20 lg:py-28">
          <div className="max-w-3xl">
            <Badge className="mb-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
              <Sparkles className="w-3 h-3 mr-1.5" />
              AI-Powered Estimating for Australian Tradies
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Quote faster.
              <br />
              <span className="kindai-gradient-text">Win more jobs.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              The only estimating platform built specifically for Australian trades. AI takeoff, 
              GST-compliant quotes, Fair Work labour rates, and state licensing compliance — 
              all in one place. For 10 trades.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="kindai-gradient text-white border-0 shadow-md text-base px-6"
                onClick={() => window.location.href = getLoginUrl()}
              >
                Start Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-base px-6">
                View Demo
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-muted-foreground">
              {["No credit card required", "10 trades supported", "GST compliant"].map(item => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trade Selector */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
              10 Trade-Specific Estimators
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Each module is purpose-built for its trade — the right materials, the right units, 
              the right compliance requirements.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {TRADES.map(({ id, name, icon: Icon, color, desc }) => (
              <div
                key={id}
                className="bg-card rounded-xl border border-border p-4 hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => window.location.href = getLoginUrl()}
              >
                <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm font-semibold text-foreground mb-1">{name}</div>
                <div className="text-xs text-muted-foreground leading-snug">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
              Everything a tradie needs
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Stop losing jobs to slow quoting. Kindai gets you from plan to quote in minutes.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-sidebar">
        <div className="container text-center">
          <div className="w-14 h-14 rounded-2xl kindai-gradient flex items-center justify-center mx-auto mb-5 shadow-lg">
            <HardHat className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-sidebar-foreground mb-3">
            Ready to quote smarter?
          </h2>
          <p className="text-sidebar-foreground/60 mb-6 max-w-md mx-auto">
            Join Australian tradies already using Kindai to win more work with less effort.
          </p>
          <Button
            size="lg"
            className="kindai-gradient text-white border-0 shadow-md"
            onClick={() => window.location.href = getLoginUrl()}
          >
            Start Estimating Free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md kindai-gradient flex items-center justify-center">
              <HardHat className="w-3 h-3 text-white" />
            </div>
            <span>© 2025 Kindai. Built for Australian trades.</span>
          </div>
          <div className="flex gap-4">
            <span>GST compliant</span>
            <span>•</span>
            <span>Fair Work rates</span>
            <span>•</span>
            <span>AS/NZS standards</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
