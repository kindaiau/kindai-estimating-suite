import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function DataDeletion() {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const notifyOwner = trpc.system.notifyOwner.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    try {
      await notifyOwner.mutateAsync({
        title: "Data Deletion Request",
        content: `A data deletion request was submitted.\n\nEmail: ${email}\nReason: ${reason || "Not provided"}\nSubmitted: ${new Date().toISOString()}`,
      });
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please email us directly at matt@kindaiestimator.com");
    }
  };

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
          <span className="text-white/60 text-sm">Data Deletion</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Data Deletion Request</h1>
        <p className="text-white/50 text-sm mb-8">
          You have the right to request deletion of your personal data held by Kindai. We will process your request within 30 days.
        </p>

        {!submitted ? (
          <>
            {/* What gets deleted */}
            <div className="bg-white/5 rounded-xl p-5 border border-white/10 mb-8">
              <h2 className="font-semibold text-white mb-3">What will be deleted</h2>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">✓</span>
                  Your account and profile information
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">✓</span>
                  All estimates, projects, and uploaded plans
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">✓</span>
                  Your email address and contact details
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">✓</span>
                  Usage history and activity logs
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/30 mt-0.5">✗</span>
                  <span className="text-white/40">Payment records (retained for 7 years as required by Australian tax law)</span>
                </li>
              </ul>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Email address <span className="text-orange-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-400/60 focus:ring-1 focus:ring-orange-400/30 transition-colors"
                />
                <p className="text-xs text-white/30 mt-1">This must match the email address on your Kindai account.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Reason for deletion <span className="text-white/30">(optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Let us know why you're leaving (optional — helps us improve)"
                  rows={3}
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-400/60 focus:ring-1 focus:ring-orange-400/30 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={notifyOwner.isPending}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {notifyOwner.isPending ? "Submitting..." : "Submit Deletion Request"}
              </button>
            </form>

            <p className="text-xs text-white/30 mt-6 text-center">
              Alternatively, email us directly at{" "}
              <a href="mailto:matt@kindaiestimator.com?subject=Privacy%20%26%20Data" className="text-orange-400 hover:underline">
                matt@kindaiestimator.com
              </a>
            </p>
          </>
        ) : (
          /* Success state */
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8 text-center">
            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Request Received</h2>
            <p className="text-gray-400 text-sm mb-1">
              We've received your data deletion request for <strong className="text-white">{email}</strong>.
            </p>
            <p className="text-gray-400 text-sm">
              Your data will be permanently deleted within <strong className="text-white">30 days</strong>. You'll receive a confirmation email when it's done.
            </p>
            <a
              href="/"
              className="inline-block mt-6 text-orange-400 hover:text-orange-300 text-sm transition-colors"
            >
              ← Back to Kindai
            </a>
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm text-white/40">
          <a href="/" className="hover:text-orange-400 transition-colors">Home</a>
          <a href="/privacy-policy" className="hover:text-orange-400 transition-colors">Privacy Policy</a>
          <a href="mailto:matt@kindaiestimator.com?subject=Privacy%20%26%20Data" className="hover:text-orange-400 transition-colors">Contact</a>
        </div>
      </div>
    </div>
  );
}
