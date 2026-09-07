import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--surface)] text-[var(--text)]">
          <div className="glass-panel p-8 max-w-md w-full text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-lg font-bold mb-2 font-display" style={{ color: "var(--text-primary)" }}>Something went wrong</h2>
            <p className="text-xs mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {this.state.error?.message || "An unexpected error occurred in the UI."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary text-xs mx-auto"
            >
              <RefreshCw size={13} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
