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

  const mainNav = [
    { label: "Dashboard", to: "/app", icon: <LayoutDashboard size={17} /> },
    { label: "Projects", to: "/app/projects", icon: <Film size={17} /> },
    { label: "Create Project", to: "/app/create", icon: <PlusCircle size={17} /> },
    {
      label: "Studio",
      to: activeProject ? `/app/studio/${activeProject.id}` : "/app/studio",
      icon: <Sliders size={17} />,
      matchPrefix: "/app/studio",
    },
  ];

  const configNav = [
    { label: "API Keys", to: "/app/api-keys", icon: <Key size={17} /> },
    { label: "Settings", to: "/app/settings", icon: <Settings size={17} /> },
    { label: "Account", to: "/app/account", icon: <User size={17} /> },
  ];

  const miscNav = [
    { label: "Help", to: "/app/help", icon: <HelpCircle size={17} /> },
  ];

  if (isAdmin) {
    miscNav.push({
      label: "Admin Portal",
      to: "/admin",
      icon: <ShieldCheck size={17} />,
    });
  }

  const isNavActive = (to: string, matchPrefix?: string) => {
    if (matchPrefix) return path.startsWith(matchPrefix);
    return path === to;
  };

  const userDisplayName = user?.displayName || user?.email?.split("@")[0] || "Creator";
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  const renderNavSection = (items: typeof mainNav, label?: string) => (
    <>
      {label && (
        <div className="sb-sidebar-section-label">{label}</div>
      )}
      {items.map((item) => {
        const active = isNavActive(item.to, (item as any).matchPrefix);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`sb-nav-item ${active ? "is-active" : ""}`}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <span className="sb-nav-icon">{item.icon}</span>
            <span className="sb-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="app-shell min-h-screen flex flex-col text-[var(--color-text)]">
      {/* ── Top Application Header ─────────────────────────────────────── */}
      <header
        className="app-header border-b border-[var(--color-border)] px-5 sm:px-6 flex items-center justify-between z-30 shrink-0"
        style={{ paddingTop: "clamp(14px, 2vw, 18px)", paddingBottom: "clamp(14px, 2vw, 18px)" }}
      >
        <div className="flex min-w-0 items-center gap-4">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-subtle)] transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <Link to="/app" className="flex items-center py-1">
            <ScenoraLogo subBrand="studio" size="sm" />
          </Link>

          {/* Active Project Switcher */}
          {projects.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-[var(--color-border-subtle)]">
              <span className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">Project</span>
              <select
                value={activeProject?.id || ""}
                onChange={(e) => {
                  selectProject(e.target.value);
                  navigate(`/app/studio/${e.target.value}`);
                }}
                className="text-xs font-semibold bg-[var(--color-card-subtle)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-[var(--color-text)] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] max-w-[180px] truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Header Actions */}
        <div className="app-header-actions flex min-w-0 items-center gap-2 sm:gap-2.5">
          <UsageBadge usage={usage} loading={usageLoading} />

          {/* Health dot */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-muted)]">
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy === true
                  ? "bg-[var(--color-success)]"
                  : isHealthy === false
                  ? "bg-[var(--color-error)]"
                  : "bg-[var(--color-warning)] animate-pulse"
              }`}
            />
            <span className="hidden lg:inline">
              {isHealthy === true ? "Online" : "Checking"}
            </span>
          </div>

          <div className="h-5 w-px bg-[var(--color-border-subtle)] hidden sm:block" />

          <IconButton size="sm" variant="ghost" icon={<Keyboard size={15} />} aria-label="Keyboard shortcuts" onClick={() => setIsShortcutsModalOpen(true)} title="Keyboard shortcuts" />
          <IconButton size="sm" variant="ghost" icon={themeIcon} aria-label="Toggle theme" onClick={cycleTheme} title={`Theme: ${themePreference}`} />

          <Button
            size="sm"
            variant="primary"
            leftIcon={<PlusCircle size={14} />}
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold"
          >
            <span className="hidden sm:inline">New Project</span>
          </Button>

          <IconButton size="sm" variant="ghost" icon={<LogOut size={15} />} aria-label="Sign out" onClick={async () => { await signOutUser(); navigate("/sign-in"); }} title="Sign out" />

          <Link to="/" title="Exit to Public Website">
            <IconButton size="sm" variant="ghost" icon={<ExternalLink size={14} />} aria-label="Exit to website" />
          </Link>
        </div>
      </header>

      {/* ── Main Body Area ─────────────────────────────────────────────── */}
      <div className="app-body flex-1 flex min-h-0 min-w-0 overflow-hidden">

        {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
        <aside className={`sb-sidebar hidden md:flex ${sidebarCollapsed ? "is-collapsed" : ""}`}>
          {/* Nav items */}
          <nav className="sb-sidebar-nav">
            {renderNavSection(mainNav, sidebarCollapsed ? undefined : "Main")}
            {renderNavSection(configNav, sidebarCollapsed ? undefined : "Config")}
            {renderNavSection(miscNav, sidebarCollapsed ? undefined : "More")}
          </nav>

          {/* Footer: user chip + collapse */}
          <div className="sb-sidebar-footer">
            {!sidebarCollapsed && user && (
              <Link to="/app/account" className="sb-user-chip">
                <div className="sb-user-avatar">
                  {user.photoURL
                    ? <img src={user.photoURL} alt={userDisplayName} />
                    : userInitial}
                </div>
                <div className="sb-user-info">
                  <div className="sb-user-name">
                    {userDisplayName}
                    {isAdmin && (
                      <span className="ml-1.5 text-[9px] text-[var(--color-primary)] font-bold">ADMIN</span>
                    )}
                  </div>
                  <div className="sb-user-email">{user.email}</div>
                </div>
              </Link>
            )}
            {sidebarCollapsed && user && (
              <Link to="/app/account" className="sb-user-chip" title={userDisplayName}>
                <div className="sb-user-avatar mx-auto">
                  {user.photoURL ? <img src={user.photoURL} alt={userDisplayName} /> : userInitial}
                </div>
              </Link>
            )}

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="sb-collapse-btn"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /><span>Collapse</span></>}
            </button>
          </div>
        </aside>

        {/* ── Mobile Sidebar Drawer ────────────────────────────────────── */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-[var(--color-modal-backdrop)] backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative w-64 bg-[var(--app-sidebar)] border-r border-[var(--color-border)] p-4 flex flex-col z-50 animate-in slide-in-from-left-2 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)] mb-4">
                <ScenoraLogo subBrand="studio" size="sm" />
                <button onClick={() => setMobileNavOpen(false)} className="p-1 rounded text-[var(--color-text-muted)]" aria-label="Close menu">
                  <X size={18} />
                </button>
              </div>

              {user && (
                <div className="mb-4 sb-user-chip">
                  <div className="sb-user-avatar">
                    {user.photoURL ? <img src={user.photoURL} alt={userDisplayName} /> : userInitial}
                  </div>
                  <div className="sb-user-info">
                    <div className="sb-user-name">{userDisplayName}</div>
                    <div className="sb-user-email">{user.email}</div>
                  </div>
                </div>
              )}

              <div className="mb-3">
                <UsageBadge usage={usage} loading={usageLoading} className="w-full justify-center" />
              </div>

              <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
                <div className="sb-sidebar-section-label">Main</div>
                {mainNav.map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setMobileNavOpen(false)}
                    className={`sb-nav-item ${isNavActive(item.to, (item as any).matchPrefix) ? "is-active" : ""}`}>
                    <span className="sb-nav-icon">{item.icon}</span>
                    <span className="sb-nav-label">{item.label}</span>
                  </Link>
                ))}
                <div className="sb-sidebar-section-label">Config</div>
                {configNav.map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setMobileNavOpen(false)}
                    className={`sb-nav-item ${isNavActive(item.to) ? "is-active" : ""}`}>
                    <span className="sb-nav-icon">{item.icon}</span>
                    <span className="sb-nav-label">{item.label}</span>
                  </Link>
                ))}
                {miscNav.length > 0 && (
                  <>
                    <div className="sb-sidebar-section-label">More</div>
                    {miscNav.map((item) => (
                      <Link key={item.to} to={item.to} onClick={() => setMobileNavOpen(false)}
                        className={`sb-nav-item ${isNavActive(item.to) ? "is-active" : ""}`}>
                        <span className="sb-nav-icon">{item.icon}</span>
                        <span className="sb-nav-label">{item.label}</span>
                      </Link>
                    ))}
                  </>
                )}
              </nav>

              <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2 mt-2">
                <Button variant="ghost" size="sm" className="w-full text-[var(--color-error)]" leftIcon={<LogOut size={14} />}
                  onClick={async () => { setMobileNavOpen(false); await signOutUser(); navigate("/sign-in"); }}>
                  Sign Out
                </Button>
                <Link to="/" onClick={() => setMobileNavOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">Exit to Website</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Main Content Area ────────────────────────────────────────── */}
        <main className="app-main min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── Global Modals ──────────────────────────────────────────────── */}
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
