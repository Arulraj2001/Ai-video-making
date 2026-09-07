import React, { useState } from "react";
import { Link, useRouter } from "../router/Router";
import { ScenoraLogo } from "../components/brand/ScenoraLogo";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { Button, IconButton } from "../components/ui/Button";
import { CreateProjectModal } from "../components/CreateProjectModal";
import { ImportBackupModal } from "../components/ImportBackupModal";
import { KeyboardShortcutsModal } from "../components/KeyboardShortcutsModal";
import { useUsage } from "../hooks/useUsage";
import { UsageBadge } from "../components/ui/UsageBadge";
import {
  LayoutDashboard,
  Film,
  PlusCircle,
  Sliders,
  Key,
  Settings,
  User,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  ExternalLink,
  Keyboard,
  ShieldCheck,
  LogOut,
} from "lucide-react";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { path, navigate } = useRouter();
  const { user, isAdmin, signOutUser } = useAuth();
  const {
    projects,
    activeProject,
    selectProject,
    themePreference,
    setThemePreference,
    isHealthy,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isRestoreModalOpen,
    setIsRestoreModalOpen,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    createProject,
    refreshProjects,
  } = useApp();

  const { usage, loading: usageLoading } = useUsage();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const cycleTheme = () => {
    if (themePreference === "light") setThemePreference("dark");
    else if (themePreference === "dark") setThemePreference("system");
    else setThemePreference("light");
  };

  const themeIcon = {
    light: <Sun size={15} />,
    dark: <Moon size={15} />,
    system: <Monitor size={15} />,
  }[themePreference];

  const navItems = [
    { label: "Dashboard", to: "/app", icon: <LayoutDashboard size={18} /> },
    { label: "Projects", to: "/app/projects", icon: <Film size={18} /> },
    { label: "Create Project", to: "/app/create", icon: <PlusCircle size={18} /> },
    {
      label: "Studio",
      to: activeProject ? `/app/studio/${activeProject.id}` : "/app/studio",
      icon: <Sliders size={18} />,
    },
    { label: "API Keys", to: "/app/api-keys", icon: <Key size={18} /> },
    { label: "Settings", to: "/app/settings", icon: <Settings size={18} /> },
    { label: "Account", to: "/app/account", icon: <User size={18} /> },
    { label: "Help", to: "/app/help", icon: <HelpCircle size={18} /> },
  ];

  if (isAdmin) {
    navItems.push({
      label: "Admin Portal",
      to: "/admin",
      icon: <ShieldCheck size={18} className="text-[var(--color-primary)]" />,
    });
  }

  const userDisplayName = user?.displayName || user?.email?.split("@")[0] || "Creator";

  return (
    <div className="app-shell min-h-screen flex flex-col text-[var(--color-text)]">
      {/* Top Application Header */}
      <header
        className="app-header border-b border-[var(--color-border)] px-5 sm:px-8 flex items-center justify-between z-30 shrink-0"
        style={{
          paddingTop: "clamp(20px, 2.5vw, 24px)",
          paddingBottom: "clamp(16px, 2vw, 20px)",
        }}
      >
        <div className="flex min-w-0 items-center gap-4">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-subtle)] transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo with Studio subbrand */}
          <Link to="/app" className="flex items-center py-1">
            <ScenoraLogo subBrand="studio" size="sm" />
          </Link>

          {/* Active Project Switcher */}
          {projects.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-[var(--color-border-subtle)]">
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Project:</span>
              <select
                value={activeProject?.id || ""}
                onChange={(e) => {
                  selectProject(e.target.value);
                  navigate(`/app/studio/${e.target.value}`);
                }}
                className="text-xs font-semibold bg-[var(--color-card-subtle)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-[var(--color-text)] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] max-w-[200px] truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Header Actions */}
        <div className="app-header-actions flex min-w-0 items-center gap-2.5 sm:gap-3">
          {/* Generation Usage Indicator (Phase 16) */}
          <UsageBadge usage={usage} loading={usageLoading} />

          {/* Health Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-[var(--color-text-muted)]">
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy === true
                  ? "bg-[var(--color-success)]"
                  : isHealthy === false
                  ? "bg-[var(--color-error)]"
                  : "bg-[var(--color-warning)] animate-pulse"
              }`}
            />
            <span className="text-[var(--color-text-muted)]">
              {isHealthy === true ? "Engine Online" : "Engine Checking"}
            </span>
          </div>

          <div className="h-5 w-px bg-[var(--color-border-subtle)] hidden sm:block" />

          {/* Keyboard Shortcuts Trigger */}
          <IconButton
            size="sm"
            variant="ghost"
            icon={<Keyboard size={15} />}
            aria-label="Keyboard shortcuts"
            onClick={() => setIsShortcutsModalOpen(true)}
            title="Keyboard shortcuts"
          />

          {/* Theme Selector */}
          <IconButton
            size="sm"
            variant="ghost"
            icon={themeIcon}
            aria-label="Toggle theme"
            onClick={cycleTheme}
            title={`Theme: ${themePreference}`}
          />

          {/* User Account / Identity Chip */}
          <Link
            to="/app/account"
            className="hidden md:flex items-center gap-2 px-1 py-1 transition-colors"
            title="Account Settings"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={userDisplayName}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold text-[10px] flex items-center justify-center">
                <User size={11} />
              </div>
            )}
            <span className="text-xs font-semibold text-[var(--color-text)] max-w-[90px] truncate">
              {userDisplayName}
            </span>
            {isAdmin && (
                <span className="text-[9px] text-[var(--color-primary)] font-bold">
                Admin
              </span>
            )}
          </Link>

          {/* Quick Create Project Button */}
          <Button
            size="sm"
            variant="primary"
            leftIcon={<PlusCircle size={14} />}
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold"
          >
            <span className="hidden sm:inline">New Project</span>
          </Button>

          {/* Sign Out Button */}
          <IconButton
            size="sm"
            variant="ghost"
            icon={<LogOut size={15} />}
            aria-label="Sign out"
            onClick={async () => {
              await signOutUser();
              navigate("/sign-in");
            }}
            title="Sign out of ScenoraEdits"
          />

          {/* Public Website Link */}
          <Link to="/" title="Exit to Public Website">
            <IconButton
              size="sm"
              variant="ghost"
              icon={<ExternalLink size={14} />}
              aria-label="Exit to website"
            />
          </Link>
        </div>
      </header>

      {/* Main Body Area: Sidebar + Main Stage Content */}
      <div className="app-body flex-1 flex min-h-0 min-w-0 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`app-sidebar hidden md:flex flex-col border-r border-[var(--color-border)] transition-all duration-200 shrink-0 ${
            sidebarCollapsed ? "w-20" : "w-60"
          }`}
        >
          <div
            className="flex-1 px-3 space-y-1.5 overflow-y-auto"
            style={{
              paddingTop: "clamp(20px, 2.5vw, 24px)",
              paddingBottom: "20px",
            }}
          >
            {navItems.map((item) => {
              const isActive =
                path === item.to ||
                (item.label === "Studio" && path.startsWith("/app/studio"));

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`app-nav-link flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold transition-colors select-none ${
                    isActive
                      ? "is-active"
                      : "text-[var(--color-text-secondary)]"
                  } ${sidebarCollapsed ? "justify-center px-0 py-3" : ""}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* User Preview & Sidebar Collapse Control */}
          <div className="p-2 border-t border-[var(--color-border-subtle)] space-y-2">
            {!sidebarCollapsed && user && (
              <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--color-card-subtle)] border border-[var(--color-border-subtle)] text-[11px]">
                <div className="font-semibold text-[var(--color-text)] truncate">{userDisplayName}</div>
                <div className="text-[10px] text-[var(--color-text-muted)] truncate">{user.email}</div>
              </div>
            )}

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="app-collapse-button"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {!sidebarCollapsed && <span className="ml-2 font-medium">Collapse</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-[var(--color-modal-backdrop)] backdrop-blur-xs"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="app-sidebar relative w-64 border-r border-[var(--color-border)] p-4 flex flex-col z-50 animate-in slide-in-from-left-2 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)] mb-4">
                <ScenoraLogo subBrand="studio" size="sm" />
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1 rounded text-[var(--color-text-muted)]"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {user && (
                <div className="mb-3 p-2.5 rounded-lg bg-[var(--color-card-subtle)] border border-[var(--color-border-subtle)] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center">
                    <User size={14} />
                  </div>
                  <div className="truncate flex-1">
                    <div className="text-xs font-bold text-[var(--color-text)] truncate">{userDisplayName}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] truncate">{user.email}</div>
                  </div>
                </div>
              )}

              {/* Mobile Usage Badge */}
              <div className="mb-3">
                <UsageBadge usage={usage} loading={usageLoading} className="w-full justify-center" />
              </div>

              <div className="space-y-1 flex-1 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileNavOpen(false)}
                    className={`app-nav-link flex items-center gap-3 px-3 py-2.5 text-xs font-semibold ${
                      path === item.to || (item.label === "Studio" && path.startsWith("/app/studio"))
                        ? "is-active"
                        : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-[var(--color-error)]"
                  leftIcon={<LogOut size={14} />}
                  onClick={async () => {
                    setMobileNavOpen(false);
                    await signOutUser();
                    navigate("/sign-in");
                  }}
                >
                  Sign Out
                </Button>

                <Link to="/" onClick={() => setMobileNavOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Exit to Website
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="app-main min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (input) => {
          const created = await createProject(input);
          navigate(`/app/studio/${created.id}`);
        }}
      />

      <ImportBackupModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onSuccess={(imported) => {
          refreshProjects();
          selectProject(imported.id);
          navigate(`/app/studio/${imported.id}`);
        }}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
};
