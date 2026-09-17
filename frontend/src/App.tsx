import { lazy, useEffect, Suspense } from "react";
import { RouterProvider, useRouter, matchRoute } from "./router/Router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingState } from "./components/ui/StateViews";

// Layouts
import { PublicLayout } from "./layouts/PublicLayout";
import { AppLayout } from "./layouts/AppLayout";

// Public Pages
import { HomePage } from "./pages/public/HomePage";
import { SignInPage } from "./pages/public/SignInPage";
import { SignUpPage } from "./pages/public/SignUpPage";
import { NotFoundPage } from "./pages/public/NotFoundPage";

// Primary App Pages (eagerly loaded for instant 0ms transitions)
import { AppDashboardPage } from "./pages/app/AppDashboardPage";
import { ProjectsListPage } from "./pages/app/ProjectsListPage";
import { StudioPage } from "./pages/app/StudioPage";

// Authenticated App Shell Secondary Pages (lazy)
const AdminLayout = lazy(() => import("./layouts/AdminLayout").then(({ AdminLayout }) => ({ default: AdminLayout })));

const FeaturesPage = lazy(() => import("./pages/public/FeaturesPage").then(({ FeaturesPage }) => ({ default: FeaturesPage })));
const HowItWorksPage = lazy(() => import("./pages/public/HowItWorksPage").then(({ HowItWorksPage }) => ({ default: HowItWorksPage })));
const UseCasesPage = lazy(() => import("./pages/public/UseCasesPage").then(({ UseCasesPage }) => ({ default: UseCasesPage })));
const PricingPage = lazy(() => import("./pages/public/PricingPage").then(({ PricingPage }) => ({ default: PricingPage })));
const BlogPage = lazy(() => import("./pages/public/BlogPage").then(({ BlogPage }) => ({ default: BlogPage })));
const ContactPage = lazy(() => import("./pages/public/ContactPage").then(({ ContactPage }) => ({ default: ContactPage })));
const TermsPage = lazy(() => import("./pages/public/TermsPage").then(({ TermsPage }) => ({ default: TermsPage })));
const PrivacyPage = lazy(() => import("./pages/public/PrivacyPage").then(({ PrivacyPage }) => ({ default: PrivacyPage })));
const CommercialRightsPage = lazy(() => import("./pages/public/CommercialRightsPage").then(({ CommercialRightsPage }) => ({ default: CommercialRightsPage })));
const SecurityPage = lazy(() => import("./pages/public/SecurityPage").then(({ SecurityPage }) => ({ default: SecurityPage })));
const CookiesPage = lazy(() => import("./pages/public/CookiesPage").then(({ CookiesPage }) => ({ default: CookiesPage })));
const StatusPage = lazy(() => import("./pages/public/StatusPage").then(({ StatusPage }) => ({ default: StatusPage })));

const CreateProjectPage = lazy(() => import("./pages/app/CreateProjectPage").then(({ CreateProjectPage }) => ({ default: CreateProjectPage })));
const AppSettingsPage = lazy(() => import("./pages/app/AppSettingsPage").then(({ AppSettingsPage }) => ({ default: AppSettingsPage })));
const ApiKeysPage = lazy(() => import("./pages/app/ApiKeysPage").then(({ ApiKeysPage }) => ({ default: ApiKeysPage })));
const AccountPage = lazy(() => import("./pages/app/AccountPage").then(({ AccountPage }) => ({ default: AccountPage })));
const HelpPage = lazy(() => import("./pages/app/HelpPage").then(({ HelpPage }) => ({ default: HelpPage })));
const UpgradePage = lazy(() => import("./pages/app/UpgradePage").then(({ UpgradePage }) => ({ default: UpgradePage })));

const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage").then(({ AdminDashboardPage }) => ({ default: AdminDashboardPage })));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage").then(({ AdminUsersPage }) => ({ default: AdminUsersPage })));
const AdminPaymentsPage = lazy(() => import("./pages/admin/AdminPaymentsPage").then(({ AdminPaymentsPage }) => ({ default: AdminPaymentsPage })));
const AdminPricingPage = lazy(() => import("./pages/admin/AdminPricingPage").then(({ AdminPricingPage }) => ({ default: AdminPricingPage })));
const AdminUsagePage = lazy(() => import("./pages/admin/AdminUsagePage").then(({ AdminUsagePage }) => ({ default: AdminUsagePage })));
const AdminContentPage = lazy(() => import("./pages/admin/AdminContentPage").then(({ AdminContentPage }) => ({ default: AdminContentPage })));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage").then(({ AdminSettingsPage }) => ({ default: AdminSettingsPage })));
const AdminMessagesPage = lazy(() => import("./pages/admin/AdminMessagesPage").then(({ AdminMessagesPage }) => ({ default: AdminMessagesPage })));
const AdminAccessDenied = lazy(() => import("./pages/admin/AdminAccessDenied").then(({ AdminAccessDenied }) => ({ default: AdminAccessDenied })));

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
      <Suspense fallback={<LoadingState message="Loading studio..." className="py-20" />}>
        <AppLayout>
          <StudioPage />
        </AppLayout>
      </Suspense>
    );
  }

  // 3. Admin Shell Routes (/admin/*)
  if (path.startsWith("/admin")) {
    if (!isAuthenticated) {
      return <RedirectToSignIn returnUrl={path} />;
    }

    if (!isAdmin) {
      return (
        <Suspense fallback={<div className="p-8"><LoadingState message="Loading..." /></div>}>
          <AdminLayout>
            <AdminAccessDenied />
          </AdminLayout>
        </Suspense>
      );
    }

    let adminContent = <AdminDashboardPage />;
    if (path === "/admin/users") adminContent = <AdminUsersPage />;
    else if (path === "/admin/payments") adminContent = <AdminPaymentsPage />;
    else if (path === "/admin/pricing") adminContent = <AdminPricingPage />;
    else if (path === "/admin/usage") adminContent = <AdminUsagePage />;
    else if (path === "/admin/messages") adminContent = <AdminMessagesPage />;
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

    return (
      <AppLayout>
        <Suspense fallback={<LoadingState message="Loading..." className="py-12" />}>
          {appContent}
        </Suspense>
      </AppLayout>
    );
  }

  // 5. Public Website Routes (/, /features, /how-it-works, /pricing, /blog, /contact, /sign-in, /sign-up)
  let publicContent = <HomePage />;
  if (path === "/features") publicContent = <FeaturesPage />;
  else if (path === "/how-it-works") publicContent = <HowItWorksPage />;
  else if (path === "/use-cases") publicContent = <UseCasesPage />;
  else if (path === "/pricing") publicContent = <PricingPage />;
  else if (path === "/blog") publicContent = <BlogPage />;
  else if (path === "/contact") publicContent = <ContactPage />;
  else if (path === "/sign-in") publicContent = <SignInPage />;
  else if (path === "/sign-up") publicContent = <SignUpPage />;
  else if (path === "/terms") publicContent = <TermsPage />;
  else if (path === "/privacy") publicContent = <PrivacyPage />;
  else if (path === "/commercial-rights") publicContent = <CommercialRightsPage />;
  else if (path === "/security") publicContent = <SecurityPage />;
  else if (path === "/cookies") publicContent = <CookiesPage />;
  else if (path === "/status") publicContent = <StatusPage />;
  else if (path !== "/") publicContent = <NotFoundPage />;

  return (
    <PublicLayout>
      <Suspense fallback={<LoadingState message="Loading page..." className="py-20" />}>
        {publicContent}
      </Suspense>
    </PublicLayout>
  );
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
