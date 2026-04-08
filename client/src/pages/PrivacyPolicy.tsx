import { useEffect } from "react";

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          <span className="text-white/60 text-sm">Privacy Policy</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: 8 April 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Who We Are</h2>
            <p>
              Kindai Estimating Suite ("Kindai", "we", "us", or "our") is operated by Kindai Pty Ltd, an Australian company. Our platform provides AI-powered estimating tools for trades and construction professionals. Our website is located at{" "}
              <a href="https://kindaiestimator.com" className="text-orange-400 hover:underline">kindaiestimator.com</a>.
            </p>
            <p className="mt-3">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@kindai.com.au" className="text-orange-400 hover:underline">privacy@kindai.com.au</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="font-semibold text-white mb-1">Account Information</h3>
                <p className="text-sm text-gray-400">Name, email address, and profile information you provide when creating an account or signing up for our beta program.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="font-semibold text-white mb-1">Usage Data</h3>
                <p className="text-sm text-gray-400">Information about how you use our platform, including pages visited, features used, estimates created, and time spent on the platform.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="font-semibold text-white mb-1">Uploaded Content</h3>
                <p className="text-sm text-gray-400">Plans, documents, and images you upload to use our AI takeoff and estimating features. These are processed to generate your estimates and stored securely.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="font-semibold text-white mb-1">Payment Information</h3>
                <p className="text-sm text-gray-400">Payment details are processed by Stripe. We do not store your card number, CVV, or full payment details on our servers.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="font-semibold text-white mb-1">Device and Technical Data</h3>
                <p className="text-sm text-gray-400">IP address, browser type, device type, operating system, and cookies used to improve your experience and for security purposes.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="font-semibold text-white mb-1">Meta Pixel Data</h3>
                <p className="text-sm text-gray-400">We use the Meta Pixel to track conversions and improve our advertising. This may include information about your interactions with our website shared with Meta Platforms, Inc. You can opt out via your Facebook Ad Preferences.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
              <li>Provide, operate, and improve the Kindai platform</li>
              <li>Process your estimates and AI takeoff requests</li>
              <li>Send you account-related communications and product updates</li>
              <li>Process payments and manage your subscription</li>
              <li>Respond to your support requests</li>
              <li>Analyse usage patterns to improve our product</li>
              <li>Comply with legal obligations</li>
              <li>Detect and prevent fraud or security incidents</li>
              <li>Run targeted advertising campaigns on Meta platforms (Facebook and Instagram)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. How We Share Your Information</h2>
            <p className="mb-3">We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
              <li><strong className="text-white">Service providers</strong> — including Stripe (payments), AWS/S3 (file storage), Brevo (email), and HubSpot (CRM) who process data on our behalf under strict data processing agreements</li>
              <li><strong className="text-white">Meta Platforms, Inc.</strong> — for advertising purposes via the Meta Pixel, subject to Meta's own Privacy Policy</li>
              <li><strong className="text-white">Legal authorities</strong> — where required by law, court order, or to protect our rights</li>
              <li><strong className="text-white">Business transfers</strong> — in the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Storage and Security</h2>
            <p>
              Your data is stored on secure servers located in Australia and the United States. We use industry-standard encryption (TLS/HTTPS) for data in transit and AES-256 encryption for data at rest. Access to personal data is restricted to authorised personnel only.
            </p>
            <p className="mt-3">
              While we take reasonable steps to protect your information, no method of transmission over the internet is 100% secure. We encourage you to use a strong, unique password for your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide our services. If you delete your account, we will delete or anonymise your personal data within 30 days, except where we are required to retain it for legal or regulatory purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="mb-3">Under the Australian Privacy Act 1988 and applicable laws, you have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal data</li>
              <li>Opt out of marketing communications at any time</li>
              <li>Lodge a complaint with the Office of the Australian Information Commissioner (OAIC)</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{" "}
              <a href="mailto:privacy@kindai.com.au" className="text-orange-400 hover:underline">privacy@kindai.com.au</a>{" "}
              or use our{" "}
              <a href="/data-deletion" className="text-orange-400 hover:underline">Data Deletion Request</a> page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to improve your experience on our platform. These include essential cookies (required for the platform to function), analytics cookies (to understand how you use the platform), and advertising cookies (including the Meta Pixel).
            </p>
            <p className="mt-3">
              You can control cookies through your browser settings. Disabling certain cookies may affect the functionality of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Children's Privacy</h2>
            <p>
              Kindai is not directed at children under the age of 16. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice on our platform. Your continued use of Kindai after changes are posted constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
            <div className="bg-white/5 rounded-lg p-5 border border-white/10">
              <p className="font-semibold text-white mb-2">Kindai Pty Ltd</p>
              <p className="text-gray-400 text-sm">Email: <a href="mailto:privacy@kindai.com.au" className="text-orange-400 hover:underline">privacy@kindai.com.au</a></p>
              <p className="text-gray-400 text-sm mt-1">Website: <a href="https://kindaiestimator.com" className="text-orange-400 hover:underline">kindaiestimator.com</a></p>
              <p className="text-gray-400 text-sm mt-1">Data Deletion: <a href="/data-deletion" className="text-orange-400 hover:underline">kindaiestimator.com/data-deletion</a></p>
            </div>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm text-white/40">
          <a href="/" className="hover:text-orange-400 transition-colors">Home</a>
          <a href="/beta" className="hover:text-orange-400 transition-colors">Beta Sign-up</a>
          <a href="/data-deletion" className="hover:text-orange-400 transition-colors">Data Deletion</a>
          <a href="mailto:privacy@kindai.com.au" className="hover:text-orange-400 transition-colors">Contact</a>
        </div>
      </div>
    </div>
  );
}
