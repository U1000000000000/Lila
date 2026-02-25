import React from "react";
import { motion } from "framer-motion";
import AppShell from "../components/layout/AppShell";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut", delay },
});

export default function Privacy() {
  return (
    <AppShell activeNav="" noNav>
      <div className="max-w-[680px] w-full mx-auto px-6 py-10 pb-28">
        {/* Page title */}
        <motion.div {...fadeUp(0)} className="mb-8">
          <h1 className="text-[28px] font-semibold text-white mb-1">
            Privacy Policy
          </h1>
          <p className="text-[13px] text-white/35">
            How we collect, use, and protect your data.
          </p>
        </motion.div>

        <motion.section {...fadeUp(0.05)} className="mb-8">
          <div className="rounded-[14px] bg-white/[0.03] border border-white/[0.07] p-6 md:p-8">
            <h3 className="text-[15px] font-semibold text-white/85 mb-3">
              1. Information Collection
            </h3>
            <p className="text-[13px] text-white/40 leading-[1.8] mb-8">
              When you use Lila, we collect audio recordings of your sessions to
              provide real-time feedback and improve our speech recognition
              models. We also collect basic account information necessary for
              the service.
            </p>

            <h3 className="text-[15px] font-semibold text-white/85 mb-3">
              2. How We Use Your Data
            </h3>
            <p className="text-[13px] text-white/40 leading-[1.8] mb-8">
              Your audio data is processed securely and is strictly used to
              evaluate your language proficiency, provide corrections, and
              personalize your curriculum. We do not sell your personal data to
              third parties.
            </p>

            <h3 className="text-[15px] font-semibold text-white/85 mb-3">
              3. Data Security
            </h3>
            <p className="text-[13px] text-white/40 leading-[1.8] mb-8">
              We implement robust security measures to protect your information.
              All data transmitted between your device and our servers is
              encrypted using industry-standard protocols.
            </p>

            <h3 className="text-[15px] font-semibold text-white/85 mb-3">
              4. Your Rights
            </h3>
            <p className="text-[13px] text-white/40 leading-[1.8]">
              You have the right to access, modify, or delete your personal
              information at any time. You can manage your data preferences
              directly from your account settings or by contacting our support
              team.
            </p>
          </div>
        </motion.section>
      </div>
    </AppShell>
  );
}
