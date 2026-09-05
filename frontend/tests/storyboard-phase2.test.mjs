import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const storyboardSource = await readFile(new URL("../src/components/storyboard/StoryboardView.tsx", import.meta.url), "utf8");
const dashboardSource = await readFile(new URL("../src/pages/DashboardPage.tsx", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../src/index.css", import.meta.url), "utf8");

test("StoryboardView has distinct compact presentation and project aspect thumbnails", () => {
  assert.match(storyboardSource, /viewLayout === "compact"/);
  assert.match(storyboardSource, /storyboard-scene-grid/);
  assert.match(storyboardSource, /aspectRatio: projectAspectRatio\.replace/);
  assert.match(stylesSource, /\.storyboard-scene-card\.is-compact/);
});

test("Stage 3 navigation persists and restores the stage query parameter", () => {
  assert.match(dashboardSource, /URLSearchParams\(window\.location\.search\)/);
  assert.match(dashboardSource, /url\.searchParams\.set\("stage", stage\)/);
  assert.match(dashboardSource, /window\.addEventListener\("popstate"/);
});

test("Stage 3 uses non-blocking inline errors instead of browser alerts", () => {
  assert.doesNotMatch(storyboardSource, /\balert\(/);
  assert.match(storyboardSource, /setError\(/);
});
