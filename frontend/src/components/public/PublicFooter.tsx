import React, { useState } from "react";
import { Link } from "../../router/Router";
import { ScenoraLogo } from "../brand/ScenoraLogo";
import { BRAND } from "../../config/brand";
import "./PublicFooter.css";
import {
  ArrowUp,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export const PublicFooter: React.FC = () => {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail("");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="saas-footer" aria-label="Site Footer">
      <div className="saas-footer-container">
        {/* 1. TOP TIER: CREATOR UPDATES & PLATFORM STATUS */}
        <div className="saas-footer-top">
          <div className="saas-footer-nl-content">
            <h4>Get Weekly AI Prompt Blueprints</h4>
            <p>
              Join 15,000+ creators receiving weekly Video Bible prompts, storytelling recipes, and YouTube retention tactics.
            </p>
          </div>

          <div>
            {subscribed ? (
              <div className="flex items-center gap-2 text-sm text-emerald-500 font-semibold">
                <CheckCircle2 size={18} />
                <span>You're subscribed! Check your inbox for the prompt pack.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="saas-footer-nl-form">
                <input
                  type="email"
                  placeholder="Enter your creator email..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="saas-footer-nl-input"
                  required
                />
                <button type="submit" className="saas-footer-nl-btn">
                  <span>Get Prompt Pack</span>
                </button>
              </form>
            )}
          </div>

          <Link to="/status" className="saas-footer-status-pill" title="View Real-Time System Status">
            <span className="saas-status-dot" />
            <span>All Systems Operational • Cloud GPUs Active</span>
          </Link>
        </div>

        {/* 2. MAIN 5-COLUMN DIRECTORY */}
        <div className="saas-footer-main">
          {/* Column 1: Brand & Community */}
          <div className="saas-footer-brand-col">
            <Link to="/" className="inline-flex items-center">
              <ScenoraLogo size="md" />
            </Link>
            <p className="saas-footer-desc">
              Next-generation AI video creation platform for high-velocity YouTube creators. Turn scripts and voiceovers into cinematic storyboards with guaranteed character continuity.
            </p>

            <div className="saas-footer-socials">
              <a
                href="https://www.youtube.com/@deepgradient-tamil"
                target="_blank"
                rel="noreferrer"
                className="saas-social-link"
                title="YouTube Channel (@deepgradient-tamil)"
                aria-label="YouTube Channel"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>

            {/* Product Hunt Featured Badge */}
            <div className="saas-footer-ph-badge" style={{ marginTop: "6px" }}>
              <a
                href="https://www.producthunt.com/products/scenoraedits?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-scenoraedits"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  alt="ScenoraEdits - Turn scripts into consistent AI videos in 5 stages | Product Hunt"
                  width="250"
                  height="54"
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1253778&theme=light&t=1789670814783"
                  style={{ width: "250px", height: "54px", display: "block" }}
                />
              </a>
            </div>
          </div>

          {/* Column 2: Product & Engine */}
          <div className="saas-footer-col">
            <h5>Product</h5>
            <ul className="saas-footer-links">
              <li>
                <Link to="/features#storyboard">
                  <span>AI Storyboarder</span>
                  <span className="saas-badge-new">v2.4</span>
                </Link>
              </li>
              <li>
                <Link to="/features#videobible">
                  <span>Video Bible™ Engine</span>
                </Link>
              </li>
              <li>
                <Link to="/how-it-works#stage-4">
                  <span>Speech Auto-Ducking</span>
                </Link>
              </li>
              <li>
                <Link to="/features#timeline">
                  <span>Timeline Editor</span>
                </Link>
              </li>
              <li>
                <Link to="/pricing">
                  <span>Pricing &amp; Plans</span>
                </Link>
              </li>
              <li>
                <Link to="/app" className="text-[#FF6B00] font-semibold">
                  <span>Open Studio</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Creator Niches & Use Cases */}
          <div className="saas-footer-col">
            <h5>Use Cases</h5>
            <ul className="saas-footer-links">
              <li>
                <Link to="/use-cases">Faceless YouTube</Link>
              </li>
              <li>
                <Link to="/use-cases">Podcast to Video</Link>
              </li>
              <li>
                <Link to="/use-cases">AI Image Artists</Link>
              </li>
              <li>
                <Link to="/use-cases">Explainers &amp; Courses</Link>
              </li>
              <li>
                <Link to="/use-cases">View All Use Cases →</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Resources & Learning */}
          <div className="saas-footer-col">
            <h5>Resources</h5>
            <ul className="saas-footer-links">
              <li>
                <Link to="/blog">Creator Playbook &amp; Blog</Link>
              </li>
              <li>
                <Link to="/how-it-works">5-Stage Production Guide</Link>
              </li>
              <li>
                <Link to="/contact">Support &amp; FAQ Center</Link>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@deepgradient-tamil"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  <span>YouTube Channel</span>
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <Link to="/status">System Status</Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Trust & Legal */}
          <div className="saas-footer-col">
            <h5>Trust &amp; Legal</h5>
            <ul className="saas-footer-links">
              <li>
                <Link to="/commercial-rights" className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>Commercial Rights</span>
                </Link>
              </li>
              <li>
                <Link to="/terms">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/security">Security Standards</Link>
              </li>
              <li>
                <Link to="/contact">Contact Support</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. BOTTOM STRIP */}
        <div className="saas-footer-bottom">
          <div className="flex items-center gap-2">
            <span>{BRAND.copyright}</span>
            <span>•</span>
            <span>Engineered for high-velocity video creators</span>
          </div>

          <div className="saas-footer-legal-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/cookies">Cookies</Link>
            <button onClick={scrollToTop} className="saas-back-to-top">
              <span>Back to top</span>
              <ArrowUp size={13} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
