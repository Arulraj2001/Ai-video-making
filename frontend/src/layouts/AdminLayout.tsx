import React, { useState } from "react";
import { Link, useRouter } from "../router/Router";
import { ScenoraLogo } from "../components/brand/ScenoraLogo";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";
import { Button, IconButton } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Tag,
  BarChart3,
  FileCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  ArrowLeft,
  ShieldAlert,
  LogOut,
} from "lucide-react";

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { path, navigate } = useRouter();
  const { preference, setPreference } = useTheme();
  const { user, signOutUser } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

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

  const adminNav = [
    { label: "Dashboard", to: "/admin", icon: <LayoutDashboard size={18} /> },
    { label: "Users", to: "/admin/users", icon: <Users size={18} /> },
    { label: "Payments", to: "/admin/payments", icon: <CreditCard size={18} /> },
    { label: "Pricing", to: "/admin/pricing", icon: <Tag size={18} /> },
    { label: "Usage & Quotas", to: "/admin/usage", icon: <BarChart3 size={18} /> },
    { label: "Content", to: "/admin/content", icon: <FileCheck size={18} /> },
    { label: "Settings", to: "/admin/settings", icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)]">
      {/* Admin Top Header */}
      <header className="h-14 bg-[var(--color-surface)] border-b border-[var(--scenora-rust)]/30 px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="flex items-center">
            <ScenoraLogo subBrand="admin" size="sm" />
          </Link>

          <Badge variant="accent" className="hidden sm:inline-flex">
            <ShieldAlert size={12} />
            <span>Admin Portal</span>
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden md:inline-block text-xs font-mono text-[var(--color-text-secondary)]">
              {user.email}
            </span>
          )}

          <IconButton
            size="sm"
            variant="ghost"
            icon={themeIcon}
            aria-label="Toggle theme"
            onClick={cycleTheme}
          />

          <Button
            size="sm"
            variant="secondary"
            leftIcon={<ArrowLeft size={14} />}
            onClick={() => navigate("/app")}
          >
            Back to Studio
          </Button>

          <IconButton
            size="sm"
            variant="ghost"
            icon={<LogOut size={15} />}
            aria-label="Sign out"
            title="Sign out"
            onClick={async () => {
              await signOutUser();
              navigate("/sign-in");
            }}
          />
        </div>
      </header>

      {/* Admin Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Admin Sidebar */}
        <aside
          className={`bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-all duration-200 flex flex-col shrink-0 ${
            collapsed ? "w-16" : "w-56"
          }`}
        >
          <div className="flex-1 py-4 px-2 space-y-1">
            {adminNav.map((item) => {
              const isActive = path === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[rgba(135,79,65,0.25)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-subtle)]"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>

          <div className="p-2 border-t border-[var(--color-border-subtle)]">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs cursor-pointer"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {!collapsed && <span className="ml-2 font-medium">Collapse</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[var(--color-background)]">
          {children}
        </main>
      </div>
    </div>
  );
};
