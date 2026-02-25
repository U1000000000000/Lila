import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCircle,
  Mic2,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { cn } from "../utils/cn";

const LANGUAGES = [
  "English (US)",
  "Spanish (ES)",
  "French (FR)",
  "German (DE)",
  "Hindi (IN)",
  "Japanese (JP)",
];

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0",
        checked ? "bg-[#A78BFA]" : "bg-white/[0.08]",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center",
          checked ? "left-[22px] bg-white" : "left-0.5 bg-white/40",
        )}
      >
        {checked && (
          <Check className="w-2.5 h-2.5 text-[#A78BFA]" strokeWidth={3} />
        )}
      </span>
    </button>
  );
}

function Slider({
  label,
  min,
  max,
  value,
  onChange,
  leftLabel,
  midLabel,
  rightLabel,
  valueLabel,
}) {
  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[12px] text-white/50">{label}</span>
        <span className="text-[12px] text-[#A78BFA] font-medium">
          {valueLabel}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-0.5 accent-[#A78BFA] bg-white/[0.08] rounded-full appearance-none cursor-pointer"
      />
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-white/20">{leftLabel}</span>
        {midLabel && (
          <span className="text-[10px] text-white/20">{midLabel}</span>
        )}
        <span className="text-[10px] text-white/20">{rightLabel}</span>
      </div>
    </div>
  );
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut", delay },
});

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <Icon className="w-5 h-5 text-[#A78BFA]" strokeWidth={1.8} />
    <h2 className="text-[18px] font-semibold text-white">{title}</h2>
  </div>
);

export default function Settings() {
  const DEFAULTS = {
    displayName: "Elena Richardson",
    email: "elena.r@example.com",
    language: "English (US)",
    autoDetect: false,
    correction: true,
    reminders: true,
  };
  const [saved, setSaved] = useState(DEFAULTS);

  // Live editable state
  const [displayName, setDisplayName] = useState(saved.displayName);
  const [email, setEmail] = useState(saved.email);
  const [language, setLanguage] = useState(saved.language);
  const [autoDetect, setAutoDetect] = useState(saved.autoDetect);
  const [correction, setCorrection] = useState(saved.correction);
  const [reminders, setReminders] = useState(saved.reminders);

  // Show action bar only when something changed
  const isDirty =
    displayName !== saved.displayName ||
    email !== saved.email ||
    language !== saved.language ||
    autoDetect !== saved.autoDetect ||
    correction !== saved.correction ||
    reminders !== saved.reminders;

  const handleDiscard = () => {
    setDisplayName(saved.displayName);
    setEmail(saved.email);
    setLanguage(saved.language);
    setAutoDetect(saved.autoDetect);
    setCorrection(saved.correction);
    setReminders(saved.reminders);
  };

  const handleSave = () => {
    setSaved({
      displayName,
      email,
      language,
      autoDetect,
      correction,
      reminders,
    });
  };

  return (
    <AppShell activeNav="Settings">
      <div className="max-w-[680px] w-full mx-auto px-6 py-10 pb-28">
        {/* Page title */}
        <motion.div {...fadeUp(0)} className="mb-8">
          <h1 className="text-[28px] font-semibold text-white mb-1">
            Settings
          </h1>
          <p className="text-[13px] text-white/35">
            Manage your profile, voice preferences, and application settings.
          </p>
        </motion.div>

        {/* ── Account ───────────────────────────────────── */}
        <motion.section {...fadeUp(0.05)} className="mb-8">
          <SectionHeader icon={UserCircle} title="Account" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[11px] text-white/35 mb-1.5 block">
                Display Name
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-[13px] text-white/80 focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] text-white/35 mb-1.5 block">
                Email Address
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-[13px] text-white/50 focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-white/35 mb-1.5 block">
              Native Language
            </label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-[13px] text-white/70 appearance-none focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l} className="bg-[#1a1a1a]">
                    {l}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
                strokeWidth={2}
              />
            </div>
          </div>
        </motion.section>

        {/* ── Voice & Audio ─────────────────────────────── */}
        <motion.section {...fadeUp(0.1)} className="mb-8">
          <SectionHeader icon={Mic2} title="Voice & Audio" />

          <div className="rounded-[14px] bg-white/[0.03] border border-white/[0.07] px-6 py-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center mb-1">
              <Mic2 className="w-4 h-4 text-[#A78BFA]/60" strokeWidth={1.8} />
            </div>
            <span className="text-[11px] font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full bg-[#A78BFA]/10 text-[#A78BFA]/70 border border-[#A78BFA]/20">
              Coming Soon
            </span>
            <p className="text-[13px] text-white/30 max-w-[280px] leading-relaxed mt-1">
              Voice selection and audio preferences will be available in an
              upcoming update.
            </p>
          </div>
        </motion.section>

        {/* ── Preferences ───────────────────────────────── */}
        <motion.section {...fadeUp(0.15)}>
          <SectionHeader icon={SlidersHorizontal} title="Preferences" />
          <div className="flex flex-col gap-3">
            {[
              {
                label: "Auto-detect Language",
                desc: "Switch languages automatically during conversation",
                key: "autoDetect",
                val: autoDetect,
                set: setAutoDetect,
              },
              {
                label: "Correction Feedback",
                desc: "Interrupt to correct grammar mistakes immediately",
                key: "correction",
                val: correction,
                set: setCorrection,
              },
              {
                label: "Daily Reminders",
                desc: "Receive notifications to maintain your streak",
                key: "reminders",
                val: reminders,
                set: setReminders,
              },
            ].map(({ label, desc, key, val, set }) => (
              <div
                key={key}
                className="flex items-center justify-between px-4 py-3.5 rounded-[12px] bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.05] transition-colors"
              >
                <div>
                  <p className="text-[13px] font-medium text-white/85">
                    {label}
                  </p>
                  <p className="text-[11px] text-white/35 mt-0.5">{desc}</p>
                </div>
                <Toggle checked={val} onChange={set} />
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* ── Sticky action bar — only visible when there are unsaved changes ── */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            key="action-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/[0.06] bg-black/80 backdrop-blur-xl px-8 py-4 flex justify-end gap-3"
          >
            <button
              onClick={handleDiscard}
              className="px-6 py-2.5 rounded-[10px] text-[13px] text-white/50 hover:text-white/80 transition-colors"
            >
              Discard Changes
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              className="px-6 py-2.5 rounded-[10px] bg-[#A78BFA] hover:bg-[#9b77fa] text-white text-[13px] font-semibold transition-colors shadow-[0_4px_20px_rgba(167,139,250,0.3)]"
            >
              Save Settings
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
