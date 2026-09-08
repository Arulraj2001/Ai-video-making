import React from "react";
import { LegalPageLayout } from "../../components/public/LegalPageLayout";
import { Link } from "../../router/Router";
import { DollarSign, Film, Sparkles } from "lucide-react";

export const CommercialRightsPage: React.FC = () => {
  const toc = [
    { id: "monetization-guarantee", title: "1. 100% Monetization Guarantee" },
    { id: "zero-watermarks", title: "2. Zero Watermarks & Zero Royalties" },
    { id: "youtube-monetization", title: "3. YouTube & Platform Compliance" },
    { id: "client-agency", title: "4. Client Deliverables & Agency Rights" },
    { id: "audio-licensing", title: "5. Built-in Audio & Safe-Harbor Ducks" },
    { id: "byok-ip", title: "6. Third-Party BYOK Model Rights" },
  ];

  const summaryPoints = [
    "You own 100% of all commercial monetization rights for every video rendered through ScenoraEdits.",
    "Zero Watermarks: Both Free Tier and Creator Pro passes export clean, unwatermarked videos.",
    "Zero Royalties: We never charge revenue cuts, royalties, or backend fees on your YouTube AdSense or sponsor earnings.",
    "Full Agency & Client Rights: You can legally sell rendered videos and storyboards directly to commercial clients.",
    "Audio Safe Harbor: Automatic speech-ducked audio tracks utilize commercial-cleared soundbeds and creator-provided files.",
  ];

  return (
    <LegalPageLayout
      badge="Commercial Exploitation Clearance"
      title="Commercial Rights & Licensing"
      lead="Full legal clarity for creators, agencies, and production studios. Everything you produce in ScenoraEdits is yours to monetize freely across YouTube, TikTok, commercial broadcasts, and client contracts."
      lastUpdated="September 8, 2026"
      version="2.4.0"
      readTime="6 min read"
      summaryPoints={summaryPoints}
      toc={toc}
    >
      {/* 1. 100% Monetization Guarantee */}
      <section id="monetization-guarantee" className="legal-section">
        <h2>
          <span className="section-num">01</span>
          <span>100% Creator Monetization Guarantee</span>
        </h2>
        <div className="legal-callout primary">
          <div>
            <strong>Universal Commercial Clearance:</strong> ScenoraEdits grants you an irrevocable, worldwide, perpetual, royalty-free commercial license to exploit, monetize, display, distribute, broadcast, and sell all media assets generated using our timeline studio.
          </div>
        </div>
        <p>
          Whether you run a high-velocity YouTube documentary channel, a faceless niche network, or a client video production agency, you maintain unrestricted freedom to generate revenue from your content through:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex flex-col gap-2">
            <DollarSign className="text-emerald-500" size={20} />
            <h4 className="text-sm font-bold text-[var(--color-text)]">AdSense &amp; RPM</h4>
            <p className="text-xs text-[var(--color-text-secondary)]">Full monetization eligibility under YouTube Partner Program (YPP) guidelines.</p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex flex-col gap-2">
            <Film className="text-blue-500" size={20} />
            <h4 className="text-sm font-bold text-[var(--color-text)]">Brand Sponsorships</h4>
            <p className="text-xs text-[var(--color-text-secondary)]">Integrate sponsor reads, brand deliverables, and commercial endorsements.</p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex flex-col gap-2">
            <Sparkles className="text-[#FF6B00]" size={20} />
            <h4 className="text-sm font-bold text-[var(--color-text)]">Client Commercials</h4>
            <p className="text-xs text-[var(--color-text-secondary)]">Deliver completed 4K edits and storyboards to third-party corporate clients.</p>
          </div>
        </div>
      </section>

      {/* 2. Zero Watermarks & Zero Royalties */}
      <section id="zero-watermarks" className="legal-section">
        <h2>
          <span className="section-num">02</span>
          <span>Zero Watermarks &amp; Zero Royalties</span>
        </h2>
        <p>
          We do not believe in defacing creator work.
        </p>
        <ul>
          <li>
            <strong>Zero Watermarks:</strong> We never inject logos, watermarks, intro bumpers, or platform bugs onto your exported videos.
          </li>
          <li>
            <strong>Zero Revenue Share:</strong> Your earnings are 100% your own. ScenoraEdits takes 0% cut of your YouTube channel revenue, Patreon subscriptions, or client contract invoices.
          </li>
          <li>
            <strong>No Credit-Burn Penalties:</strong> Once a project is exported, you owe zero residual accounting or reporting obligations to ScenoraEdits.
          </li>
        </ul>
      </section>

      {/* 3. YouTube & Platform Compliance */}
      <section id="youtube-monetization" className="legal-section">
        <h2>
          <span className="section-num">03</span>
          <span>YouTube &amp; Platform Guidelines Compliance</span>
        </h2>
        <p>
          YouTube&rsquo;s Monetization Guidelines specifically state that AI-assisted content is fully eligible for monetization provided it delivers transformative value, substantive commentary, storytelling narrative, or educational quality.
        </p>
        <p>
          ScenoraEdits is engineered specifically to help you build **transformative, high-production storytelling**:
        </p>
        <ul>
          <li>
            <strong>Video Bible™ Continuity:</strong> Prevents low-quality random hallucinations by enforcing consistent character identity, environment lighting, and cinematic lenses.
          </li>
          <li>
            <strong>Audio Auto-Ducking:</strong> Blends human voiceovers or synthesized narration with background musical tracks, passing automated platform broadcast standards.
          </li>
          <li>
            <strong>Editorial Pacing:</strong> Multi-scene storyboarding ensures your video follows an authentic narrative arc that viewer retention algorithms reward.
          </li>
        </ul>
      </section>

      {/* 4. Client Deliverables & Agency Rights */}
      <section id="client-agency" className="legal-section">
        <h2>
          <span className="section-num">04</span>
          <span>Client Deliverables &amp; Agency Rights</span>
        </h2>
        <p>
          Video production agencies and freelance editors frequently ask: <em>&ldquo;Can I use ScenoraEdits to build videos for paying clients?&rdquo;</em>
        </p>
        <div className="legal-callout success">
          <div>
            <strong>Yes, with zero restrictions:</strong> You are fully authorized to sell, transfer, license, and deliver videos, scene cards, and audio compositions produced on ScenoraEdits to paying corporate or private clients. You do not need a separate enterprise resale waiver.
          </div>
        </div>
      </section>

      {/* 5. Built-in Audio & Safe-Harbor Ducks */}
      <section id="audio-licensing" className="legal-section">
        <h2>
          <span className="section-num">05</span>
          <span>Built-in Audio &amp; Safe-Harbor Ducking</span>
        </h2>
        <p>
          When you utilize our timeline&rsquo;s built-in sound effect libraries and automated ducking tracks:
        </p>
        <ul>
          <li>
            All bundled stock audio assets and ambient noise beds are cleared for commercial broadcast across all major social networks.
          </li>
          <li>
            When you import custom audio files (e.g., your own licensed Epidemic Sound or Artlist tracks), our audio auto-ducker operates strictly on local volume envelopes without altering your original audio licenses.
          </li>
        </ul>
      </section>

      {/* 6. Third-Party BYOK Model Rights */}
      <section id="byok-ip" className="legal-section">
        <h2>
          <span className="section-num">06</span>
          <span>Third-Party BYOK Commercial Terms</span>
        </h2>
        <p>
          When connecting your own API keys (BYOK):
        </p>
        <ul>
          <li>
            <strong>OpenAI / DALL-E:</strong> OpenAI grants users commercial ownership of images generated via its API.
          </li>
          <li>
            <strong>Google Gemini / Imagen:</strong> Subject to Google Cloud generative AI commercial exploitation terms.
          </li>
          <li>
            <strong>Local RTX Diffusers (SDXL / Flux):</strong> Open weights models (e.g., Stable Diffusion XL, Flux.1 Schnell) are governed by their respective permissive creator licenses.
          </li>
        </ul>
        <p>
          Need custom licensing documentation for enterprise procurement? Contact our legal team at <Link to="/contact" className="text-[#FF6B00] font-semibold hover:underline">Support &amp; Contact Desk</Link>.
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default CommercialRightsPage;
