import React, { useState } from "react";
import { Link, useRouter } from "../router/Router";
import { ScenoraLogo } from "../components/brand/ScenoraLogo";
import { BRAND } from "../config/brand";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { SiteContainer } from "../components/public/SiteContainer";
import {
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  ArrowRight,
  User,
  ShieldCheck,
  LogOut,
  ExternalLink,
} from "lucide-react";

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { path, navigate } = useRouter();
  const { preference, setPreference } = useTheme();
  const { user, isAuthenticated, isAdmin, signOutUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Features", to: "/features" },
    { label: "How It Works", to: "/how-it-works" },
    { label: "Pricing", to: "/pricing" },
    { label: "Guides", to: "/blog" },
    { label: "Contact", to: "/contact" },
  ];

  const cycleTheme = () => {
    if (preference === "light") setPreference("dark");
    else if (preference === "dark") setPreference("system");
    else setPreference("light");
  };

  const themeIcon = {
    light: <Sun size={15} />,
    dark: <Moon size={15} />,
    system: <Monitor size={15} />,
  }[preference];

  const userDisplayName = user?.displayName || user?.email?.split("@")[0] || "Creator";

  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface)] text-[var(--text)] transition-colors duration-200">
      {/* Subtle Top Announcement Bar (Level 1) */}
      {!announcementDismissed && (
        <div className="relative min-h-[36px] bg-[#F8FAFC] dark:bg-[#1A1C24] border-b border-[#E2E8F0] dark:border-[rgba(255,255,255,0.08)] py-1.5 px-6 flex items-center justify-center transition-colors">
          <div className="flex items-center justify-center gap-2 text-center text-xs">
            <span className="text-[#4B5563] dark:text-[#94A3B8] font-normal">
              AI video pipeline 2.4 <span className="text-[#CBD5E1] dark:text-[#475569] mx-1">·</span> Video Bible continuity <span className="text-[#CBD5E1] dark:text-[#475569] mx-1">·</span> Audio ducking
            </span>
            <Link
              to="/how-it-works"
              className="font-semibold text-[#FF6B00] hover:underline inline-flex items-center gap-1 shrink-0 ml-1"
            >
              <span>See how it works</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <button
            onClick={() => setAnnouncementDismissed(true)}
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-white p-1 rounded transition-colors cursor-pointer"
            aria-label="Dismiss announcement"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Studio Navigation Header (Level 2) */}
      <header
        className="saas-header bg-white dark:bg-[#14151B] border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)]"
        style={{
          paddingTop: "clamp(20px, 2.5vw, 24px)",
          paddingBottom: "clamp(16px, 2vw, 20px)",
          height: "auto",
        }}
      >
        <div className="saas-header-inner max-w-7xl px-6 sm:px-8">
          {/* LEFT: ScenoraEdits Brand Mark */}
          <Link to="/" className="flex items-center shrink-0">
            <ScenoraLogo size="md" />
          </Link>

          {/* CENTER: Clean Commercial Navigation (Neutral Charcoal, NOT Orange) */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-8">
            {navLinks.map((link) => {
              const isActive = path === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-[15px] font-medium transition-colors ${
                    isActive
                      ? "text-[#FF6B00] font-semibold"
                      : "text-[#1F2937] dark:text-[#D1D5DB] hover:text-[#FF6B00]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: User Actions & Primary CTA */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle Button (Compact 38x38 rounded-xl) */}
            <button
              onClick={cycleTheme}
              className="w-[38px] h-[38px] rounded-xl border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.12)] bg-white dark:bg-[#1E2028] shadow-xs flex items-center justify-center text-[#4B5563] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white transition-all cursor-pointer"
              title={`Theme: ${preference} (Click to toggle)`}
              aria-label="Toggle theme"
            >
              {themeIcon}
            </button>

            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<ShieldCheck size={14} className="text-[var(--orange)]" />}
                    >
                      Admin
                    </Button>
                  </Link>
                )}

                <Link
                  to="/app/account"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-[12px] hover:bg-[var(--surface)] transition-colors border border-[var(--border)]"
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={userDisplayName}
                      className="w-5 h-5 rounded-full object-cover border border-[var(--border)]"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[var(--orange-subtle)] text-[var(--orange)] font-bold text-xs flex items-center justify-center">
                      <User size={11} />
                    </div>
                  )}
                  <span className="text-xs font-semibold text-[var(--text)] max-w-[90px] truncate">
                    {userDisplayName}
                  </span>
                </Link>

                <button
                  onClick={() => navigate("/app")}
                  className="saas-primary-cta"
                >
                  <span>Open Studio</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => signOutUser()}
                  className="p-2 rounded-[10px] text-[var(--text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)] transition-colors cursor-pointer"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="saas-signin-btn"
                >
                  Sign In
                </Link>

                <button
                  onClick={() => navigate("/app")}
                  className="saas-primary-cta"
                >
                  <span>Start Creating</span>
                  <ArrowRight size={15} />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={cycleTheme}
              className="saas-theme-btn"
              aria-label="Toggle theme"
            >
              {themeIcon}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="saas-theme-btn"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-[72px] left-0 right-0 bg-[var(--white)] border-b border-[var(--border)] px-5 py-5 space-y-3 shadow-lg z-50">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`saas-nav-link text-base py-2.5 ${
                    path === link.to ? "is-active" : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="pt-3 border-t border-[var(--border)] space-y-2.5">
              {isAuthenticated ? (
                <button
                  className="saas-primary-cta w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/app");
                  }}
                >
                  <span>Open Studio</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <>
                  <Link
                    to="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="saas-signin-btn w-full justify-center text-center"
                  >
                    Sign In
                  </Link>
                  <button
                    className="saas-primary-cta w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/app");
                    }}
                  >
                    <span>Start Creating</span>
                    <ArrowRight size={15} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* Balanced Commercial SaaS Product Footer */}
      <footer className="bg-[var(--white)] border-t border-[var(--border)] py-16 sm:py-20 transition-colors">
        <SiteContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Brand Column (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-4 text-left">
              <Link to="/" className="inline-flex items-center gap-3">
                <ScenoraLogo size="md" />
              </Link>
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed max-w-sm mt-3">
                Turn narration into cinematic visuals. An automated AI video production platform coordinating spoken voiceover narration, Video Bible character continuity, and multi-track timelines.
              </p>

              <p className="pt-2 text-sm text-[var(--text-muted)]">
                Built for high-velocity video creators.
              </p>
            </div>

            {/* Link Columns (7 cols on lg, 3 columns) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
              {/* Product */}
              <div className="space-y-3.5 text-left">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text)]">
                  Product
                </h4>
                <ul className="space-y-2 text-[14px] text-[var(--text-secondary)]">
                  <li><Link to="/features" className="hover:text-[var(--orange)] transition-colors">Features</Link></li>
                  <li><Link to="/how-it-works" className="hover:text-[var(--orange)] transition-colors">5-Stage Pipeline</Link></li>
                  <li><Link to="/pricing" className="hover:text-[var(--orange)] transition-colors">Pricing &amp; Plans</Link></li>
                  <li><Link to="/features" className="hover:text-[var(--orange)] transition-colors">Video Bible Registry</Link></li>
                  <li>
                    <Link to="/features" className="hover:text-[var(--orange)] transition-colors inline-flex items-center gap-1.5">
                      <span>Timeline Editor</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/app" className="text-[var(--orange)] font-semibold hover:underline inline-flex items-center gap-1">
                      <span>Scenora Studio</span>
                      <ArrowRight size={12} />
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Workflows */}
              <div className="space-y-3.5 text-left">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text)]">
                  Workflows
                </h4>
                <ul className="space-y-2 text-[14px] text-[var(--text-secondary)]">
                  <li><Link to="/how-it-works" className="hover:text-[var(--orange)] transition-colors">YouTube Documentaries</Link></li>
                  <li><Link to="/how-it-works" className="hover:text-[var(--orange)] transition-colors">9:16 Shorts &amp; Reels</Link></li>
                  <li><Link to="/how-it-works" className="hover:text-[var(--orange)] transition-colors">Character Continuity</Link></li>
                  <li><Link to="/how-it-works" className="hover:text-[var(--orange)] transition-colors">Audio Ducking &amp; Captions</Link></li>
                  <li><Link to="/how-it-works" className="hover:text-[var(--orange)] transition-colors">Local RTX Diffusion</Link></li>
                </ul>
              </div>

              {/* Resources */}
              <div className="space-y-3.5 text-left">
                <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text)]">
                  Resources
                </h4>
                <ul className="space-y-2 text-[14px] text-[var(--text-secondary)]">
                  <li><Link to="/blog" className="hover:text-[var(--orange)] transition-colors">Creator Guides</Link></li>
                  <li><Link to="/contact" className="hover:text-[var(--orange)] transition-colors">Support &amp; FAQ</Link></li>
                  <li>
                    <a
                      href={BRAND.links.github}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-[var(--orange)] transition-colors inline-flex items-center gap-1"
                    >
                      <span>GitHub Repository</span>
                      <ExternalLink size={12} />
                    </a>
                  </li>
                  <li><Link to="/contact" className="hover:text-[var(--orange)] transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/contact" className="hover:text-[var(--orange)] transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Operational Strip */}
          <div className="pt-6 mt-12 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between text-sm text-[var(--text-muted)] gap-4">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <p>{BRAND.copyright}</p>
              <span className="hidden sm:inline text-[var(--border)]">•</span>
              <span>Built for high-velocity video creators</span>
            </div>

            <div className="flex items-center gap-6">
              <Link to="/contact" className="hover:text-[var(--text)] transition-colors">
                Privacy
              </Link>
              <Link to="/contact" className="hover:text-[var(--text)] transition-colors">
                Terms
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-[var(--orange)] font-semibold hover:underline">
                  Admin Shell
                </Link>
              )}
              <a
                href={BRAND.links.github}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors inline-flex items-center justify-center"
                title="View GitHub Repository"
                aria-label="GitHub Repository"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>
        </SiteContainer>
      </footer>
    </div>
  );
};
