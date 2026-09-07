import { useEffect, lazy, Suspense } from "react";
import { RouterProvider, useRouter, matchRoute } from "./router/Router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingState } from "./components/ui/StateViews";

// Layouts
import { PublicLayout } from "./layouts/PublicLayout";
import { AppLayout } from "./layouts/AppLayout";
import { AdminLayout } from "./layouts/AdminLayout";

// Public Pages
import { HomePage } from "./pages/public/HomePage";
import { FeaturesPage } from "./pages/public/FeaturesPage";
import { HowItWorksPage } from "./pages/public/HowItWorksPage";
import { PricingPage } from "./pages/public/PricingPage";
import { BlogPage } from "./pages/public/BlogPage";
import { ContactPage } from "./pages/public/ContactPage";
import { SignInPage } from "./pages/public/SignInPage";
import { SignUpPage } from "./pages/public/SignUpPage";
import { NotFoundPage } from "./pages/public/NotFoundPage";

// Authenticated App Pages
import { AppDashboardPage } from "./pages/app/AppDashboardPage";
import { ProjectsListPage } from "./pages/app/ProjectsListPage";
import { CreateProjectPage } from "./pages/app/CreateProjectPage";
import { StudioPage } from "./pages/app/StudioPage";
import { AppSettingsPage } from "./pages/app/AppSettingsPage";
import { ApiKeysPage } from "./pages/app/ApiKeysPage";
import { AccountPage } from "./pages/app/AccountPage";
import { HelpPage } from "./pages/app/HelpPage";
import { UpgradePage } from "./pages/app/UpgradePage";

// Admin Pages (Lazy Loaded for minimal initial bundle)
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage").then((m) => ({ default: m.AdminUsersPage })));
const AdminPaymentsPage = lazy(() => import("./pages/admin/AdminPaymentsPage").then((m) => ({ default: m.AdminPaymentsPage })));
const AdminPricingPage = lazy(() => import("./pages/admin/AdminPricingPage").then((m) => ({ default: m.AdminPricingPage })));
const AdminUsagePage = lazy(() => import("./pages/admin/AdminUsagePage").then((m) => ({ default: m.AdminUsagePage })));
const AdminContentPage = lazy(() => import("./pages/admin/AdminContentPage").then((m) => ({ default: m.AdminContentPage })));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage").then((m) => ({ default: m.AdminSettingsPage })));
const AdminAccessDenied = lazy(() => import("./pages/admin/AdminAccessDenied").then((m) => ({ default: m.AdminAccessDenied })));

function RedirectToSignIn({ returnUrl }: { returnUrl: string }) {
  const { replace } = useRouter();
  useEffect(() => {
    replace(`/sign-in?returnUrl=${encodeURIComponent(returnUrl)}`);
  }, [replace, returnUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <LoadingState message="Redirecting to sign in..." />
    </div>
  );
}

function AppContent() {
  const { path, searchParams } = useRouter();
  const { loading, isAuthenticated, isAdmin } = useAuth();

  // 1. Session verification loading state (zero-flash guarantee)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <LoadingState message="Verifying ScenoraEdits session..." />
      </div>
    );
  }

  // 2. Backward compatibility: If someone arrives with ?stage=... on root
  if (path === "/" && searchParams.has("stage")) {
    if (!isAuthenticated) {
      return <RedirectToSignIn returnUrl={`/app/studio?${searchParams.toString()}`} />;
    }
    return (
      <AppLayout>
        <StudioPage />
      </AppLayout>
    );
  }

  // 3. Admin Shell Routes (/admin/*)
  if (path.startsWith("/admin")) {
    if (!isAuthenticated) {
      return <RedirectToSignIn returnUrl={path} />;
    }

    if (!isAdmin) {
      return (
        <AdminLayout>
          <Suspense fallback={<div className="p-8"><LoadingState message="Loading..." /></div>}>
            <AdminAccessDenied />
          </Suspense>
        </AdminLayout>
      );
    }

    let adminContent = <AdminDashboardPage />;
    if (path === "/admin/users") adminContent = <AdminUsersPage />;
    else if (path === "/admin/payments") adminContent = <AdminPaymentsPage />;
    else if (path === "/admin/pricing") adminContent = <AdminPricingPage />;
    else if (path === "/admin/usage") adminContent = <AdminUsagePage />;
    else if (path === "/admin/content") adminContent = <AdminContentPage />;
    else if (path === "/admin/settings") adminContent = <AdminSettingsPage />;

    return (
      <AdminLayout>
        <Suspense fallback={<div className="p-8"><LoadingState message="Loading administrative view..." /></div>}>
          {adminContent}
        </Suspense>
      </AdminLayout>
    );
  }

  // 4. Authenticated App Shell Routes (/app/*)
  if (path.startsWith("/app")) {
    if (!isAuthenticated) {
      const fullPath = path + (searchParams.toString() ? `?${searchParams.toString()}` : "");
      return <RedirectToSignIn returnUrl={fullPath} />;
    }

    const studioParamMatch = matchRoute("/app/studio/:projectId", path);

    let appContent = <AppDashboardPage />;
    if (path === "/app/projects") {
      appContent = <ProjectsListPage />;
    } else if (path === "/app/create") {
      appContent = <CreateProjectPage />;
    } else if (studioParamMatch.matches) {
      appContent = <StudioPage projectId={studioParamMatch.params.projectId} />;
    } else if (path === "/app/studio") {
      appContent = <StudioPage />;
    } else if (path === "/app/settings") {
      appContent = <AppSettingsPage />;
    } else if (path === "/app/api-keys") {
      appContent = <ApiKeysPage />;
    } else if (path === "/app/account") {
      appContent = <AccountPage />;
    } else if (path === "/app/upgrade") {
      appContent = <UpgradePage />;
    } else if (path === "/app/help") {
      appContent = <HelpPage />;
    }


    return <AppLayout>{appContent}</AppLayout>;
  }

  // 5. Public Website Routes (/, /features, /how-it-works, /pricing, /blog, /contact, /sign-in, /sign-up)
  let publicContent = <HomePage />;
  if (path === "/features") publicContent = <FeaturesPage />;
  else if (path === "/how-it-works") publicContent = <HowItWorksPage />;
  else if (path === "/pricing") publicContent = <PricingPage />;
  else if (path === "/blog") publicContent = <BlogPage />;
  else if (path === "/contact") publicContent = <ContactPage />;
  else if (path === "/sign-in") publicContent = <SignInPage />;
  else if (path === "/sign-up") publicContent = <SignUpPage />;
  else if (path !== "/") publicContent = <NotFoundPage />;

  return <PublicLayout>{publicContent}</PublicLayout>;
}

export function App() {
  return (
    <ErrorBoundary>
      <RouterProvider>
        <AuthProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AuthProvider>
      </RouterProvider>
    </ErrorBoundary>
  );
}

export default App;
