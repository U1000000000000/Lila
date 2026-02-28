import React from "react";
import { motion } from "framer-motion";
import AppShell from "../components/layout/AppShell";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut", delay },
});

const EFFECTIVE_DATE = "March 1, 2026";
const COMPANY = "LilaKreis";
const EMAIL = "legal@lilakreis.com";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing, downloading, installing, or using the LilaKreis platform and services (collectively, the "Service"), you acknowledge that you have read, understood, and agree to be legally bound by these Terms of Service ("Terms") and our Privacy Policy, which is incorporated herein by reference. If you do not agree to these Terms in their entirety, you must immediately cease all use of the Service. Your continued use of the Service following any modification to these Terms constitutes your acceptance of the revised Terms. These Terms apply to all visitors, users, and others who access or use the Service.`,
  },
  {
    title: "2. Eligibility",
    content: `You must be at least 13 years of age to use the Service. If you are under 18 years of age, you represent that your parent or legal guardian has reviewed and agreed to these Terms on your behalf. By using the Service, you represent and warrant that: (a) you have the legal capacity to enter into a binding contract; (b) you are not prohibited from receiving the Service under applicable law; (c) you will comply with these Terms and all applicable local, state, national, and international laws, rules, and regulations.`,
  },
  {
    title: "3. Account Registration and Security",
    content: `To access certain features of the Service, you must register for an account using Google OAuth 2.0. You agree to: (a) provide accurate, current, and complete information; (b) maintain and promptly update your account information; (c) maintain the security and confidentiality of your authentication credentials; (d) accept all risks of unauthorized access to your account; (e) immediately notify LilaKreis of any unauthorized use of your account or any other security breach. LilaKreis is not liable for any loss or damage arising from your failure to comply with these obligations. We reserve the right to disable any account at any time, at our sole discretion, for any reason, including if we believe that you have violated these Terms.`,
  },
  {
    title: "4. License Grant and Restrictions",
    content: `Subject to your compliance with these Terms, LilaKreis grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Service solely for your personal, non-commercial language learning purposes. You must not: (a) copy, modify, distribute, sell, or lease any part of the Service; (b) reverse engineer, decompile, or attempt to extract source code; (c) use the Service to develop competing products; (d) remove any proprietary notices or labels; (e) use automated scripts to collect data from the Service; (f) impersonate any other user or person; (g) use the Service in any manner that could disable, overburden, or impair any LilaKreis infrastructure; (h) attempt to gain unauthorized access to any systems or networks connected to the Service.`,
  },
  {
    title: "5. AI-Generated Content and Limitations",
    content: `The Service uses artificial intelligence, machine learning, large language models, and voice synthesis technology. You acknowledge and agree that: (a) AI-generated responses, feedback, translations, and assessments are provided for educational purposes only and may contain errors, inaccuracies, or omissions; (b) LilaKreis does not guarantee the accuracy, completeness, or appropriateness of any AI-generated output; (c) you will exercise independent judgment in relying on AI-generated content; (d) the AI assistant named "Lila" is not a licensed language teacher, therapist, or professional advisor; (e) LilaKreis shall not be liable for decisions made based on AI-generated feedback. The Service is designed to supplement, not replace, professional language instruction.`,
  },
  {
    title: "6. Voice and Audio Sessions",
    content: `When you use the voice conversation features of the Service, you expressly consent to the recording, processing, and storage of your audio input. You acknowledge that: (a) voice sessions are transmitted to third-party speech recognition and language model providers, including but not limited to Deepgram and Google; (b) audio data may be retained for service improvement, quality assurance, and AI model training purposes as described in our Privacy Policy; (c) you will not use the voice features to record or transmit any third party's voice without their explicit consent; (d) you will not use voice features to input content that is illegal, harmful, abusive, threatening, defamatory, obscene, or otherwise objectionable. LilaKreis reserves the right to review flagged sessions for safety and policy compliance.`,
  },
  {
    title: "7. Data, AI Training, and Model Improvement",
    content: `By using the Service, you grant LilaKreis a perpetual, worldwide, royalty-free, irrevocable, sublicensable license to use, reproduce, process, adapt, modify, create derivative works from, and incorporate into AI and machine learning systems the anonymized or pseudonymized data derived from your usage, including but not limited to: transcribed conversation text, fluency scores, grammar error patterns, vocabulary usage, session metadata, interaction patterns, and aggregate behavioral analytics. This license is granted for the purposes of improving, training, and developing LilaKreis products and services, including AI models. LilaKreis will apply reasonable anonymization techniques before using individual session data for model training. You retain ownership of your personal data and any original content you provide, subject to the license rights granted above.`,
  },
  {
    title: "8. Third-Party Services and Integrations",
    content: `The Service integrates and relies upon third-party services, including but not limited to: Google OAuth for authentication; Deepgram for real-time speech recognition; Google Gemini or other large language model providers for conversational AI; MongoDB Atlas for data storage; and cloud infrastructure providers. Your use of these third-party services is governed by their respective terms of service and privacy policies. LilaKreis is not responsible for the practices or content of third-party services. We may change, suspend, or discontinue third-party integrations at any time.`,
  },
  {
    title: "9. Prohibited Content and Conduct",
    content: `You agree not to use the Service to: (a) transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy; (b) impersonate any person or entity or misrepresent your affiliation; (c) upload or transmit viruses, malware, or any disruptive code; (d) interfere with or disrupt the integrity or performance of the Service; (e) attempt to probe, scan, or test the vulnerability of any LilaKreis system; (f) circumvent, disable, or interfere with security-related features; (g) engage in any form of automated data collection, scraping, or crawling without written permission; (h) use the Service for any commercial solicitation or advertising without our prior written consent. Violation of these prohibitions may result in immediate account termination and reporting to relevant authorities.`,
  },
  {
    title: "10. Intellectual Property Rights",
    content: `The Service, including all software, algorithms, interfaces, content, trade names, trademarks, service marks, logos, and the "LilaKreis" and "Lila" brands, are and shall remain the exclusive intellectual property of LilaKreis and its licensors. Nothing in these Terms grants you any right, title, or interest in the Service or LilaKreis intellectual property other than the limited license expressly stated herein. Any feedback, suggestions, or ideas you provide to LilaKreis regarding the Service may be used by LilaKreis without any obligation to compensate you, and you hereby assign all rights in such feedback to LilaKreis.`,
  },
  {
    title: "11. Disclaimers and Warranties",
    content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LILAKREIS EXPRESSLY DISCLAIMS ALL WARRANTIES, EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, QUIET ENJOYMENT, ACCURACY, AND NON-INFRINGEMENT. LILAKREIS DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE FROM VIRUSES. NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED FROM LILAKREIS SHALL CREATE ANY WARRANTY. SOME JURISDICTIONS DO NOT ALLOW DISCLAIMER OF CERTAIN WARRANTIES; IN SUCH CASES THE DISCLAIMERS APPLY TO THE MAXIMUM EXTENT PERMITTED.`,
  },
  {
    title: "12. Limitation of Liability",
    content: `TO THE FULLEST EXTENT PERMITTED BY LAW, LILAKREIS, ITS AFFILIATES, OFFICERS, EMPLOYEES, AGENTS, PARTNERS, AND LICENSORS SHALL NOT BE LIABLE FOR: (A) ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES; (B) LOSS OF PROFITS, REVENUE, DATA, BUSINESS, GOODWILL, OR ANY INTANGIBLE LOSSES; (C) DAMAGES ARISING FROM UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR TRANSMISSIONS OR DATA; (D) ERRORS, INACCURACIES, OR OMISSIONS IN AI-GENERATED CONTENT; (E) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE. IN NO EVENT SHALL LILAKREIS'S TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE GREATER OF (i) USD $100 OR (ii) THE AMOUNTS PAID BY YOU TO LILAKREIS IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.`,
  },
  {
    title: "13. Indemnification",
    content: `You agree to indemnify, defend, and hold harmless LilaKreis, its affiliates, officers, directors, employees, agents, licensors, and service providers from and against any and all claims, liabilities, damages, judgments, awards, losses, costs, expenses, and fees (including reasonable attorneys' fees) arising out of or relating to: (a) your violation of these Terms; (b) your use of the Service; (c) your User Content; (d) your violation of any third-party rights, including intellectual property or privacy rights; (e) your violation of any applicable law or regulation. LilaKreis reserves the right to assume exclusive defense and control of any matter subject to indemnification, at your expense.`,
  },
  {
    title: "14. Governing Law and Dispute Resolution",
    content: `These Terms shall be governed by and construed in accordance with the laws of the Republic of India, without regard to its conflict of law provisions. Any dispute, claim, or controversy arising out of or relating to these Terms or the Service shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration under the Arbitration and Conciliation Act, 1996 (India), conducted in English. The seat of arbitration shall be New Delhi, India. Notwithstanding the foregoing, either party may seek injunctive or other equitable relief in a court of competent jurisdiction to prevent irreparable harm. You waive any right to a jury trial and agree to bring claims only in your individual capacity, not as a plaintiff in any class action.`,
  },
  {
    title: "15. Termination",
    content: `LilaKreis may, at its sole discretion, terminate or suspend your access to the Service at any time, with or without notice, for any reason, including for violation of these Terms. Upon termination: (a) all licenses granted to you will immediately cease; (b) you must stop all use of the Service; (c) LilaKreis may delete your account data subject to our data retention policies and applicable law; (d) provisions that by their nature should survive termination shall survive, including Sections 7, 10, 11, 12, 13, 14, and this Section 15. You may terminate your account at any time by contacting us. Termination does not entitle you to any refund.`,
  },
  {
    title: "16. Changes to Terms",
    content: `LilaKreis reserves the right to modify these Terms at any time. We will provide notice of material changes by updating the "Last Updated" date, posting in-app notifications, or by email. Your continued use of the Service after any modification constitutes acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using the Service. We encourage you to review these Terms periodically.`,
  },
  {
    title: "17. Miscellaneous",
    content: `These Terms, together with the Privacy Policy and any other legal notices published by LilaKreis, constitute the entire agreement between you and LilaKreis with respect to the Service and supersede all prior agreements. If any provision of these Terms is deemed invalid, the remaining provisions continue in full force and effect. LilaKreis's failure to enforce any right or provision shall not constitute a waiver. You may not assign or transfer any rights or obligations under these Terms without our prior written consent. LilaKreis may assign these Terms freely. The section headings are for convenience only and have no legal effect.`,
  },
  {
    title: "18. Contact",
    content: `For legal inquiries regarding these Terms of Service, please contact us at:\n\nLilaKreis Legal\nEmail: ${EMAIL}\n\nWe will make reasonable efforts to respond to all legitimate inquiries within 30 business days.`,
  },
];

