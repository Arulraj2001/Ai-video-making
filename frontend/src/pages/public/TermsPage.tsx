import React from "react";
import { LegalPageLayout } from "../../components/public/LegalPageLayout";
import { Link } from "../../router/Router";

export const TermsPage: React.FC = () => {
  const toc = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "software-model", title: "2. Software Platform & BYOK Model" },
    { id: "passes-billing", title: "3. Passes, Billing & No Recurring Locks" },
    { id: "user-content", title: "4. User Content & Intellectual Property" },
    { id: "local-gpu", title: "5. Local GPU Execution & Hardware" },
    { id: "acceptable-use", title: "6. Acceptable Use & Conduct" },
    { id: "disclaimers", title: "7. Disclaimers & Limitation of Liability" },
    { id: "modifications", title: "8. Modifications & Governing Law" },
  ];

  const summaryPoints = [
    "You own 100% of all scripts, characters, storyboards, audio, and videos produced on ScenoraEdits.",
    "We are a software platform, not an AI token reseller. You pay for software development and our automated pipeline.",
    "No predatory recurring subscriptions: Passes are prepaid for fixed durations (6 Months or 1 Year) with zero auto-renew traps.",
    "Bring-Your-Own-Key (BYOK): You may connect your own AI API keys (OpenAI, Gemini, Fal.ai, Replicate) without token markups.",
    "Local NVIDIA RTX GPU rendering runs directly on your machine and communicates with our local background engine.",
    "You are responsible for ensuring that your video content complies with YouTube and applicable platform guidelines.",
  ];

  return (
    <LegalPageLayout
      badge="Legal Contract"
      title="Terms of Service"
      lead="These Terms of Service govern your access to and use of ScenoraEdits, including our web applications, timeline studio, video automation pipeline, and background local worker daemon."
      lastUpdated="September 8, 2026"
      version="2.4.0"
      readTime="8 min read"
      summaryPoints={summaryPoints}
      toc={toc}
    >
      {/* 1. Acceptance */}
      <section id="acceptance" className="legal-section">
        <h2>
          <span className="section-num">01</span>
          <span>Acceptance of Terms</span>
        </h2>
        <p>
          By creating an account, accessing, or using the ScenoraEdits platform (collectively, the &ldquo;Service&rdquo; or &ldquo;Software&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you are using the Service on behalf of a YouTube channel, agency, or corporate entity, you represent and warrant that you have full legal authority to bind that entity to these Terms.
        </p>
        <p>
          If you do not agree to these Terms, you must not access or use ScenoraEdits. These Terms apply to all registered creators, visitors, and commercial teams.
        </p>
      </section>

      {/* 2. Software Platform & BYOK Model */}
      <section id="software-model" className="legal-section">
        <h2>
          <span className="section-num">02</span>
          <span>Software Platform &amp; BYOK Architecture</span>
        </h2>
        <p>
          ScenoraEdits operates fundamentally as an **engineering productivity and timeline orchestration software platform**, not as a credit-arbitrage or token-markup middleman.
        </p>
        <div className="legal-callout primary">
          <div>
            <strong>Transparent Business Model:</strong> Your pass fee pays strictly for our timeline software development, continuity algorithms, automated scene stitching, audio ducking, and local background daemon development. We do not mark up or resell AI generation tokens.
          </div>
        </div>
        <p>
          Under our Bring-Your-Own-Key (&ldquo;BYOK&rdquo;) architecture:
        </p>
        <ul>
          <li>
            You may supply your personal or enterprise API keys from third-party model providers (e.g., OpenAI, Google Gemini, Replicate, Fal.ai, ElevenLabs).
          </li>
          <li>
            Token consumption is billed directly to you by the respective third-party provider at raw provider pricing without surcharge from ScenoraEdits.
          </li>
          <li>
            You agree to comply with the terms of service and acceptable use policies of each respective API provider you integrate.
          </li>
        </ul>
      </section>

      {/* 3. Passes, Billing & No Recurring Locks */}
      <section id="passes-billing" className="legal-section">
        <h2>
          <span className="section-num">03</span>
          <span>Creator Passes, Billing &amp; Fair Renewal</span>
        </h2>
        <p>
          We reject predatory recurring subscription dark patterns. Access to ScenoraEdits Creator Pro is offered via fixed-duration passes:
        </p>
        <ul>
          <li>
            <strong>6-Month Creator Pass:</strong> Grants 180 consecutive days of full studio access, unlimited Video Bible slots, and BYOK pipeline integration.
          </li>
          <li>
            <strong>1-Year Creator Pass (Annual):</strong> Grants 365 consecutive days of full studio access with priority engineering support.
          </li>
          <li>
            <strong>Prepaid, Non-Locking:</strong> Passes are prepaid. We will notify you prior to your pass expiration; your payment method will never be charged automatically without your explicit checkout re-confirmation.
          </li>
          <li>
            <strong>Accepted Methods:</strong> We support international cards via Stripe / BuyMeACoffee and UPI / NetBanking for creators located in India.
          </li>
        </ul>
        <p>
          For questions regarding billing or custom multi-seat studio licensing, contact our billing team at <Link to="/contact" className="text-[#FF6B00] font-semibold hover:underline">Contact Support</Link>.
        </p>
      </section>

      {/* 4. User Content & Intellectual Property */}
      <section id="user-content" className="legal-section">
        <h2>
          <span className="section-num">04</span>
          <span>User Content &amp; Intellectual Property</span>
        </h2>
        <p>
          <strong>You Own What You Create:</strong> As between you and ScenoraEdits, you retain 100% of all right, title, and interest in and to any scripts, character bibles, style references, audio voiceovers, timeline sequences, and final rendered videos generated through your use of the Service.
        </p>
        <p>
          ScenoraEdits claims zero ownership, zero copyright interest, and zero future royalties over any content rendered using the platform. You have the unencumbered right to monetize, broadcast, publish, and sell your videos anywhere globally.
        </p>
        <p>
          For full details on commercial exploitation rights, please review our dedicated <Link to="/commercial-rights" className="text-[#FF6B00] font-semibold hover:underline">Commercial Rights Policy</Link>.
        </p>
      </section>

      {/* 5. Local GPU Execution */}
      <section id="local-gpu" className="legal-section">
        <h2>
          <span className="section-num">05</span>
          <span>Local GPU Execution &amp; Hardware Requirements</span>
        </h2>
        <p>
          ScenoraEdits allows creators to execute video diffusion, upscale, and synthesis locally using consumer or professional NVIDIA RTX graphics cards.
        </p>
        <ul>
          <li>
            Local rendering operates entirely on your physical hardware. We do not charge fees per local render.
          </li>
          <li>
            You are solely responsible for ensuring adequate power, cooling, and operational headroom on your local GPU equipment.
          </li>
          <li>
            ScenoraEdits is not liable for hardware faults, driver crashes, thermal throttling, or local operating system interruptions.
          </li>
        </ul>
      </section>

      {/* 6. Acceptable Use */}
      <section id="acceptable-use" className="legal-section">
        <h2>
          <span className="section-num">06</span>
          <span>Acceptable Use &amp; Community Standards</span>
        </h2>
        <p>
          You agree not to use the Service to generate, render, or distribute:
        </p>
        <ul>
          <li>Content that depicts non-consensual sexual imagery, child sexual exploitation, or non-consensual deepfakes of real individuals.</li>
          <li>Content designed to maliciously defraud, harass, or impersonate real persons or public officials with fraudulent intent.</li>
          <li>Materials that violate applicable copyright, trademark, or trade secret laws.</li>
          <li>Automated attacks, reverse-engineering of closed backend engines, or unauthorized scraping of platform infrastructure.</li>
        </ul>
      </section>

      {/* 7. Disclaimers */}
      <section id="disclaimers" className="legal-section">
        <h2>
          <span className="section-num">07</span>
          <span>Disclaimers &amp; Limitation of Liability</span>
        </h2>
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, SCENORAEDITS DISCLAIMS ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p>
          IN NO EVENT SHALL SCENORAEDITS BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF PROFITS, YOUTUBE MONETIZATION STRIKES, OR DATA LOSS ARISING OUT OF OR IN ANY WAY CONNECTED WITH THE USE OF THE PLATFORM.
        </p>
      </section>

      {/* 8. Modifications */}
      <section id="modifications" className="legal-section">
        <h2>
          <span className="section-num">08</span>
          <span>Modifications &amp; Governing Law</span>
        </h2>
        <p>
          We reserve the right to revise these Terms from time to time. When material changes are made, we will notify creators via our in-app notification banner or email at least fourteen (14) days prior to their effective date.
        </p>
        <p>
          These Terms are governed by and construed in accordance with the laws applicable to digital SaaS operations, without regard to conflict of law principles.
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default TermsPage;
