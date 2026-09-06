import React, { useState, useEffect } from "react";
import { Link, useRouter } from "../../router/Router";
import { ScenoraLogo } from "../../components/brand/ScenoraLogo";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Feedback";
import { useAuth } from "../../context/AuthContext";
import { ArrowRight, Mail, Lock, User as UserIcon } from "lucide-react";

export const SignUpPage: React.FC = () => {
  const { navigate, searchParams } = useRouter();
  const { signUpWithEmail, signInWithGoogle, isAuthenticated, isConfigured, error: authError, clearError } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const returnUrl = searchParams.get("returnUrl") || "/app";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnUrl);
    }
  }, [isAuthenticated, navigate, returnUrl]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Client-side validations
    if (!email.trim() || !password) {
      setLocalError("Please enter your email and choose a password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signUpWithEmail(email.trim(), password, name.trim());
      navigate(returnUrl);
    } catch (err: any) {
      setLocalError(err?.message || "Sign up failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      navigate(returnUrl);
    } catch (err: any) {
      setLocalError(err?.message || "Google sign in was cancelled or failed.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <ScenoraLogo size="lg" className="justify-center mb-3" />
          <h2 className="text-xl font-bold font-display text-[var(--color-text)]">
            Create your ScenoraEdits Account
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Start directing AI-consistent scenes, timelines, and multi-angle videos.
          </p>
        </div>

        <Card variant="default" className="p-6 sm:p-8 shadow-[var(--shadow-card)]">
          {!isConfigured && (
            <Alert type="warning" className="mb-5" title="Firebase Setup Needed">
              Real account creation requires Firebase keys in <code className="font-mono text-[10px]">frontend/.env</code>.
            </Alert>
          )}

          {displayError && (
            <Alert type="error" className="mb-5" title="Registration Error" onDismiss={() => { setLocalError(null); clearError(); }}>
              {displayError}
            </Alert>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              id="signup-name"
              placeholder="Samuel Creator"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftElement={<UserIcon size={16} />}
            />

            <Input
              label="Email Address"
              type="email"
              id="signup-email"
              placeholder="creator@scenoraedits.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftElement={<Mail size={16} />}
              required
            />

            <Input
              label="Password"
              type="password"
              id="signup-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftElement={<Lock size={16} />}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              id="signup-confirm-password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftElement={<Lock size={16} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight size={14} />}
            >
              Create Account
            </Button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border-subtle)]" />
            </div>
            <span className="relative px-3 bg-[var(--color-card)] text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">
              Or continue with
            </span>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full"
            isLoading={isGoogleSubmitting}
            onClick={handleGoogleSignIn}
            leftIcon={
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            }
          >
            Google
          </Button>

          <div className="mt-6 pt-5 border-t border-[var(--color-border-subtle)] text-center text-xs text-[var(--color-text-secondary)]">
            Already have an account?{" "}
            <Link
              to={`/sign-in${returnUrl !== "/app" ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`}
              className="text-[var(--color-primary)] font-bold hover:underline"
            >
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
