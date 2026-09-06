import React from "react";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useRouter } from "../../router/Router";
import { useAuth } from "../../context/AuthContext";

export const AdminAccessDenied: React.FC = () => {
  const { navigate } = useRouter();
  const { user, signOutUser } = useAuth();

  const handleSignOut = async () => {
    await signOutUser();
    navigate("/sign-in");
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card variant="default" className="max-w-lg w-full p-8 text-center shadow-[var(--shadow-lg)] border-[var(--color-error)] border-opacity-30">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--color-error-subtle)] text-[var(--color-error)] flex items-center justify-center shadow-sm">
          <ShieldAlert size={32} />
        </div>

        <h2 className="text-xl font-bold font-display text-[var(--color-text)]">
          Access Denied
        </h2>
        
        <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
          The administration portal is strictly reserved for authorized administrator accounts.
        </p>

        {user && (
          <div className="my-5 p-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-xs">
            <span className="text-[var(--color-text-muted)]">Signed in as: </span>
            <span className="font-semibold text-[var(--color-text)] font-mono">{user.email}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <Button
            variant="primary"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate("/app")}
          >
            Back to Creator App
          </Button>

          <Button
            variant="secondary"
            leftIcon={<LogOut size={16} />}
            onClick={handleSignOut}
          >
            Switch Account
          </Button>
        </div>
      </Card>
    </div>
  );
};
