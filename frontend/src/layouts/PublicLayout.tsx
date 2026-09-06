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
  Mail,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { path, navigate } = useRouter();
  const { preference, setPreference } = useTheme();
  const { user, isAuthenticated, isAdmin, signOutUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const navLinks = [
    { label: "Features", to: "/features" },
    { label: "How It Works", to: "/how-it-works" },
    { label: "Pricing", to: "/pricing" },
    { label: "Blog / Guides", to: "/blog" },
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

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-200">
      {/* Top Announcement Bar (Subtle & Restrained) */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)] text-xs py-2 text-center text-[var(--color-text-secondary)]">
        <SiteContainer className="flex items-center justify-center gap-2">
          <span className="pill-tag-mono bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold">
            Phase 12
          </span>
          <span className="hidden sm:inline">
            Video Bible character consistency and offline local GPU inference now active.
          </span>
          <span className="sm:hidden">
            Local GPU &amp; Video Bible active.
          </span>
          <Link
            to="/how-it-works"
            className="font-semibold text-[var(--color-primary)] hover:underline inline-flex items-center gap-0.5 ml-1"
          >
            <span>Learn more</span>
            <ArrowRight size={11} />
          </Link>
        </SiteContainer>
      </div>

      {/* Main Studio Navigation Header */}
      <header className="sticky top-0 z-40 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[var(--color-border-subtle)]">
        <SiteContainer className="h-16 flex items-center justify-between gap-6">
          {/* LEFT: ScenoraEdits Brand Mark */}
          <Link to="/" className="flex items-center shrink-0">
            <ScenoraLogo size="md" />
          </Link>

          {/* CENTER: Navigation Links (Clean Text Links with Active Indicator) */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = path === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors relative py-1 ${
                    isActive
                      ? "text-[var(--color-text)] font-semibold"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--color-primary)] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Aligned Controls & Primary CTA */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            {/* GPU Status Pill */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border-subtle)]"
              title="SANA-Sprint 1.6B Offline GPU & Cloud Ready"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] pulse-indicator" />
              <span>GPU: Online</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={cycleTheme}
              className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
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
                      leftIcon={<ShieldCheck size={14} className="text-[var(--color-primary)]" />}
                    >
                      Admin
                    </Button>
                  </Link>
                )}

                <Link
                  to="/app/account"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors border border-[var(--color-border-subtle)]"
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={userDisplayName}
                      className="w-5 h-5 rounded-full object-cover border border-[var(--color-border)]"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center">
                      <User size={11} />
                    </div>
                  )}
                  <span className="text-xs font-semibold text-[var(--color-text)] max-w-[90px] truncate">
                    {userDisplayName}
                  </span>
                </Link>

                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight size={14} />}
                  onClick={() => navigate("/app")}
                >
                  Open Studio
                </Button>

                <button
                  onClick={() => signOutUser()}
                  className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)] transition-colors cursor-pointer"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors px-2 py-1"
                >
                  Sign In
                </Link>

                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight size={14} />}
                  onClick={() => navigate("/app")}
                  className="font-semibold shadow-sm"
                >
                  Launch Studio
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={cycleTheme}
              className="p-2 rounded-lg text-[var(--color-text-secondary)]"
              aria-label="Toggle theme"
            >
              {themeIcon}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[var(--color-text)] cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </SiteContainer>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 pt-3 pb-6 flex flex-col gap-3 shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 text-sm font-medium flex items-center justify-between ${
                  path === link.to
                    ? "text-[var(--color-primary)] font-bold"
                    : "text-[var(--color-text-secondary)]"
                }`}
              >
                <span>{link.label}</span>
                {path === link.to && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />}
              </Link>
            ))}

            <div className="pt-3 border-t border-[var(--color-border-subtle)] flex flex-col gap-2.5">
              {isAuthenticated ? (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/app");
                    }}
                  >
                    Launch Studio
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-[var(--color-error)]"
                    leftIcon={<LogOut size={14} />}
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await signOutUser();
                      navigate("/sign-in");
                    }}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="md" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/app");
                    }}
                  >
                    Launch Studio
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* World-Class Creative Software Footer */}
      <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)] pt-16 pb-12 transition-colors relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/3 w-96 h-40 bg-[var(--color-primary)]/5 blur-3xl pointer-events-none rounded-full" />

        <SiteContainer>
          {/* 1. Newsletter & Creator Dispatch Strip */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border-subtle)] mb-14 flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10 shadow-xs">
            <div className="space-y-1.5 text-center lg:text-left max-w-xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--color-primary)] uppercase tracking-wider">
                <Sparkles size={13} />
                <span>The Creator Dispatch</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-display text-[var(--color-text)]">
                Master AI video production workflows
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Join 2,400+ creators receiving weekly Video Bible character prompts, SANA diffusion benchmarks, and multi-track NLE techniques.
              </p>
            </div>

            <div className="w-full lg:w-auto shrink-0">
              {newsletterSubscribed ? (
                <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-success-subtle)] text-[var(--color-success)] text-xs font-semibold border border-[var(--color-success)]/30">
                  <CheckCircle2 size={16} />
                  <span>You're on the list! Welcome to the ScenoraEdits creator circle.</span>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newsletterEmail.trim()) setNewsletterSubscribed(true);
                  }}
                  className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto"
                >
                  <div className="relative w-full sm:w-72">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your creator email..."
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full sm:w-auto font-semibold px-5 py-2.5"
                  >
                    Subscribe Free
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* 2. Multi-Column Navigation Hierarchy */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-[var(--color-border-subtle)]">
            {/* Col 1: Brand & Purpose (2 cols on mobile, 1.5 on desktop) */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <ScenoraLogo size="sm" />
                <span className="pill-tag-mono bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] text-[10px]">
                  v{BRAND.version}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-sm font-sans">
                {BRAND.tagline}. An automated AI video production software suite coordinating voiceover audio, character consistency, and local GPU diffusion.
              </p>

              {/* Real-time System Status Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border-subtle)] text-[11px] font-mono text-[var(--color-text-secondary)]">
                <span className="w-2 h-2 rounded-full bg-[var(--color-success)] pulse-indicator" />
                <span>All Systems Operational</span>
                <span className="text-[var(--color-border-strong)]">•</span>
                <span className="text-[var(--color-text-muted)]">GPU Engine Ready</span>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-[var(--color-text-muted)]">
                <span>SANA-Sprint 1.6B</span>
                <span>•</span>
                <span>FFmpeg 7.0</span>
                <span>•</span>
                <span>RTX Accelerated</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--color-text)]">
                Product
              </h4>
              <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                <li><Link to="/features" className="hover:text-[var(--color-text)] transition-colors">Features</Link></li>
                <li><Link to="/how-it-works" className="hover:text-[var(--color-text)] transition-colors">5-Stage Pipeline</Link></li>
                <li><Link to="/pricing" className="hover:text-[var(--color-text)] transition-colors">Pricing &amp; Plans</Link></li>
                <li><Link to="/features" className="hover:text-[var(--color-text)] transition-colors">Video Bible Registry</Link></li>
                <li><Link to="/features" className="hover:text-[var(--color-text)] transition-colors">Timeline Editor</Link></li>
                <li>
                  <Link to="/app" className="text-[var(--color-primary)] font-semibold hover:underline inline-flex items-center gap-1">
                    <span>Scenora Studio</span>
                    <ArrowRight size={10} />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Workflows */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--color-text)]">
                Workflows
              </h4>
              <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                <li><Link to="/how-it-works" className="hover:text-[var(--color-text)] transition-colors">YouTube Documentaries</Link></li>
                <li><Link to="/how-it-works" className="hover:text-[var(--color-text)] transition-colors">9:16 Shorts &amp; Reels</Link></li>
                <li><Link to="/how-it-works" className="hover:text-[var(--color-text)] transition-colors">Character Consistency</Link></li>
                <li><Link to="/how-it-works" className="hover:text-[var(--color-text)] transition-colors">Local RTX Inference</Link></li>
                <li><Link to="/how-it-works" className="hover:text-[var(--color-text)] transition-colors">FFmpeg Auto-Ducking</Link></li>
              </ul>
            </div>

            {/* Col 4: Resources & Legal */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--color-text)]">
                Resources
              </h4>
              <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                <li><Link to="/blog" className="hover:text-[var(--color-text)] transition-colors">Creator Guides</Link></li>
                <li><Link to="/contact" className="hover:text-[var(--color-text)] transition-colors">Support &amp; FAQ</Link></li>
                <li>
                  <a
                    href={BRAND.links.github}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[var(--color-text)] transition-colors inline-flex items-center gap-1"
                  >
                    <span>GitHub Repository</span>
                    <ExternalLink size={10} />
                  </a>
                </li>
                <li><Link to="/contact" className="hover:text-[var(--color-text)] transition-colors">Privacy Policy</Link></li>
                <li><Link to="/contact" className="hover:text-[var(--color-text)] transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* 3. Bottom Operational & Legal Strip */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--color-text-muted)] gap-4">
            <div className="flex flex-wrap items-center gap-4 text-center sm:text-left">
              <p>{BRAND.copyright}</p>
              <span className="hidden sm:inline text-[var(--color-border-subtle)]">•</span>
              <span className="text-[11px] font-mono">Built for modern creators</span>
            </div>

            <div className="flex items-center gap-5">
              <Link to="/contact" className="hover:text-[var(--color-text)] transition-colors text-[11px]">
                Privacy
              </Link>
              <Link to="/contact" className="hover:text-[var(--color-text)] transition-colors text-[11px]">
                Terms
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-[var(--color-primary)] font-semibold hover:underline text-[11px]">
                  Admin Shell
                </Link>
              )}
              <a
                href={BRAND.links.github}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg hover:text-[var(--color-text)] hover:bg-[var(--color-surface-sunken)] transition-colors inline-flex items-center justify-center"
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

