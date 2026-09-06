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

      {/* Editorial Footer (Centered & Restrained) */}
      <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)] pt-14 pb-10 transition-colors">
        <SiteContainer>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Col 1: Brand & Tagline */}
            <div className="space-y-3">
              <ScenoraLogo size="sm" />
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xs">
                {BRAND.tagline}. An automated AI video production software suite for modern storytellers.
              </p>
              <div className="text-[11px] font-mono text-[var(--color-text-muted)] pt-1">
                Version {BRAND.version} • Open Source
              </div>
            </div>

            {/* Col 2: Product */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--color-text)] mb-3">
                Product
              </h4>
              <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                <li><Link to="/features" className="hover:text-[var(--color-text)] transition-colors">Features</Link></li>
                <li><Link to="/how-it-works" className="hover:text-[var(--color-text)] transition-colors">How It Works</Link></li>
                <li><Link to="/pricing" className="hover:text-[var(--color-text)] transition-colors">Pricing</Link></li>
                <li><Link to="/app" className="text-[var(--color-primary)] font-semibold hover:underline">Scenora Studio</Link></li>
              </ul>
            </div>

            {/* Col 3: Resources */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--color-text)] mb-3">
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
                    <span>GitHub</span>
                    <ExternalLink size={10} />
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Platform */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--color-text)] mb-3">
                Platform
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-2">
                Video Bible persistence engine with offline SANA-Sprint 1.6B GPU inference and multi-track FFmpeg assembly.
              </p>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[var(--color-success)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                <span>All Systems Operational</span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Strip */}
          <div className="pt-6 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--color-text-muted)] gap-3">
            <p>{BRAND.copyright}</p>
            <div className="flex items-center gap-4">
              <Link to="/contact" className="hover:text-[var(--color-text)] transition-colors">Privacy</Link>
              <Link to="/contact" className="hover:text-[var(--color-text)] transition-colors">Terms</Link>
              {isAdmin && (
                <Link to="/admin" className="text-[var(--color-primary)] font-semibold hover:underline">
                  Admin Shell
                </Link>
              )}
            </div>
          </div>
        </SiteContainer>
      </footer>
    </div>
  );
};
