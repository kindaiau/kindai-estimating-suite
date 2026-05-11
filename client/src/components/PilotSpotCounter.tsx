/**
 * PilotSpotCounter
 *
 * Displays a live, urgency-driven pilot spot counter with a progress bar.
 * Pulls real signup counts from the backend via the beta.getStats tRPC query.
 *
 * Props:
 *   - variant: "hero" (compact, for homepage) | "banner" (full-width banner) | "form" (above signup form)
 *   - claimed/total: optional overrides (used as fallback while data loads)
 */

import { motion, AnimatePresence } from "framer-motion";
import { Flame, Users, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PilotSpotCounterProps {
  variant?: "hero" | "banner" | "form";
  fallbackClaimed?: number;
  fallbackTotal?: number;
}

export default function PilotSpotCounter({
  variant = "hero",
  fallbackClaimed = 12,
  fallbackTotal = 25,
}: PilotSpotCounterProps) {
  const { data: stats } = trpc.beta.getStats.useQuery(undefined, {
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const claimed = stats?.claimed ?? fallbackClaimed;
  const total = stats?.total ?? fallbackTotal;
  const remaining = stats?.remaining ?? Math.max(0, total - claimed);
  const pct = Math.min(100, Math.round((claimed / total) * 100));

  // Urgency thresholds
  const isCritical = remaining <= 5;
  const isUrgent = remaining <= 10 && !isCritical;

  const barColor = isCritical
    ? "from-red-500 to-red-600"
    : isUrgent
    ? "from-orange-400 to-red-500"
    : "from-amber-400 to-orange-500";

  const badgeColor = isCritical
    ? "border-red-500/50 bg-red-500/15 text-red-300"
    : isUrgent
    ? "border-orange-500/40 bg-orange-500/15 text-orange-300"
    : "border-amber-400/30 bg-amber-400/10 text-amber-300";

  const Icon = isCritical ? AlertTriangle : isUrgent ? Flame : Users;

  // ─── HERO VARIANT (compact inline, for homepage) ─────────────────────────
  if (variant === "hero") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm mx-auto lg:mx-0"
      >
        {/* Badge */}
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold mb-3 ${badgeColor}`}>
          <Icon className="w-3.5 h-3.5" />
          {isCritical
            ? `⚠️ Only ${remaining} spots left — almost gone!`
            : isUrgent
            ? `🔥 ${remaining} of ${total} spots remaining`
            : `${remaining} of ${total} pilot spots remaining`}
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="flex items-center justify-between text-xs text-white/50 mb-1.5">
            <span>{claimed}/{total} spots claimed</span>
            <span className={isCritical ? "text-red-400 font-bold" : isUrgent ? "text-orange-400 font-semibold" : ""}>{pct}% full</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── BANNER VARIANT (full-width, for top of pages) ───────────────────────
  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`w-full py-3 px-4 text-center text-sm font-semibold ${
          isCritical
            ? "bg-red-600/90 text-white"
            : isUrgent
            ? "bg-gradient-to-r from-orange-600/90 to-red-600/90 text-white"
            : "bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white"
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={remaining}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="inline-flex items-center gap-2"
          >
            <Icon className="w-4 h-4" />
            {isCritical
              ? `⚠️ ALMOST GONE — Only ${remaining} of ${total} founding spots left. Claim yours before they're gone.`
              : isUrgent
              ? `🔥 Moving fast — ${remaining} of ${total} pilot spots still available. Don't miss out.`
              : `🚀 Pilot Program Open — ${remaining} of ${total} founding spots remaining.`}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    );
  }

  // ─── FORM VARIANT (above signup form, full detail) ───────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`w-full rounded-2xl border p-5 mb-6 ${
        isCritical
          ? "border-red-500/40 bg-red-500/10"
          : isUrgent
          ? "border-orange-500/40 bg-orange-500/10"
          : "border-amber-400/30 bg-amber-400/10"
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`rounded-full p-1.5 ${isCritical ? "bg-red-500/20" : isUrgent ? "bg-orange-500/20" : "bg-amber-400/20"}`}>
            <Icon className={`w-4 h-4 ${isCritical ? "text-red-400" : isUrgent ? "text-orange-400" : "text-amber-400"}`} />
          </div>
          <span className={`text-sm font-bold ${isCritical ? "text-red-300" : isUrgent ? "text-orange-300" : "text-amber-300"}`}>
            {isCritical ? "Almost Full!" : isUrgent ? "Filling Up Fast" : "Pilot Spots Available"}
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={remaining}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`text-2xl font-black tabular-nums ${isCritical ? "text-red-400" : isUrgent ? "text-orange-400" : "text-amber-400"}`}
          >
            {remaining}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
          />
        </div>
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>{claimed} spots claimed</span>
        <span className="font-semibold text-white/80">{remaining} of {total} remaining</span>
      </div>

      {/* Urgency message */}
      <p className={`mt-3 text-xs font-medium ${isCritical ? "text-red-300" : isUrgent ? "text-orange-300" : "text-amber-300/80"}`}>
        {isCritical
          ? `⚠️ Only ${remaining} spots left — once they're gone, the pilot closes. Secure yours now.`
          : isUrgent
          ? `🔥 ${remaining} spots left at founding member pricing. These won't last.`
          : `🚀 ${remaining} founding spots available. Free access during beta, then locked-in pricing.`}
      </p>
    </motion.div>
  );
}
