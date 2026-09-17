import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(frontendDir, "..");

test("Phase 1: index.html Technical SEO & Structured Data", () => {
  const indexHtml = fs.readFileSync(path.join(frontendDir, "index.html"), "utf-8");

  // Title & Description
  assert.ok(
    indexHtml.includes("Turn Your Audio Into a Scene-by-Scene Video"),
    "Title must emphasize audio to scene-by-scene video"
  );
  assert.ok(
    indexHtml.includes("Upload your voiceover and assign one image to each scene"),
    "Meta description must match exact positioning"
  );

  // Social OpenGraph & Twitter
  assert.ok(indexHtml.includes('property="og:title"'), "OG title present");
  assert.ok(indexHtml.includes("https://scenoraedits.web.app/og-image.png"), "OG image points to PNG");
  assert.ok(indexHtml.includes('name="twitter:card" content="summary_large_image"'), "Large summary twitter card present");

  // JSON-LD SoftwareApplication Schema
  assert.ok(indexHtml.includes('"@type": "SoftwareApplication"'), "SoftwareApplication schema present");
  assert.ok(indexHtml.includes('"name": "ScenoraEdits"'), "Schema name is ScenoraEdits");
  assert.ok(indexHtml.includes("Scene-by-scene image assignment"), "Feature list includes scene-by-scene assignment");
  assert.ok(indexHtml.includes("Video Bible visual consistency engine"), "Feature list includes Video Bible");
});

test("Phase 1: robots.txt and sitemap.xml Configuration", () => {
  const robotsTxt = fs.readFileSync(path.join(frontendDir, "public", "robots.txt"), "utf-8");
  const sitemapXml = fs.readFileSync(path.join(frontendDir, "public", "sitemap.xml"), "utf-8");

  // Robots rules
  assert.ok(robotsTxt.includes("Disallow: /app/"), "Robots disallows private app routes");
  assert.ok(robotsTxt.includes("Disallow: /admin/"), "Robots disallows admin routes");
  assert.ok(robotsTxt.includes("Disallow: /api/"), "Robots disallows api routes");
  assert.ok(robotsTxt.includes("Allow: /use-cases"), "Robots allows /use-cases");
  assert.ok(robotsTxt.includes("Sitemap: https://scenoraedits.web.app/sitemap.xml"), "Robots references sitemap");

  // Sitemap URLs
  assert.ok(sitemapXml.includes("https://scenoraedits.web.app/"), "Sitemap includes root");
  assert.ok(sitemapXml.includes("https://scenoraedits.web.app/features"), "Sitemap includes features");
  assert.ok(sitemapXml.includes("https://scenoraedits.web.app/how-it-works"), "Sitemap includes how-it-works");
  assert.ok(sitemapXml.includes("https://scenoraedits.web.app/use-cases"), "Sitemap includes use-cases");
  assert.ok(sitemapXml.includes("https://scenoraedits.web.app/blog"), "Sitemap includes blog");
});

test("Phase 1: Social Preview OG Image PNG Exists", () => {
  const ogImagePath = path.join(frontendDir, "public", "og-image.png");
  assert.ok(fs.existsSync(ogImagePath), "og-image.png exists");
  const stats = fs.statSync(ogImagePath);
  assert.ok(stats.size > 10000, `og-image.png size must be > 10KB (was ${stats.size} bytes)`);
});

test("Phase 2: HomePage.tsx Category & Headline Positioning", () => {
  const homePage = fs.readFileSync(
    path.join(frontendDir, "src", "pages", "public", "HomePage.tsx"),
    "utf-8"
  );

  assert.ok(homePage.includes("SCENE-BASED VIDEO COMPOSER"), "Badge has SCENE-BASED VIDEO COMPOSER");
  assert.ok(homePage.includes("Bring your audio."), "Hero headline part 1 matches");
  assert.ok(homePage.includes("Assign your images."), "Hero headline part 2 matches");
  assert.ok(homePage.includes("Export your video."), "Hero headline part 3 matches");
  assert.ok(
    homePage.includes("Build my video free"),
    "Primary CTA matches positioning"
  );
  assert.ok(homePage.includes("Faceless YouTube Creators"), "Creator archetype 1 present");
  assert.ok(homePage.includes("Podcast-to-Video"), "Creator archetype 2 present");
  assert.ok(homePage.includes("AI Image Artists"), "Creator archetype 3 present");
});

