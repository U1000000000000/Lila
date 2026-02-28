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
const EMAIL = "privacy@lilakreis.com";

const sections = [
  {
    title: "1. Introduction and Scope",
    content: `LilaKreis ("we," "our," or "us") operates the LilaKreis platform and the "Lila" AI voice assistant (collectively, the "Service"). This Privacy Policy describes how we collect, use, process, store, share, and protect information about you when you use our Service. It applies to all users worldwide, including residents of the European Economic Area (EEA), the United Kingdom, California, and other jurisdictions with data protection laws. By using the Service, you acknowledge and agree to the practices described in this Privacy Policy. If you disagree, please do not use the Service.`,
  },
  {
    title: "2. Information We Collect",
    content: `We collect the following categories of information:\n\n(a) Account Information: When you authenticate via Google OAuth, we receive your Google account profile including your name, email address, and profile picture URL. We store these in our databases to create and maintain your account.\n\n(b) Voice and Audio Data: When you engage in voice sessions, your microphone audio is streamed in real time to our servers and third-party speech recognition providers (including Deepgram). Audio data is processed to generate text transcripts. Transcripts, not raw audio files, are stored persistently in our databases.\n\n(c) Conversation Transcripts: Full text transcripts of your conversations with the Lila AI assistant are stored in our databases and linked to your account. These are used for session history, fluency analysis, personalization, and AI model improvement.\n\n(d) Session Analytics and Metadata: We collect session-level data including session duration, start and end timestamps, number of messages exchanged, and technical quality indicators.\n\n(e) AI-Generated Assessments: Fluency scores, CEFR level estimates, grammar error analysis, vocabulary assessments, and AI-generated session feedback are stored and associated with your account.\n\n(f) Usage Data and Logs: We automatically collect usage information including browser type, operating system, IP address, device information, pages visited, features used, clickstream data, and crash reports.\n\n(g) Cookies and Local Storage: We use session storage, local storage, and similar technologies to maintain authentication state and user preferences. We do not use third-party advertising cookies.`,
  },
  {
    title: "3. Legal Basis for Processing (GDPR / UK GDPR)",
    content: `If you are located in the EEA or United Kingdom, we process your personal data on the following legal bases:\n\n(a) Contractual Necessity (Art. 6(1)(b) GDPR): Processing necessary to perform the Service you have requested, including account management, session delivery, and analytics.\n\n(b) Legitimate Interests (Art. 6(1)(f) GDPR): Processing for fraud prevention, security, service improvement, and aggregate research, where our interests are not overridden by your rights.\n\n(c) Consent (Art. 6(1)(a) GDPR): Where required, we obtain your explicit consent before processing sensitive data, such as for AI model training using identified data.\n\n(d) Legal Obligation (Art. 6(1)(c) GDPR): Processing necessary to comply with applicable laws, regulations, or lawful government requests.\n\nFor special categories of data (e.g., if voice data reveals health conditions), processing is solely for the purpose of providing our educational Service, with your explicit consent under Art. 9(2)(a) GDPR.`,
  },
  {
    title: "4. How We Use Your Data",
    content: `We use your information for the following purposes:\n\n(a) Service Delivery: To provide, operate, maintain, and improve the conversational AI and language learning experience.\n\n(b) Session Analysis: To generate fluency scores, CEFR assessments, grammar corrections, vocabulary highlights, and progress reports available to you in your History and Dashboard.\n\n(c) Personalization: To adapt the AI's conversation style, vocabulary, and topics to your proficiency level, interests, and past sessions.\n\n(d) AI and Model Training: Anonymized and/or pseudonymized transcripts, assessment data, and behavioral patterns derived from your usage may be used to train, fine-tune, and evaluate LilaKreis's own AI models. Where required by law, we will seek your consent.\n\n(e) Security and Fraud Prevention: To detect, investigate, and prevent fraudulent transactions, abuse, violations of our Terms, and other harmful or illegal activity.\n\n(f) Communications: To send you service-related notices, updates, and technical alerts. We do not send marketing emails without your explicit consent.\n\n(g) Legal Compliance: To comply with applicable laws, respond to legal process, and enforce our agreements.\n\n(h) Research and Analytics: Aggregate, non-identifiable data may be used for internal research, academic collaboration, and to publish anonymized insights about language learning trends.`,
  },
  {
    title: "5. Data Sharing and Disclosure",
    content: `We do not sell your personal data. We may share your information in the following limited circumstances:\n\n(a) AI and Infrastructure Providers: We share audio streams and text with Deepgram (speech recognition), Google (LLM and language models), and MongoDB Atlas (database storage). These providers process data on our behalf under strict data processing agreements.\n\n(b) Authentication: Google receives information necessary to facilitate OAuth 2.0 login. We do not share your conversation data with Google for advertising purposes.\n\n(c) Legal Requirements: We may disclose your information if required by law, regulation, legal process, or governmental request, or if we reasonably believe disclosure is necessary to protect rights, property, or safety.\n\n(d) Business Transfers: In the event of a merger, acquisition, asset sale, or bankruptcy, your information may be transferred to the successor entity, subject to the same or equivalent privacy protections.\n\n(e) Aggregated or Anonymized Data: We may share de-identified, aggregated data that cannot reasonably be used to identify you with partners, researchers, or in public reports.\n\n(f) With Your Consent: We may share your information for any other purpose with your explicit prior consent.`,
  },
  {
    title: "6. Data Retention",
    content: `We retain your personal data for as long as your account is active or as needed to provide the Service. Specifically:\n\n(a) Account data (name, email, profile picture) is retained for the lifetime of your account plus 90 days following deletion.\n\n(b) Conversation transcripts and session analytics are retained for up to 24 months from the date of the session, after which they are automatically deleted or permanently anonymized.\n\n(c) AI-generated assessment data is retained for the lifetime of your account to support longitudinal progress tracking.\n\n(d) Usage logs and technical data are retained for up to 12 months for security and debugging purposes.\n\n(e) Anonymized and aggregated data derived from your sessions may be retained indefinitely for research and model improvement purposes.\n\n(f) Data subject to a legal hold, government inquiry, or ongoing dispute may be retained beyond the above periods until resolution. You may request earlier deletion subject to legal and contractual obligations.`,
  },
  {
    title: "7. Data Security",
    content: `We implement and maintain commercially reasonable administrative, physical, and technical security measures designed to protect your data against unauthorized access, disclosure, alteration, and destruction. These include:\n\n— Encryption of data in transit using TLS 1.2 or higher.\n— Encryption of sensitive data at rest within our database infrastructure.\n— JWT-based authentication with short expiration windows.\n— HTTPOnly cookies and CSRF protections where applicable.\n— Access controls limiting employee access to personal data on a need-to-know basis.\n— Regular security reviews and vulnerability assessments.\n\nHowever, no method of electronic storage or internet transmission is 100% secure. We cannot guarantee absolute security and are not responsible for circumvention of privacy settings or security measures by third parties. In the event of a data breach that is likely to result in high risk to your rights, we will notify you and relevant authorities as required by applicable law within 72 hours of becoming aware.`,
  },
  {
    title: "8. Cookies and Tracking Technologies",
    content: `We use the following tracking technologies:\n\n(a) Session Storage: Used to store your JWT authentication token for the duration of your browser session. Cleared automatically when you close the browser tab.\n\n(b) Local Storage (Zustand Persist): Used to cache your authenticated user profile to reduce redundant API calls. This contains your name, email, and profile picture reference.\n\n(c) Essential Cookies: We may set HttpOnly session cookies required for OAuth state validation and CSRF protection during login flows.\n\nWe do not use advertising cookies, third-party tracking pixels, or behavioral advertising technologies. You may control storage through your browser settings, but disabling session storage will prevent you from logging in.`,
  },
  {
    title: "9. Your Rights and Choices",
    content: `Depending on your jurisdiction, you may have the following rights regarding your personal data:\n\n(a) Access: The right to request a copy of the personal data we hold about you.\n\n(b) Correction: The right to request correction of inaccurate or incomplete data.\n\n(c) Erasure ("Right to be Forgotten"): The right to request deletion of your personal data, subject to legal retention obligations.\n\n(d) Restriction: The right to request that we restrict processing of your data in certain circumstances.\n\n(e) Portability: The right to receive your data in a structured, machine-readable format.\n\n(f) Objection: The right to object to processing based on legitimate interests or for direct marketing.\n\n(g) Withdraw Consent: Where processing is based on consent, the right to withdraw that consent at any time without affecting prior lawful processing.\n\n(h) California Residents (CCPA/CPRA): You have the right to know what personal information is collected, to opt out of "sale" or "sharing" (we do not sell or share data for cross-context behavioral advertising), and to non-discrimination for exercising your rights.\n\nTo exercise any of these rights, contact us at ${EMAIL}. We will respond within 30 days (or as required by applicable law). We may require identity verification before fulfilling requests.`,
  },
  {
    title: "10. Children's Privacy",
    content: `The Service is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information without your consent, please contact us at ${EMAIL} and we will promptly delete such information. Users aged 13–17 may use the Service only with verified parental or guardian consent. We take additional safeguards to protect the privacy of minor users and do not use data from minor users for commercial AI training purposes without explicit parental consent.`,
  },
  {
    title: "11. International Data Transfers",
    content: `LilaKreis operates globally and your data may be transferred to and processed in countries outside your country of residence, including India, the United States, and other countries where our service providers maintain infrastructure. These countries may have data protection laws that differ from those in your country. For transfers from the EEA or UK, we rely on appropriate transfer mechanisms including Standard Contractual Clauses (SCCs) approved by the European Commission, or other lawful transfer mechanisms. By using the Service, you consent to the transfer of your information to these countries in accordance with this Privacy Policy.`,
  },
  {
    title: "12. Third-Party Links",
    content: `The Service may contain links to external websites or services not operated by LilaKreis, such as our GitHub repository. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any external sites you visit. The inclusion of a link does not imply our endorsement of the external site.`,
  },
  {
    title: "13. AI Model Training Opt-Out",
    content: `We offer users the ability to opt out of having their conversation transcripts used for AI model training. To exercise this opt-out, contact us at ${EMAIL} with the subject line "AI Training Opt-Out." We will exclude your account's data from future training datasets within 30 days of your request. Historical data already incorporated into trained models cannot be retroactively removed due to the technical nature of machine learning, but your data will not be used in future training runs. This opt-out does not affect our ability to use your data for service delivery, analytics, or other purposes described in this Policy.`,
  },
  {
    title: "14. Automated Decision-Making",
    content: `The Service uses automated processing, including AI and machine learning algorithms, to generate CEFR level assessments, fluency scores, grammar feedback, and personalized recommendations. These assessments are educational in nature and are not used to make legally significant or similarly consequential decisions about you. If you are subject to GDPR, you have the right not to be subject to solely automated decisions that produce significant legal effects, and you may contact us to request human review of any AI assessment that significantly affects you.`,
  },
  {
    title: "15. Changes to this Privacy Policy",
    content: `We may update this Privacy Policy periodically to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by posting the revised Policy on our website and updating the "Effective Date." Where required by law, we will provide additional notice (e.g., by email). Your continued use of the Service after any update constitutes your acceptance of the revised Policy. We encourage you to review this Policy regularly.`,
  },
  {
    title: "16. Contact and Data Controller Information",
    content: `LilaKreis is the data controller for personal data collected through the Service.\n\nFor privacy-related inquiries, data subject rights requests, or complaints:\n\nLilaKreis Privacy Team\nEmail: ${EMAIL}\n\nIf you are located in the EEA or UK and believe we have not adequately addressed your concerns, you have the right to lodge a complaint with your local data protection supervisory authority.`,
  },
];

export default function Privacy() {
  return (
    <AppShell activeNav="" noNav>
      <div className="max-w-[740px] w-full mx-auto px-5 py-10 pb-28">
        <motion.div {...fadeUp(0)} className="mb-8">
          <h1 className="text-[24px] font-semibold text-white mb-1">
            Privacy Policy
          </h1>
          <p className="text-[11px] text-white/30">
            Effective Date: {EFFECTIVE_DATE} &nbsp;·&nbsp; {COMPANY}
          </p>
          <p className="text-[11px] text-white/25 mt-2 leading-relaxed max-w-[600px]">
            This Privacy Policy explains how LilaKreis collects, stores, uses,
            and shares your personal information. Please read it carefully.
            Capitalized terms not defined here have the meanings given in our
            Terms of Service.
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
          This Privacy Policy was last updated on {EFFECTIVE_DATE}. Continued
          use of LilaKreis constitutes your acceptance of this Policy.
        </motion.p>
      </div>
    </AppShell>
  );
}
