import React from "react";
import { LegalPageLayout } from "../../components/public/LegalPageLayout";
import { Link } from "../../router/Router";

export const PrivacyPage: React.FC = () => {
  const toc = [
    { id: "pledge", title: "1. Zero-AI-Training Pledge" },
    { id: "data-collected", title: "2. Information We Collect" },
    { id: "byok-security", title: "3. BYOK API Key Encryption" },
    { id: "local-privacy", title: "4. Local GPU & Desktop Privacy" },
    { id: "sharing", title: "5. Third-Party Sharing & Processors" },
    { id: "rights", title: "6. Creator Rights (GDPR & CCPA)" },
    { id: "retention", title: "7. Data Retention & Deletion" },
    { id: "contact", title: "8. Data Protection Officer" },
  ];

  const summaryPoints = [
    "Strict Zero-Training Pledge: We DO NOT train, fine-tune, or feed public or proprietary AI models with your scripts, character bibles, or videos.",
    "Your BYOK keys (OpenAI, Gemini, Replicate, Fal.ai) are encrypted at rest using AES-256 and never logged or exposed in client bundles.",
    "Local NVIDIA RTX GPU rendering keeps video frames and intermediate diffusion weights entirely on your local machine.",
    "We collect minimal operational data necessary for authentication, entitlement verification, and error diagnostics.",
    "Full creator sovereignty: You can export your Video Bibles and delete your account and projects at any time with zero retention residual.",
  ];

  return (
    <LegalPageLayout
      badge="Privacy & Security Pledge"
      title="Privacy Policy"
      lead="At ScenoraEdits, creator privacy is a fundamental architectural requirement. We believe your creative ideas, scripts, and production assets belong to you alone."
      lastUpdated="September 8, 2026"
      version="2.4.0"
      readTime="7 min read"
      summaryPoints={summaryPoints}
      toc={toc}
    >
      {/* 1. Zero-AI-Training Pledge */}
      <section id="pledge" className="legal-section">
        <h2>
          <span className="section-num">01</span>
          <span>Our Zero-AI-Training Pledge</span>
        </h2>
        <div className="legal-callout success">
          <div>
            <strong>The ScenoraEdits Privacy Commitment:</strong> We never use your scripts, prompt engineering recipes, character bibles, voiceover audio, or rendered video output to train, train-align, or fine-tune artificial intelligence models. Your proprietary intellectual property remains strictly confidential.
          </div>
        </div>
        <p>
          Unlike legacy platforms that quietly harvest user creations to train internal diffusion or generative foundation models, ScenoraEdits is engineered strictly as an orchestration client. When you type a script or create a recurring character in the Video Bible™, that data belongs solely to your project database.
        </p>
      </section>

      {/* 2. Information We Collect */}
      <section id="data-collected" className="legal-section">
        <h2>
          <span className="section-num">02</span>
          <span>Information We Collect</span>
        </h2>
        <p>
          We deliberately minimize the personal information collected from creators:
        </p>
        <ul>
          <li>
            <strong>Account Information:</strong> Your email address, display name, and authentication identifiers provided through Firebase Authentication (or Google Sign-In).
          </li>
          <li>
            <strong>Project Metadata:</strong> Project titles, scene prompt timelines, character visual references, and timeline tracks necessary to persist your work across sessions.
          </li>
          <li>
            <strong>Payment Reference Records:</strong> For pass activations, we store transaction identifiers (UPI reference numbers, BuyMeACoffee verification codes, or Stripe checkout session IDs). We do not store credit card numbers directly.
          </li>
          <li>
            <strong>Operational Telemetry:</strong> Error logs, latency metrics, and crash dumps to maintain platform reliability and monitor system health.
          </li>
        </ul>
      </section>

      {/* 3. BYOK API Key Encryption */}
      <section id="byok-security" className="legal-section">
        <h2>
          <span className="section-num">03</span>
          <span>Bring-Your-Own-Key (BYOK) Encryption</span>
        </h2>
        <p>
          When you enter your third-party API keys (e.g., OpenAI, Google Gemini, Replicate, Fal.ai, ElevenLabs, Cloudflare Workers AI) into ScenoraEdits:
        </p>
        <ul>
          <li>
            Keys are encrypted using <strong>AES-256-GCM encryption</strong> before being written to persistent storage.
          </li>
          <li>
            Decryption keys are isolated in restricted server-side environments and never transmitted back to browser runtime scripts.
          </li>
          <li>
            Requests to third-party model endpoints are executed over encrypted TLS 1.3 tunnels directly from the backend dispatch worker or client proxy.
          </li>
        </ul>
      </section>

      {/* 4. Local GPU & Desktop Privacy */}
      <section id="local-privacy" className="legal-section">
        <h2>
          <span className="section-num">04</span>
          <span>Local GPU &amp; Desktop Privacy</span>
        </h2>
        <p>
          When utilizing our local NVIDIA RTX GPU background engine:
        </p>
        <ul>
          <li>
            Video frame buffers, ComfyUI workflows, and local diffusion weights remain strictly on your local physical drive.
          </li>
          <li>
            The local worker daemon communicates with your browser timeline via a local WebSocket or loopback interface (`localhost`), preventing intermediate video frames from ever uploading to external servers.
          </li>
        </ul>
      </section>

      {/* 5. Third-Party Sharing */}
      <section id="sharing" className="legal-section">
        <h2>
          <span className="section-num">05</span>
          <span>Third-Party Processors &amp; Infrastructure</span>
        </h2>
        <p>
          We partner only with vetted infrastructure providers adhering to enterprise security standards:
        </p>
        <ul>
          <li>
            <strong>Google Cloud / Firebase:</strong> Secure user authentication, database persistence, and CDN file delivery.
          </li>
          <li>
            <strong>Payment Processors:</strong> Stripe, Razorpay/UPI gateway, and BuyMeACoffee for checkout handling.
          </li>
          <li>
            <strong>Third-Party Model APIs:</strong> Only contacted when you explicitly instruct the studio to synthesize prompts using connected BYOK providers.
          </li>
        </ul>
      </section>

      {/* 6. Creator Rights */}
      <section id="rights" className="legal-section">
        <h2>
          <span className="section-num">06</span>
          <span>Creator Rights (GDPR, CCPA &amp; Global)</span>
        </h2>
        <p>
          Regardless of your physical location, ScenoraEdits grants all creators universal privacy rights:
        </p>
        <ul>
          <li><strong>Right of Access:</strong> You can view all project data, account logs, and metadata in your dashboard.</li>
          <li><strong>Right to Portability:</strong> Export your complete Video Bible, timeline sequences, and project manifests as portable JSON packages.</li>
          <li><strong>Right to Erasure:</strong> Delete any project, timeline, or your entire account with immediate cascade deletion across databases.</li>
        </ul>
      </section>

      {/* 7. Retention */}
      <section id="retention" className="legal-section">
        <h2>
          <span className="section-num">07</span>
          <span>Data Retention &amp; Permanent Deletion</span>
        </h2>
        <p>
          When you click &ldquo;Delete Project&rdquo; or delete your account in <Link to="/app/account" className="text-[#FF6B00] font-semibold hover:underline">Account Settings</Link>, our systems execute a permanent purge within seventy-two (72) hours from active production databases and thirty (30) days from cold encrypted disaster backups.
        </p>
      </section>

      {/* 8. Contact */}
      <section id="contact" className="legal-section">
        <h2>
          <span className="section-num">08</span>
          <span>Contact our Privacy Engineering Team</span>
        </h2>
        <p>
          For questions, data export requests, or privacy inquiries, reach our dedicated Data Protection Officer through our <Link to="/contact" className="text-[#FF6B00] font-semibold hover:underline">Support &amp; Contact Desk</Link>.
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default PrivacyPage;
