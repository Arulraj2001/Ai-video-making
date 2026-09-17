import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const exportModalSource = await readFile(new URL("../src/components/timeline/ExportModal.tsx", import.meta.url), "utf8");
const timelineEditorSource = await readFile(new URL("../src/components/timeline/TimelineEditor.tsx", import.meta.url), "utf8");

test("Stage 5 ExportModal uses non-blocking UI without browser alert() or confirm()", () => {
  assert.doesNotMatch(exportModalSource, /\balert\(/, "ExportModal must not use blocking window.alert");
  assert.doesNotMatch(exportModalSource, /\bconfirm\(/, "ExportModal must not use blocking window.confirm");
  assert.match(exportModalSource, /jobToDeleteId/, "ExportModal must use inline state for delete confirmation");
  assert.match(exportModalSource, /setErrorMsg\(/, "ExportModal must use non-blocking error notification state");
});

test("Stage 4 TimelineEditor provides auto-align and non-blocking toast notifications", () => {
  assert.doesNotMatch(timelineEditorSource, /\balert\(/, "TimelineEditor must not use blocking window.alert");
  assert.match(timelineEditorSource, /handleAutoAlign/, "TimelineEditor must have auto-align tool");
  assert.match(timelineEditorSource, /contiguityIssues/, "TimelineEditor must detect timing gaps and overlaps");
});
