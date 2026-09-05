import test from "node:test";
import assert from "node:assert";

// Basic formatting logic verification
function formatDate(isoString) {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Unknown date";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return isoString;
  }
}

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

test("formatDate formats ISO string cleanly", () => {
  const formatted = formatDate("2026-09-04T12:00:00Z");
  assert.ok(formatted.includes("Sep 4"));
});

test("formatDate handles invalid date gracefully", () => {
  assert.strictEqual(formatDate("invalid-date"), "Unknown date");
});

test("truncateText truncates longer strings with ellipsis", () => {
  assert.strictEqual(truncateText("Hello World", 5), "Hello...");
  assert.strictEqual(truncateText("Short", 10), "Short");
});
