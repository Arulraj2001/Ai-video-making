import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const exportCaptionsModalSource = await readFile(
  new URL("../src/components/storyboard/ExportCaptionsModal.tsx", import.meta.url),
  "utf8"
);
const exportPromptsModalSource = await readFile(
  new URL("../src/components/storyboard/ExportPromptsModal.tsx", import.meta.url),
  "utf8"
);
const bulkImportModalSource = await readFile(
  new URL("../src/components/storyboard/BulkImportModal.tsx", import.meta.url),
  "utf8"
);
const storyboardHeaderSource = await readFile(
  new URL("../src/components/storyboard/StoryboardHeader.tsx", import.meta.url),
  "utf8"
);
const storyboardViewSource = await readFile(
  new URL("../src/components/storyboard/StoryboardView.tsx", import.meta.url),
  "utf8"
);
const timelineEditorSource = await readFile(
  new URL("../src/components/timeline/TimelineEditor.tsx", import.meta.url),
  "utf8"
);

test("ExportCaptionsModal provides timed text, SRT subtitles, and clean script exports", () => {
  assert.doesNotMatch(exportCaptionsModalSource, /\balert\(/, "Must not use blocking alert");
  assert.doesNotMatch(exportCaptionsModalSource, /\bconfirm\(/, "Must not use blocking confirm");
  assert.match(exportCaptionsModalSource, /timed_txt/, "Supports timed text format");
  assert.match(exportCaptionsModalSource, /srt/, "Supports SubRip SRT format");
  assert.match(exportCaptionsModalSource, /clean_txt/, "Supports clean script format");
  assert.match(exportCaptionsModalSource, /exportTimelineCaptions/, "Calls api.exportTimelineCaptions");
  assert.match(exportCaptionsModalSource, /navigator\.clipboard\.writeText/, "Supports 1-click clipboard copy");
});

test("ExportPromptsModal formats prompts for Midjourney, ComfyUI/Leonardo, and CSV", () => {
  assert.doesNotMatch(exportPromptsModalSource, /\balert\(/, "Must not use blocking alert");
  assert.doesNotMatch(exportPromptsModalSource, /\bconfirm\(/, "Must not use blocking confirm");
  assert.match(exportPromptsModalSource, /midjourney/, "Supports Midjourney prompt format");
  assert.match(exportPromptsModalSource, /comfyui/, "Supports ComfyUI / Leonardo list format");
  assert.match(exportPromptsModalSource, /csv/, "Supports CSV spreadsheet format");
  assert.match(exportPromptsModalSource, /exportSystemPrompts/, "Calls api.exportSystemPrompts");
  assert.match(exportPromptsModalSource, /navigator\.clipboard\.writeText/, "Supports 1-click clipboard copy");
});

test("BulkImportModal enforces Pro gating and handles multi-file and ZIP uploads safely", () => {
  assert.doesNotMatch(bulkImportModalSource, /\balert\(/, "Must not use blocking alert");
  assert.doesNotMatch(bulkImportModalSource, /\bconfirm\(/, "Must not use blocking confirm");
  assert.match(bulkImportModalSource, /getCurrentEntitlement/, "Verifies user entitlement status");
  assert.match(bulkImportModalSource, /isPro/, "Checks user Pro or Admin status");
  assert.match(bulkImportModalSource, /\.zip/i, "Supports .zip archive file handling");
  assert.match(bulkImportModalSource, /bulkImportSceneImages/, "Calls api.bulkImportSceneImages");
  assert.match(bulkImportModalSource, /matched_count/, "Displays match count confirmation");
});

test("Storyboard and Timeline both integrate the 3 dedicated workflow buttons and modals", () => {
  assert.match(storyboardHeaderSource, /onOpenExportCaptions/, "StoryboardHeader has onOpenExportCaptions prop");
  assert.match(storyboardHeaderSource, /onOpenExportPrompts/, "StoryboardHeader has onOpenExportPrompts prop");
  assert.match(storyboardHeaderSource, /onOpenBulkImport/, "StoryboardHeader has onOpenBulkImport prop");

  assert.match(storyboardViewSource, /ExportCaptionsModal/, "StoryboardView renders ExportCaptionsModal");
  assert.match(storyboardViewSource, /ExportPromptsModal/, "StoryboardView renders ExportPromptsModal");
  assert.match(storyboardViewSource, /BulkImportModal/, "StoryboardView renders BulkImportModal");

  assert.match(timelineEditorSource, /ExportCaptionsModal/, "TimelineEditor renders ExportCaptionsModal");
  assert.match(timelineEditorSource, /ExportPromptsModal/, "TimelineEditor renders ExportPromptsModal");
  assert.match(timelineEditorSource, /BulkImportModal/, "TimelineEditor renders BulkImportModal");
  assert.match(timelineEditorSource, /timeline-bulk-import-btn/, "Timeline toolbar contains bulk import trigger button");
});