test("Phase 3: FeaturesPage, HowItWorksPage & UseCasesPage Implementation", () => {
  const featuresPage = fs.readFileSync(
    path.join(frontendDir, "src", "pages", "public", "FeaturesPage.tsx"),
    "utf-8"
  );
  const howItWorksPage = fs.readFileSync(
    path.join(frontendDir, "src", "pages", "public", "HowItWorksPage.tsx"),
    "utf-8"
  );
  const useCasesPage = fs.readFileSync(
    path.join(frontendDir, "src", "pages", "public", "UseCasesPage.tsx"),
    "utf-8"
  );
  const appTsx = fs.readFileSync(path.join(frontendDir, "src", "App.tsx"), "utf-8");
  const publicLayout = fs.readFileSync(
    path.join(frontendDir, "src", "layouts", "PublicLayout.tsx"),
    "utf-8"
  );

  // Features 6 Pillars
  assert.ok(featuresPage.includes("Scene-Level Image Assignment"), "Pillar 1 present");
  assert.ok(featuresPage.includes("Bring Your Own API Key (BYOK)"), "Pillar 2 present");
  assert.ok(featuresPage.includes("Video Bible™ Visual Consistency Engine"), "Pillar 3 present");
  assert.ok(featuresPage.includes("Motion, Captions &amp; Audio Ducking"), "Pillar 4 present");
  assert.ok(featuresPage.includes("Multi-Format Single-Pass Export"), "Pillar 5 present");
  assert.ok(featuresPage.includes("Zero-Drift FFmpeg Render Pipeline"), "Pillar 6 present");

  // How It Works 5 Stages
  assert.ok(howItWorksPage.includes("Stage 01 • Script &amp; Audio Ingestion • Est. Time: ~2 Mins"), "Stage 1 present");
  assert.ok(howItWorksPage.includes("Stage 02 • Visual Identity &amp; Characters • Est. Time: ~5 Mins"), "Stage 2 present");
  assert.ok(howItWorksPage.includes("Stage 03 • Storyboard &amp; Images • Est. Time: ~10–30 Mins"), "Stage 3 present");
  assert.ok(howItWorksPage.includes("Stage 04 • Motion, Captions &amp; Audio • Est. Time: ~10–20 Mins"), "Stage 4 present");
  assert.ok(howItWorksPage.includes("Stage 05 • Master Export • Est. Time: ~1–5 Mins"), "Stage 5 present");

  // UseCases Page Content & Routing
  assert.ok(useCasesPage.includes("Faceless YouTube Channels"), "Use cases includes Faceless YouTube");
  assert.ok(useCasesPage.includes("Podcast-to-Video Conversions"), "Use cases includes Podcasts");
  assert.ok(useCasesPage.includes("AI Image Artists & Storytellers"), "Use cases includes AI Artists");
  assert.ok(useCasesPage.includes("Explainer & Educational Creators"), "Use cases includes Explainers");
  assert.ok(appTsx.includes('path === "/use-cases"'), "App.tsx routes /use-cases");
  assert.ok(publicLayout.includes('to: "/use-cases"'), "PublicLayout links /use-cases");
});

test("Phase 4: BlogPage 5 Comprehensive Creator Guides", () => {
  const blogPage = fs.readFileSync(
    path.join(frontendDir, "src", "pages", "public", "BlogPage.tsx"),
    "utf-8"
  );

  assert.ok(
    blogPage.includes("How to Make a Faceless YouTube Video Using AI Images in 2026 (Free)"),
    "Article 1 present"
  );
  assert.ok(
    blogPage.includes("How to Turn a Podcast Episode into a YouTube Video (Free)"),
    "Article 2 present"
  );
  assert.ok(
    blogPage.includes("Best Free Tools to Combine Images and Audio Into a Video in 2026"),
    "Article 3 present"
  );
  assert.ok(
    blogPage.includes("How to Use Your Own API Key to Generate AI Images for Video (BYOK Guide)"),
    "Article 4 present"
  );
  assert.ok(
    blogPage.includes("What is a Video Bible and Why It Matters for AI Video Consistency"),
    "Article 5 present"
  );
});

