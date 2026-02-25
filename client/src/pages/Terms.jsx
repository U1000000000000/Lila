import React from "react";
import { motion } from "framer-motion";
import AppShell from "../components/layout/AppShell";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut", delay },
});

export default function Terms() {
  return (
    <AppShell activeNav="" noNav>
      <div className="max-w-[680px] w-full mx-auto px-6 py-10 pb-28">
        <motion.div {...fadeUp(0)} className="mb-8">
          <h1 className="text-[28px] font-semibold text-white mb-1">
            Terms of Service
          </h1>
          <p className="text-[13px] text-white/35">
            The rules and guidelines for using Lila.
          </p>
        </motion.div>

        <motion.section {...fadeUp(0.05)} className="mb-8">
          <div className="rounded-[14px] bg-white/[0.03] border border-white/[0.07] p-6 md:p-8">
            <h3 className="text-[15px] font-semibold text-white/85 mb-3">
              1. Acceptance of Terms
            </h3>
            <p className="text-[13px] text-white/40 leading-[1.8] mb-8">
              By accessing and using Lila, you agree to be bound by these Terms
              of Service. If you disagree with any part of these terms, please
              do not use our application.
            </p>

            <h3 className="text-[15px] font-semibold text-white/85 mb-3">
              2. User Conduct
            </h3>
            <p className="text-[13px] text-white/40 leading-[1.8] mb-8">
              You agree to use Lila only for lawful purposes. You must not use
              the service to transmit any content that is abusive, harassing, or
              otherwise objectionable. We reserve the right to terminate
              accounts that violate these rules.
            </p>

            <h3 className="text-[15px] font-semibold text-white/85 mb-3">
              3. Intellectual Property
            </h3>
            <p className="text-[13px] text-white/40 leading-[1.8] mb-8">
              All content, features, and functionality of Lila—including its
              design, text, and voice synthesis technology—are owned by Lila AI
              and are protected by international copyright laws.
            </p>

            <h3 className="text-[15px] font-semibold text-white/85 mb-3">
              4. Limitation of Liability
            </h3>
            <p className="text-[13px] text-white/40 leading-[1.8]">
              Lila is provided on an "as is" and "as available" basis. We make
              no warranties regarding the accuracy or reliability of the service
              and shall not be liable for any indirect or consequential damages
              arising from its use.
            </p>
          </div>
        </motion.section>
      </div>
    </AppShell>
  );
}
