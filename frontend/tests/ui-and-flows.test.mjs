import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "..");

test("1. FeaturesPage & BlogPage CSS and JSX classes are aligned", () => {
  const featCss = fs.readFileSync(path.join(frontendDir, "src/pages/public/FeaturesPage.css"), "utf-8");
  const featTsx = fs.readFileSync(path.join(frontendDir, "src/pages/public/FeaturesPage.tsx"), "utf-8");
  const blogCss = fs.readFileSync(path.join(frontendDir, "src/pages/public/BlogPage.css"), "utf-8");
  const blogTsx = fs.readFileSync(path.join(frontendDir, "src/pages/public/BlogPage.tsx"), "utf-8");

  // Features FAQ Box & Button classes
  assert.ok(featCss.includes(".feat-faq-box"), "feat-faq-box should be in FeaturesPage.css");
  assert.ok(featCss.includes(".feat-faq-btn"), "feat-faq-btn should be in FeaturesPage.css");
  assert.ok(featCss.includes(".feat-faq-content"), "feat-faq-content should be in FeaturesPage.css");
  assert.ok(featCss.includes(".feat-bottom-card"), "feat-bottom-card should be in FeaturesPage.css");

  // Blog Search Bar, Category Pills, Newsletter & FAQ classes
  assert.ok(blogCss.includes(".blog-search-bar"), "blog-search-bar should be in BlogPage.css");
  assert.ok(blogCss.includes(".blog-categories-pill-row"), "blog-categories-pill-row should be in BlogPage.css");
  assert.ok(blogCss.includes(".blog-cat-pill"), "blog-cat-pill should be in BlogPage.css");
  assert.ok(blogCss.includes(".blog-nl-card"), "blog-nl-card should be in BlogPage.css");
  assert.ok(blogCss.includes(".blog-nl-btn"), "blog-nl-btn should be in BlogPage.css");
  assert.ok(blogCss.includes(".blog-faq-list"), "blog-faq-list should be in BlogPage.css");
  assert.ok(blogCss.includes(".blog-faq-question"), "blog-faq-question should be in BlogPage.css");

  // BlogPage.tsx no longer uses unimported feat-faq classes
  assert.ok(!blogTsx.includes('className="feat-faq-item"'), "BlogPage should not use feat-faq-item");
  assert.ok(!blogTsx.includes('className="feat-faq-btn"'), "BlogPage should not use feat-faq-btn");
  assert.ok(blogTsx.includes('className="blog-faq-item"'), "BlogPage should use blog-faq-item");
  assert.ok(blogTsx.includes('className="blog-faq-question"'), "BlogPage should use blog-faq-question");
});

test("2. Marketing Pricing Page connects directly to Admin / Firestore live without static fallback", () => {
  const pricingTsx = fs.readFileSync(path.join(frontendDir, "src/pages/public/PricingPage.tsx"), "utf-8");
  const adminPricingTsx = fs.readFileSync(path.join(frontendDir, "src/pages/admin/AdminPricingPage.tsx"), "utf-8");
  const firestoreRules = fs.readFileSync(path.join(frontendDir, "../firestore.rules"), "utf-8");

  // PricingPage imports db and listens via onSnapshot
  assert.ok(pricingTsx.includes('import { db } from "../../lib/firebase";'), "PricingPage imports db");
  assert.ok(pricingTsx.includes("onSnapshot("), "PricingPage attaches live onSnapshot listener");
  assert.ok(pricingTsx.includes('doc(firestore, "platform", "config")'), "PricingPage listens to platform/config");

  // AdminPricingPage updates Firestore platform/config directly
  assert.ok(adminPricingTsx.includes('import { db } from "../../lib/firebase";'), "AdminPricingPage imports db");
  assert.ok(adminPricingTsx.includes('setDoc(doc(firestore, "platform", "config"), payload'), "Admin writes to platform/config");

  // Firestore rules allow public read of platform/config
  assert.ok(firestoreRules.includes("match /platform/config {"), "Rules match /platform/config");
  assert.ok(firestoreRules.includes("allow read: if true;"), "Rules allow public read of platform/config");
});