test("Phase 5: App UX & Conversion Upgrades", () => {
  const authContext = fs.readFileSync(
    path.join(frontendDir, "src", "context", "AuthContext.tsx"),
    "utf-8"
  );
  const signInPage = fs.readFileSync(
    path.join(frontendDir, "src", "pages", "public", "SignInPage.tsx"),
    "utf-8"
  );
  const projectsList = fs.readFileSync(
    path.join(frontendDir, "src", "pages", "app", "ProjectsListPage.tsx"),
    "utf-8"
  );
  const studioPage = fs.readFileSync(
    path.join(frontendDir, "src", "pages", "app", "StudioPage.tsx"),
    "utf-8"
  );
  const apiKeysPage = fs.readFileSync(
    path.join(frontendDir, "src", "pages", "app", "ApiKeysPage.tsx"),
    "utf-8"
  );
  const exportModal = fs.readFileSync(
    path.join(frontendDir, "src", "components", "timeline", "ExportModal.tsx"),
    "utf-8"
  );
  const helpPage = fs.readFileSync(
    path.join(frontendDir, "src", "pages", "app", "HelpPage.tsx"),
    "utf-8"
  );

  // Fix 1: Anonymous / Guest Session
  assert.ok(authContext.includes("signInAnonymouslyUser"), "AuthContext has signInAnonymouslyUser");
  assert.ok(signInPage.includes("Try Without an Account (Guest Trial)"), "SignInPage has Guest Trial CTA");

  // Fix 2: Empty State
  assert.ok(projectsList.includes("You haven't created a video yet"), "ProjectsListPage has inviting heading");
  assert.ok(projectsList.includes("Create Your First Video →"), "ProjectsListPage has creation CTA");

  // Fix 3, 4, 5: Studio Page Stepper, Auto-save, Mobile Warning
  assert.ok(studioPage.includes("Auto-saved to cloud"), "StudioPage has auto-save badge");
  assert.ok(studioPage.includes("isCompleted ?"), "StudioPage has completed checkmark logic");
  assert.ok(studioPage.includes("ScenoraEdits Studio is optimized for desktop displays"), "StudioPage has mobile warning");

  // Fix 6: API Keys Guidance & Direct Links
  assert.ok(apiKeysPage.includes("API Keys Are 100% Optional"), "ApiKeysPage has explainer hero");
  assert.ok(apiKeysPage.includes("Get your"), "ApiKeysPage has direct link to providers");

  // Fix 7: Export Modal 5-Stage Checklist & Background Assurance
  assert.ok(exportModal.includes("Preparing assets"), "ExportModal has stage 1 checklist");
  assert.ok(exportModal.includes("Rendering scene clips"), "ExportModal has stage 2 checklist");
  assert.ok(exportModal.includes("Burning captions & motion"), "ExportModal has stage 3 checklist");
  assert.ok(exportModal.includes("Mixing audio & ducking"), "ExportModal has stage 4 checklist");
  assert.ok(exportModal.includes("Finalizing export"), "ExportModal has stage 5 checklist");
  assert.ok(exportModal.includes("rendering continues in the background"), "ExportModal has reassurance note");

  // Fix 8: Keyboard Shortcuts Table
  assert.ok(helpPage.includes("Space"), "HelpPage lists Space");
  assert.ok(helpPage.includes("Ctrl + Z"), "HelpPage lists Ctrl + Z");
  assert.ok(helpPage.includes("S or C"), "HelpPage lists Split key");
});

test("Phase 6: Marketing Distribution Guide Exists", () => {
  const guidePath = path.join(repoRoot, "docs", "DISTRIBUTION_GUIDE.md");
  assert.ok(fs.existsSync(guidePath), "DISTRIBUTION_GUIDE.md exists");
  const content = fs.readFileSync(guidePath, "utf-8");
  assert.ok(content.includes("Product Hunt Launch Package"), "PH launch package present");
  assert.ok(content.includes("Reddit Community Post Templates"), "Reddit templates present");
  assert.ok(content.includes("AI Directory Submission Data"), "AI directory submissions present");
});
