import test from "node:test";
import assert from "node:assert";

// 1. Auth error formatting test logic
function formatAuthError(error) {
  if (!error) return "An unexpected error occurred. Please try again.";
  let code = typeof error === "string" ? error : error.code || "";
  if (!code && typeof error.message === "string") {
    const match = error.message.match(/auth\/[a-z0-9-]+/i);
    if (match) {
      code = match[0].toLowerCase();
    }
  }
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

// 2. Client-side form validations
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).trim());
}

function validatePassword(password, confirmPassword) {
  if (!password || password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters long." };
  }
  if (password !== confirmPassword) {
    return { valid: false, error: "Passwords do not match. Please re-enter." };
  }
  return { valid: true, error: null };
}

// 3. Admin recognition helper
function isAdministrator(userEmail, configuredAdminEmail = "admin@scenoraedits.com") {
  if (!userEmail) return false;
  return userEmail.trim().toLowerCase() === configuredAdminEmail.trim().toLowerCase();
}

// 4. Return URL resolver
function resolveReturnUrl(searchParams, defaultUrl = "/app") {
  const returnUrl = searchParams.get("returnUrl");
  if (!returnUrl) return defaultUrl;
  try {
    const decoded = decodeURIComponent(returnUrl);
    return decoded.startsWith("/") ? decoded : defaultUrl;
  } catch {
    return defaultUrl;
  }
}

// TESTS: Error Formatting
test("formatAuthError correctly translates credential errors", () => {
  assert.strictEqual(
    formatAuthError({ code: "auth/invalid-credential" }),
    "Invalid email or password. Please check your credentials."
  );
  assert.strictEqual(
    formatAuthError("auth/wrong-password"),
    "Invalid email or password. Please check your credentials."
  );
  assert.strictEqual(
    formatAuthError({ code: "auth/user-not-found" }),
    "Invalid email or password. Please check your credentials."
  );
});

test("formatAuthError correctly translates duplicate email error", () => {
  assert.strictEqual(
    formatAuthError({ code: "auth/email-already-in-use" }),
    "An account with this email already exists. Try signing in instead."
  );
});

test("formatAuthError handles weak password, popup blockers, and network errors", () => {
  assert.strictEqual(
    formatAuthError({ code: "auth/weak-password" }),
    "Password must be at least 6 characters long."
  );
  assert.strictEqual(
    formatAuthError({ code: "auth/popup-blocked" }),
    "The sign-in popup was blocked by your browser. Please allow popups for this site and try again."
  );
  assert.strictEqual(
    formatAuthError({ code: "auth/popup-closed-by-user" }),
    "Google sign-in was closed before completion."
  );
  assert.strictEqual(
    formatAuthError({ code: "auth/network-request-failed" }),
    "Network connection error. Please check your internet connection."
  );
});

test("formatAuthError provides safe fallback for unknown errors", () => {
  assert.strictEqual(
    formatAuthError(null),
    "An unexpected error occurred. Please try again."
  );
  assert.strictEqual(
    formatAuthError({ code: "auth/unknown-error-code", message: "Firebase: Error (auth/unknown-error-code)." }),
    "An unexpected authentication error occurred. Please try again."
  );
});

// TESTS: Validation
test("validateEmail accepts valid emails and rejects invalid ones", () => {
  assert.strictEqual(validateEmail("creator@scenoraedits.com"), true);
  assert.strictEqual(validateEmail("user.name+tag@sub.domain.org"), true);
  assert.strictEqual(validateEmail("invalid-email"), false);
  assert.strictEqual(validateEmail("missing@domain"), false);
  assert.strictEqual(validateEmail("@nodomain.com"), false);
  assert.strictEqual(validateEmail("   "), false);
});

test("validatePassword enforces min length and match", () => {
  assert.strictEqual(validatePassword("12345", "12345").valid, false);
  assert.strictEqual(validatePassword("123456", "123457").valid, false);
  assert.strictEqual(validatePassword("validPass123", "validPass123").valid, true);
});

// TESTS: Admin Recognition
test("isAdministrator matches admin case-insensitively", () => {
  assert.strictEqual(isAdministrator("admin@scenoraedits.com"), true);
  assert.strictEqual(isAdministrator("ADMIN@SCENORAEDITS.COM"), true);
  assert.strictEqual(isAdministrator("Admin@ScenoraEdits.com "), true);
  assert.strictEqual(isAdministrator("creator@scenoraedits.com"), false);
  assert.strictEqual(isAdministrator(null), false);
  assert.strictEqual(isAdministrator(""), false);
});

// TESTS: ReturnUrl resolution
test("resolveReturnUrl resolves correctly with safe fallbacks", () => {
  const params1 = new URLSearchParams("returnUrl=%2Fapp%2Fstudio%2Fproj_123");
  assert.strictEqual(resolveReturnUrl(params1), "/app/studio/proj_123");

  const params2 = new URLSearchParams("");
  assert.strictEqual(resolveReturnUrl(params2), "/app");

  const params3 = new URLSearchParams("returnUrl=https%3A%2F%2Fexternal-evil.com");
  assert.strictEqual(resolveReturnUrl(params3), "/app");
});
