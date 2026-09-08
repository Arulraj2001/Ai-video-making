import React, { useState, useEffect } from "react";
import { Link } from "../../router/Router";
import {
  FileText,
  Clock,
  Calendar,
  CheckCircle2,
  Mail,
  ArrowRight,
  Shield,
} from "lucide-react";
import "../../pages/public/LegalPage.css";

export interface TocItem {
  id: string;
  title: string;
}

export interface LegalPageLayoutProps {
  badge: string;
  title: string;
  lead: string;
  lastUpdated: string;
  version: string;
  readTime: string;
  summaryTitle?: string;
  summaryPoints: string[];
  toc: TocItem[];
  children: React.ReactNode;
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  badge,
  title,
  lead,
  lastUpdated,
  version,
  readTime,
  summaryTitle = "In Plain English (Key Takeaways)",
  summaryPoints,
  toc,
  children,
}) => {
  const [activeId, setActiveId] = useState<string>(toc[0]?.id || "");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      for (let i = toc.length - 1; i >= 0; i--) {
        const el = document.getElementById(toc[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveId(toc[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [toc]);

  return (
    <div className="legal-page-wrap">
      <div className="legal-container">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] font-mono mb-6">
          <Link to="/" className="hover:text-[var(--color-text)] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[var(--color-text-secondary)]">Trust &amp; Legal</span>
          <span>/</span>
          <span className="text-[var(--color-primary)]">{title}</span>
        </div>

        {/* Hero Header */}
        <div className="legal-hero">
          <div className="legal-badge">
            <Shield size={13} />
            <span>{badge}</span>
          </div>

          <h1 className="legal-title">{title}</h1>
          <p className="legal-lead">{lead}</p>

          <div className="legal-meta-row">
            <span className="legal-meta-item">
              <Calendar size={13} />
              <span>Effective Date: {lastUpdated}</span>
            </span>
            <span className="legal-meta-item">
              <FileText size={13} />
              <span>Version: {version}</span>
            </span>
            <span className="legal-meta-item">
              <Clock size={13} />
              <span>Estimated Reading Time: {readTime}</span>
            </span>
          </div>
        </div>

        {/* Summary Box */}
        {summaryPoints.length > 0 && (
          <div className="legal-summary-box">
            <div className="legal-summary-header">
              <CheckCircle2 size={18} className="text-[#FF6B00]" />
              <h4>{summaryTitle}</h4>
            </div>
            <ul className="legal-summary-list">
              {summaryPoints.map((pt, idx) => (
                <li key={idx}>
                  <ArrowRight size={14} />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Content Layout with Sidebar */}
        <div className="legal-layout-grid">
          {/* Table of Contents */}
          <aside className="legal-sidebar">
            <div className="legal-toc-title">Table of Contents</div>
            <nav className="legal-toc-nav" aria-label="Table of Contents">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                    setActiveId(item.id);
                  }}
                  className={`legal-toc-link ${activeId === item.id ? "active" : ""}`}
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main Legal Text */}
          <main className="legal-content">
            {children}

            {/* Support / Legal Contact Card */}
            <div className="mt-12 p-8 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1 max-w-lg">
                <h4 className="text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                  <Mail size={16} className="text-[#FF6B00]" />
                  <span>Questions about our legal terms or commercial licenses?</span>
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  Our creator relations and legal engineering team is available to assist with custom enterprise agreements, indemnification inquiries, or license verification.
                </p>
              </div>

              <Link
                to="/contact"
                className="btn-primary shrink-0 text-xs font-semibold py-2.5 px-5 rounded-xl flex items-center gap-2"
              >
                <span>Contact Legal &amp; Support</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
