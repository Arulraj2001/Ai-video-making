import { ErrorBoundary } from "./components/ErrorBoundary";
import { DashboardPage } from "./pages/DashboardPage";

export function App() {
  return (
    <ErrorBoundary>
      <DashboardPage />
    </ErrorBoundary>
  );
}

export default App;