test("3. Studio Project Creation starts explicitly on Stage 1 (Script & Audio)", () => {
  const appContext = fs.readFileSync(path.join(frontendDir, "src/context/AppContext.tsx"), "utf-8");
  const studioPage = fs.readFileSync(path.join(frontendDir, "src/pages/app/StudioPage.tsx"), "utf-8");
  const appLayout = fs.readFileSync(path.join(frontendDir, "src/layouts/AppLayout.tsx"), "utf-8");
  const createProjPage = fs.readFileSync(path.join(frontendDir, "src/pages/app/CreateProjectPage.tsx"), "utf-8");

  // AppContext resets stage upon createProject
  assert.ok(appContext.includes('setActiveStageState("script")'), "AppContext sets activeStageState to script on project creation");

  // StudioPage enforces Stage 1 for projects with 0 scenes
  assert.ok(studioPage.includes("(!activeProject.scenes || activeProject.scenes.length === 0)"), "StudioPage checks for 0-scene projects");
  assert.ok(studioPage.includes('setActiveStage("script")'), "StudioPage sets stage to script for 0-scene projects");

  // AppLayout and CreateProjectPage navigate with explicit stage=script
  assert.ok(appLayout.includes("stage=script"), "AppLayout navigates with ?stage=script");
  assert.ok(createProjPage.includes("stage=script"), "CreateProjectPage navigates with ?stage=script");
});

test("4. ExportModal Lightbox contrast & readability", () => {
  const exportModal = fs.readFileSync(path.join(frontendDir, "src/components/timeline/ExportModal.tsx"), "utf-8");

  // Rendering in progress text uses theme-adaptive high contrast
  assert.ok(exportModal.includes("var(--text-primary)"), "ExportModal uses var(--text-primary)");
  assert.ok(!exportModal.includes('color: "#fff",\n                  }\n                >\n                  {activeJob.stage'), "No hardcoded white activeJob.stage text");
  assert.ok(!exportModal.includes('color: "#e2e8f0", fontWeight: 500 }}>\n                  You can safely close this window'), "No low contrast reassurance text");
  assert.ok(exportModal.includes("Render Complete!"), "Render complete banner present");
  assert.ok(!exportModal.includes('color: "#a7f3d0"'), "No pale mint text in completed state");
});

test("5. Stage 4 Ken Burns Scene Motion & Live Player Preview", () => {
  const timelineEditor = fs.readFileSync(path.join(frontendDir, "src/components/timeline/TimelineEditor.tsx"), "utf-8");
  const cinemaPreview = fs.readFileSync(path.join(frontendDir, "src/components/timeline/CinemaPreview.tsx"), "utf-8");
  const canvasSettings = fs.readFileSync(path.join(frontendDir, "src/components/timeline/settings/CanvasSettingsPanel.tsx"), "utf-8");
  const exportModal = fs.readFileSync(path.join(frontendDir, "src/components/timeline/ExportModal.tsx"), "utf-8");

  // TimelineEditor toolbar button
  assert.ok(timelineEditor.includes("timeline-ken-burns-btn"), "TimelineEditor has Ken Burns toggle button");
  assert.ok(timelineEditor.includes("handleToggleKenBurns"), "TimelineEditor has handleToggleKenBurns");

  // CinemaPreview live preview
  assert.ok(cinemaPreview.includes("isKenBurnsGlobal"), "CinemaPreview checks isKenBurnsGlobal");
  assert.ok(cinemaPreview.includes("cinema-ken-burns-live-badge"), "CinemaPreview has live Ken Burns HUD badge");
  assert.ok(cinemaPreview.includes("KB_EFFECTS"), "CinemaPreview cycles through 5 Ken Burns motion variants");

  // CanvasSettingsPanel
  assert.ok(canvasSettings.includes("canvas-ken-burns-card"), "CanvasSettingsPanel has Ken Burns settings card");
  assert.ok(canvasSettings.includes("handleToggleMotionPreset"), "CanvasSettingsPanel can toggle motion preset");

  // ExportModal initialized from project
  assert.ok(exportModal.includes("project.canvas_settings?.motion_preset === \"ken_burns\""), "ExportModal syncs kenBurnsEnabled from Stage 4");
});

