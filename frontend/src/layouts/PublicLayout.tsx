import React, { useState } from "react";
import { Link, useRouter } from "../router/Router";
import { ScenoraLogo } from "../components/brand/ScenoraLogo";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { PublicFooter } from "../components/public/PublicFooter";
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
      {/* Editorial Announcement Bar */}
      {!announcementDismissed && (
        <div className="saas-announcement-bar" role="region" aria-label="Product announcement">
          <div className="saas-announcement-content">
            <span className="saas-announcement-badge">
              <span className="badge-dot" />
              <span>v2.4 Release</span>
            </span>

            <span className="saas-announcement-text">
              <strong>Zero Token Markup:</strong> Unlimited Local RTX GPU Diffusion &amp; BYOK Pipelines are live.
            </span>

            <Link to="/pricing" className="saas-announcement-cta">
              <span>View Creator Passes</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <button
            onClick={() => setAnnouncementDismissed(true)}
            className="saas-announcement-dismiss"
            aria-label="Dismiss announcement"
            title="Dismiss announcement"
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

      {/* Clean Professional SaaS Product Footer */}
      <PublicFooter />
    </div>
  );
};
