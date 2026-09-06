import React, { useState, useEffect } from "react";
import { Mail, CheckCircle2, ArrowRight } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Feedback";
import { useAuth } from "../../context/AuthContext";

export interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = "",
}) => {
  const { sendPasswordReset, isConfigured } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setSuccess(false);
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen, initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await sendPasswordReset(email.trim());
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send password reset email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-[var(--color-primary)]" />
          <span>Reset Password</span>
        </div>
      }
      description="Enter the email associated with your ScenoraEdits account."
      size="sm"
    >
      {success ? (
        <div className="flex flex-col items-center text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-success-subtle)] text-[var(--color-success)] flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[var(--color-text)]">Reset Link Sent</h4>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              We've dispatched password reset instructions to <strong className="text-[var(--color-text)]">{email}</strong>. Please check your inbox and spam folder.
            </p>
          </div>
          <Button variant="primary" className="w-full mt-2" onClick={onClose}>
            Return to Sign In
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isConfigured && (
            <Alert type="warning" title="Demo Mode">
              Firebase is not connected. Provide your credentials in <code className="font-mono text-[10px]">frontend/.env</code> to dispatch real password reset emails.
            </Alert>
          )}

          {error && (
            <Alert type="error" title="Unable to send link" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Input
            label="Email Address"
            type="email"
            id="reset-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="creator@scenoraedits.com"
            leftElement={<Mail size={16} />}
            required
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={submitting}
              rightIcon={<ArrowRight size={14} />}
            >
              Send Reset Link
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