export default function Terms() {
  return (
    <AppShell activeNav="" noNav>
      <div className="max-w-[740px] w-full mx-auto px-5 py-10 pb-28">
        <motion.div {...fadeUp(0)} className="mb-8">
          <h1 className="text-[24px] font-semibold text-white mb-1">
            Terms of Service
          </h1>
          <p className="text-[11px] text-white/30">
            Effective Date: {EFFECTIVE_DATE} &nbsp;·&nbsp; {COMPANY}
          </p>
          <p className="text-[11px] text-white/25 mt-2 leading-relaxed max-w-[600px]">
            Please read these Terms of Service carefully before using LilaKreis.
            By accessing or using the Service you agree to be bound by these
            Terms. If you do not agree, do not use the Service.
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.05)}>
          <div className="rounded-[14px] bg-white/[0.03] border border-white/[0.07] divide-y divide-white/[0.05] overflow-hidden">
            {sections.map(({ title, content }, i) => (
              <div key={i} className="px-5 py-5">
                <h2 className="text-[12px] font-semibold text-white/80 mb-2 uppercase tracking-wide">
                  {title}
                </h2>
                <p className="text-[11.5px] text-white/38 leading-[1.85] whitespace-pre-line">
                  {content}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.p
          {...fadeUp(0.1)}
          className="text-[10px] text-white/20 mt-8 text-center leading-relaxed"
        >
          These Terms of Service were last updated on {EFFECTIVE_DATE}. Your
          continued use of LilaKreis constitutes your acceptance of any updates.
        </motion.p>
      </div>
    </AppShell>
  );
}
