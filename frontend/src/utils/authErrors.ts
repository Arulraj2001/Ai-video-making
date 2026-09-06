/**
 * Map Firebase Auth error codes to user-friendly, non-technical error messages.
 */
export function formatAuthError(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  // Handle standard Firebase error code property
  let code = typeof error === "string" ? error : error.code || "";

  // If code is not set directly, try extracting from error.message like (auth/xyz)
  if (!code && typeof error.message === "string") {
    const match = error.message.match(/auth\/[a-z0-9-]+/i);
    if (match) {
      code = match[0].toLowerCase();
    }
  }

  // Also check if message contains OPERATION_NOT_ALLOWED
  if (!code && typeof error.message === "string" && error.message.includes("OPERATION_NOT_ALLOWED")) {
    code = "auth/operation-not-allowed";
  }

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password. Please check your credentials.";

    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";

    case "auth/weak-password":
      return "Password must be at least 6 characters long.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before completion.";

    case "auth/popup-blocked":
      return "The sign-in popup was blocked by your browser. Please allow popups for this site and try again.";

    case "auth/cancelled-popup-request":
      return "Sign-in popup was cancelled because another one was initiated.";

    case "auth/unauthorized-domain":
      return "This domain is not authorized for authentication. Please add localhost or your current domain in Firebase Console under Authentication > Settings > Authorized domains.";

    case "auth/network-request-failed":
      return "Network connection error. Please check your internet connection.";

    case "auth/too-many-requests":
      return "Access to this account has been temporarily disabled due to many failed login attempts. Try again later or reset your password.";

    case "auth/user-disabled":
      return "This creator account has been disabled. Please contact support.";

    case "auth/operation-not-allowed":
    case "auth/configuration-not-found":
      return "Google sign-in is not enabled yet in your Firebase project. Please enable Google in Firebase Console under Authentication > Sign-in method.";

    case "auth/requires-recent-login":
      return "This operation requires recent authentication. Please sign in again.";

    default:
      if (typeof error.message === "string" && error.message.length > 0 && !error.message.includes("Firebase:")) {
        return error.message;
      }
      return "An unexpected authentication error occurred. Please try again.";
  }
}
