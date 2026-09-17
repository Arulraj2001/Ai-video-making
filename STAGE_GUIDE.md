# Scenora AI Video Maker — Stage-by-Stage Production Manual

> **Living Platform Manual**: This document tracks the complete anatomy, architectural improvements, bug fixes, and operational tutorials for each stage of the Scenora SaaS video pipeline. It is updated after every stage audit and refinement.

---

## The 5-Stage Video Pipeline
1. **Stage 1: Script & Audio / Master Timeline** — Audio ingestion, Edge-TTS synthesis, sentence timecodes, and contiguous timeline locking. *(Completed & Audited)*
2. **Stage 2: Video Bible Consistency Engine** — Visual continuity for characters, locations, key props, artistic style, and prompt rules. *(Completed & Audited)*
3. **Stage 3: Visual Storyboard & AI Generation** — Scene-by-scene AI prompt synthesis, multi-provider image rendering (Flux, Cloudflare, OpenAI, Local GPU, Mock), A/B variations, and graphic cards. *(Completed & Audited)*
4. **Stage 4: Timeline Studio & Motion Engine** — Animation dynamics, camera pans/zooms, transitions, and audio-visual syncing. *(Next)*
5. **Stage 5: Export & Deliver** — High-definition MP4 rendering, captions burning, audio mixing, and delivery.

---

## Stage 1: Script & Audio / Master Timeline

### 1. Overview & Purpose
In professional AI video production, the **Master Timeline** is the foundational audio-visual clock. It divides narration into contiguous scene blocks (`SC_001`, `SC_002`, ...) with strict second-level timestamps (`start` and `end`). Every downstream stage (Video Bible entity extraction, storyboard prompt scoping, and final MP4 rendering) relies directly on the Master Timeline.

### 2. Complete Inventory of Fields & Controls

#### A. Ingestion Modal (`ImportProject.tsx`)
- **Project Name** (`input text`): Sets the title of the video project.
- **Ingest Mode Switcher** (`tabs`):
  - **Clipchamp Captions + Audio**: For creators uploading pre-recorded voiceovers and timestamped `.srt`/`.vtt` captions.
  - **Script to Voiceover (TTS)**: For creators generating narration from raw text using Microsoft Edge-TTS neural voices.
- **Clipchamp Captions Input** (`textarea`): Accepts exported timestamped captions (e.g., `00:00:01,000 --> 00:00:04,500`).
- **Audio File Dropzone** (`file input`): Uploads master voiceover (`.mp3`, `.wav`, `.m4a`, `.aac` up to 50MB).
- **TTS Script Textarea** (`textarea`): Plain text script input for AI neural voice synthesis.
- **AI Voice Selector** (`dropdown`): Selects neural voices (e.g. *Guy Neural*, *Jenny Neural*, *Andrew Neural*, *Sonia Neural*).
- **Voice Rate & Pitch Sliders** (`range inputs`): Adjusts speaking pace (`-50%` to `+50%`) and tone pitch.
- **"Build Master Timeline"** (`primary button`): Submits audio/script, calculates sentence timecodes, establishes the scenes, and unlocks the workspace.

#### B. Timeline Table & Workspace (`SceneTable.tsx` & `Workspace.tsx`)
- **Contiguity Status Pill**:
  - Green (`✓ Contiguous Timeline`): All scenes transition back-to-back with 0 gaps.
  - Orange (`⚠️ Timing Issues`): Highlights detected silence gaps or audio overlaps.
- **Master Audio Player**: HTML5 audio bar to preview the full master voiceover track with file size and duration stats.
- **"Auto-Align Timestamps" Button (`Wand2`)**: 1-click healing action that automatically eliminates all timing gaps and overlaps.
- **"+ Add Scene" Button (`Plus`)**: Appends a contiguous new scene block to the end of the timeline without requiring manual timestamp math.
- **Scene Row Controls**:
  - **Scene Tag** (`SC_001`, `SC_002`): Live pulsing indicator when that scene's audio is playing.
  - **Start / End (s)**: Numerical inputs with 0.1s step precision for fine-tuning cut points.
  - **Duration (s)**: Dynamic readout of `end - start`.
  - **Caption Narration**: Editable dialogue/narration text for that scene block.
  - **Listen Button (`Play`/`Pause`)**: Plays audio strictly within that scene's time window (`start` to `end`).
  - **Edit / Save / Cancel**: Commits row modifications with toast confirmation.
  - **Delete Scene (`Trash2`)**: Deletes scene and ripples downstream timestamps forward.
- **Inline Warning Strip**: Appears between scenes if a silence gap (e.g., `1.2s silence gap`) or overlap exists, complete with an inline `Auto-align timing` shortcut.
- **"Proceed to Stage 2: Video Bible"**: Guided navigation button advancing the project to Character & Visual Consistency setup.

---

### 3. How to Use Stage 1 (Step-by-Step)

#### Step 1: Create or Ingest a Project
1. Open the project creation or import modal.
2. Enter your **Project Name**.
3. Choose your ingestion method:
   - **If you have an audio file & captions**: Select *Clipchamp Captions + Audio*, upload your audio file, and paste your timestamped captions.
   - **If you only have a script**: Select *Script to Voiceover (TTS)*, choose your preferred AI voice, adjust speech rate, and paste your script.
4. Click **"Build Master Timeline"**. The progressive indicator will display:
   - *“Synthesizing neural AI voiceover...”* &rarr; *“Analyzing speech boundaries & sentence timecodes...”* &rarr; *“Building Master Timeline scenes...”*

#### Step 2: Review and Fine-Tune Timestamps
1. Look at the top status badge. If you see `✓ Contiguous Timeline`, your timestamps are seamless.
2. If you see `⚠️ Timing Issues` (e.g. from manual edits or uneven speech pauses):
   - Review the yellow warning strips between scenes.
   - Click **"Auto-Align Timestamps"** to automatically eliminate all silence gaps in 1 click.
3. To adjust narration or split a scene's duration, click **Edit** on that row, update the start/end numbers or text, and click **Save**.
4. To listen to any specific scene's narration, click the **Listen** button on that row.
5. To append an extra scene (e.g. for an outro or extra takeaway), click **"+ Add Scene"**.

#### Step 3: Advance to Stage 2
1. Once all scenes and timestamps look accurate, click **"Proceed to Stage 2: Video Bible"** at the bottom navigation bar.

---

### 4. Stage 1 Audit & Production Upgrades Done
- **Storage Latency Bottleneck Solved**: Converted blocking Google Cloud Storage multipart uploads in `asset_storage.py` to non-blocking background threads (`ThreadPoolExecutor`). Local storage returns in **~2ms** instead of freezing the server for 3–15 seconds.
- **Progressive Feedback**: Added multi-phase progress messages during voice synthesis and upload to eliminate UI freeze perception.
- **Contiguity Diagnostics & 1-Click Healing**: Added automatic gap/overlap detection in `SceneTable.tsx` paired with backend `auto_align_scenes` in `project_service.py` and `POST /timeline/auto-align`.
- **Scene Management Endpoints**: Implemented `POST /timeline/scenes`, `POST /timeline/slides`, and `delete_scene` with ripple adjustments.

---

## Stage 2: Video Bible Consistency Engine

### 1. Overview & Purpose
Generative image models (Flux, Stable Diffusion, Imagen) suffer from **style drift**, face changes, and inconsistent wardrobe across scenes. The **Video Bible** prevents this by serving as the central continuity database:
- It defines character faces, outfits, and traits.
- It anchors environmental backdrops and lighting for locations.
- It specifies key recurring props and hero items.
- It locks in overarching cinematography (visual style, camera lens, color grade, realism level).
- It injects strict negative and positive rules into every downstream AI prompt.

---

### 2. Complete Inventory of Fields & Controls

#### A. Header Controls (`VideoBibleEditor.tsx`)
- **"AI Auto-Extract Bible" (`Sparkles`)**: Scans all script narration from Stage 1 using LLM analysis to automatically detect recurring characters, locations, props, and art tone.
- **Refresh Bible Data (`RefreshCw`)**: Re-synchronizes Bible data from server state.
- **"Inspect Prompt Context" (`Eye`)**: Opens the **Visual Context Drawer**, displaying the exact compiled prompt fragment generated by `build_visual_context()`.
- **Sub-Navigation Tabs with Badges**:
  - `Overall Style`
  - `Characters (N)`: Quantity pill showing active character count.
  - `Locations (N)`: Quantity pill showing active location count.
  - `Key Objects (N)`: Quantity pill showing active object count.
  - `Global Rules (N)`: Quantity pill showing active rule count.
- **First-Time Guidance Banner**: Displays when 0 characters/locations exist, providing a 1-click **"Auto-Extract Now"** CTA.

#### B. Overall Style Section (`OverallStyleSection.tsx`)
- **Quick-Apply Curated Style Pills**:
  - *Cinematic Film* (Photorealistic 35mm, atmospheric rim lighting)
  - *Documentary* (Available-light verité realism, 50mm natural depth)
  - *Stylized 3D Animation* (Vibrant dimensional textures, bounce lighting)
  - *2D Anime / Manga* (Cel-shaded expressive illustrated angles)
  - *Hand Drawn Sketch* (Organic pencil/ink on paper, minimal background)
  - *Vintage 1980s Film* (Warm retro tungsten, golden flares, film grain)
- **Visual Style** (`text input`): Custom style definition (e.g. *Cyberpunk Noir*, *High-Fantasy Epic*).
- **Realism Level** (`dropdown`): *Photorealistic*, *Hyperrealistic*, *Stylized 3D Animation*, *2D Anime / Manga*, *Oil Painting*, *Vintage Film Grain*.
- **Mood & Atmosphere** (`text input`): Emotional tone (e.g. *Tense, contemplative, dystopian*).
- **Lighting Treatment** (`textarea`): Detailed lighting direction (e.g. *Directional rim light, volumetric fog*).
- **Color Grading & Palette** (`textarea`): Color grading instructions (e.g. *Teal and orange, high contrast*).
- **Camera Style & Angles** (`text input`): Framing directives (e.g. *Eye-level medium shots, slow tracking push-in*).
- **Lens & Cinematography** (`text input`): Focal length and optics (e.g. *35mm anamorphic prime lens, f/1.8 shallow depth*).
- **"Save Style Settings" Button**: Persists style settings with instant visual confirmation.

#### C. Characters Section (`CharactersSection.tsx`)
- **"Add Character" Button (`Plus`)**: Opens modal to create a new character.
- **Character Modal Fields**:
  - `Name` (required): Character identity.
  - `Age Range`: Age bracket (e.g. *Late 20s*, *Middle-aged*).
  - `Appearance / Look`: Facial structure, hair, build, distinguishing marks.
  - `Clothing / Outfit`: Standard wardrobe across scenes.
  - `Personality Traits`: Temperament and expressions.
  - `Role / Description`: Narrative function.
- **Character Card**:
  - Reference photo thumbnail with upload overlay.
  - Summary of Look, Outfit, and Traits.
  - **"Upload Photo" / "Change Photo"**: Attaches a face reference image.
  - **"Remove Photo" (`X`)**: Clears reference photo without deleting the character.
  - **Edit (`Edit3`) / Delete (`Trash2`)**: Modifies or removes character.

#### D. Locations Section (`LocationsSection.tsx`)
- **"Add Location" Button (`Plus`)**: Opens modal to define an environment.
- **Location Modal Fields**:
  - `Name` (required): Place name (e.g. *Neo-Tokyo Alleyway*, *Victorian Study*).
  - `Environment`: Architectural details, climate, weather, textures.
  - `Lighting`: Ambient lighting conditions.
  - `Description`: General notes.
- **Location Card**:
  - Photo thumbnail with upload trigger.
  - Tags for Environment and Lighting.
  - **"Ref Image Active" / "Remove"**: Detaches location reference image in 1 click.
  - **Edit / Delete Buttons**: Full CRUD management.

#### E. Key Objects Section (`ObjectsSection.tsx`)
- **"Add Object" Button (`Plus`)**: Opens modal for recurring hero items.
- **Object Modal Fields**:
  - `Name` (required): Item name (e.g. *Vintage Leather Journal*, *Energy Core*).
  - `Description`: Visual features, materials, and colors.
- **Object Card**:
  - Thumbnail, upload action, 1-click reference removal, edit, and delete.

#### F. Global Rules Section (`GlobalRulesSection.tsx`)
- **Preset Rule Toggles**: 8 toggleable directives (*Cinematic*, *Realistic*, *Documentary*, *Animation*, *Historical*, *Futuristic*, *Noir*, *Anamorphic*).
- **Custom Rule Input**: Add custom negative or positive directives (e.g., *“No distorted hands or faces”*, *“Warm sunset tint on all metals”*).
- **Active Rule Tags**: Click `X` on any active badge to remove it.

#### G. Visual Context Drawer (`VisualContextDrawer.tsx`)
- Displays live output from `build_visual_context()`:
  - Full synthesized style prompt fragment.
  - Character prompt descriptors.
  - Location prompt descriptors.
  - Active rules and reference images catalog.
- **"Copy" Button**: Copies the compiled context to clipboard for testing in external AI image tools.

---

### 3. How to Use Stage 2 (Step-by-Step)

#### Step 1: Initialize Visual Continuity
1. Arrive at **Stage 2** from Stage 1.
2. If this is a new project, click **"AI Auto-Extract Bible"** (or click **"Auto-Extract Now"** in the top banner).
3. The AI scans your narration script and automatically generates:
   - Appropriate visual style & cinematography parameters.
   - Identified recurring characters with appearances and outfits.
   - Recurring locations and settings.
   - Essential negative visual rules.
4. The view automatically switches to the **Characters** tab to show your cast.

#### Step 2: Pick or Fine-Tune the Visual Style
1. Switch to the **Overall Style** tab.
2. Click any of the **Quick-Apply Curated Style Presets** (e.g., *Cinematic Film*, *Stylized 3D*, or *Anime*) to instantly set matching lens, color grading, lighting, and camera settings.
3. Optionally adjust specific fields (like *Mood* or *Color Grading*) to fit your exact creative vision.
4. Click **"Save Style Settings"**.

#### Step 3: Refine Characters & Upload Reference Photos
1. Switch to the **Characters** tab.
2. Click **Edit** on any character card to adjust appearance, clothing, or age range.
3. If you have a specific character face photo:
   - Click **"Upload Photo"** on the card and choose a `.png` or `.jpg`.
   - The photo is saved to durable cloud storage with local fast caching.
   - If you ever want to revert to pure text descriptions, click **"Remove"** next to *Ref Image Active*.
4. Click **"+ Add Character"** to add any additional characters not detected in the script.

#### Step 4: Configure Locations & Rules
1. Switch to **Locations** to review or add your project's environments.
2. Switch to **Global Rules** to enable presets like *Cinematic* or add custom rules like *“Strict 16:9 framing with no text overlays”*.
3. Click **"Inspect prompt context"** in the top header to preview the exact text block that will be passed into AI image models in Stage 3.

#### Step 5: Advance to Stage 3
1. When satisfied with your visual bible, click **"Proceed to Stage 3: Storyboard"** at the bottom navigation bar.

---

### 4. Stage 2 Audit & Production Upgrades Done
- **Stale State Sync Resolved**: Added `useEffect` in `OverallStyleSection.tsx` so that when AI Auto-Extract or project reload occurs, all style inputs update immediately.
- **Reference Image Deletion**: Added backend `delete_reference_image` in `project_service.py` and `DELETE /projects/{id}/bible/{entity_type}/{id}/reference` endpoints, paired with frontend API client methods and 1-click "Remove" buttons on character/location/object cards.
- **Markdown JSON Code Block Sanitization**: Added fence cleaning regex in `auto_extract_video_bible` so LLM responses wrapped in ` ```json ... ``` ` parse without crashing.
- **Curated Style Presets**: Added 6 one-click style presets in `OverallStyleSection.tsx` matching the backend visual style engine.
- **Tab Badges & First-Time Guidance**: Added item count badges on all tabs and an empty state banner in `VideoBibleEditor.tsx`.

---

## Stage 3: Visual Storyboard & AI Generation

### 1. Overview & Purpose
Stage 3 transforms the Master Timeline sentences and Video Bible continuity database into a living, visual storyboard:
- It compiles comprehensive, cinematic AI image prompts that combine narration context, character identities, wardrobe, location lighting, camera angles, and negative rules.
- It interfaces with multiple generative AI image providers (Free Cloud, Cloudflare Workers AI, Local SANA GPU, OpenAI, Gemini, and offline Mock).
- It enables rapid directorial tweaking, parallel candidate generation (A/B testing), custom image uploads from disk, and 1-click graphic card templates.
- It provides non-destructive scene clustering and merging to cure rapid, strobe-like subtitle pacing.

---

### 2. Complete Inventory of Fields & Controls

#### A. Storyboard Command Header (`StoryboardHeader.tsx`)
- **Title & Aspect Ratio Pill**: Displays active project aspect ratio badge (`16:9`, `9:16`, or `1:1`).
- **Telemetry Stat Chips**:
  - `Scenes Count`: Total scenes on the Master Timeline.
  - `Prompts Ready`: Number of scenes with synthesized image prompts.
  - `Ready Count` (Green): Number of scenes with completed high-res visual assets.
  - `Failed Count` (Red): Count of scenes that encountered generation errors.
  - `Pending Count` (Amber): Count of scenes awaiting visual synthesis.
- **AI Image Model Picker Dropdown (`Cpu`)**:
  - Categorized menu displaying:
    - *Free Cloud (Zero Setup / Unlimited)*: e.g. Flux Realism, Flux Anime, SDXL.
    - *Cloudflare Workers AI (Daily Quota)*: Cloudflare @cf/black-forest-labs/flux-1-schnell with live daily quota readout.
    - *Local Machine (Offline GPU)*: SANA-Sprint local offline generator.
    - *Advanced Cloud (API Keys Required)*: OpenAI DALL-E 3, Gemini Imagen 3 with `ACTIVE KEY` or `NEEDS KEY` badges.
    - *Offline Testing / Mock*: Instant local placeholder generation.
- **Visual Art Style Selector (`Palette`)**:
  - Synchronizes automatically with the Video Bible overall style.
  - Options: *Photorealistic*, *Cinematic*, *Documentary*, *3D Animation*, *Anime*, *Flat Vector*, *Minimal Cartoon*, *Hand Drawn Sketch*, *Whiteboard*, *Stickman*, *Custom Directives*.
- **"Retry Failed" Button (`RefreshCw` Danger)**:
  - Appears automatically whenever `imagesFailedCount > 0`.
  - Retries generation exclusively for failed scenes, strictly preserving all completed visuals.
- **"Generate All Images" / "Regenerate All" Primary CTA (`ImageIcon`)**:
  - Batch orchestrates image generation across all scenes in parallel with concurrency semaphore and timeout guards.
- **Rapid Pacing Advisory Banner (`AlertTriangle`)**:
  - Appears when average scene duration is under 8 seconds.
  - Warns that rapid 2-3s cuts cause flashing and provides a 1-click **"Cluster to 15s Pacing"** CTA.
- **Live Progress Bar**:
  - Real-time animated percentage fill and counter during batch generation or retry.

#### B. Search, Filter & Bulk Actions Toolbar (`StoryboardToolbar.tsx`)
- **Search Input (`Search`)**: Instant real-time filtering across narration text, image prompts, and scene IDs.
- **Status Filter Chips**:
  - `All (N)`: Shows entire scene list.
  - `Ready (N)`: Filters to scenes with completed visuals.
  - `Pending (N)`: Filters to scenes waiting for visual synthesis.
  - `Failed (N)`: Filters to scenes that encountered errors.
- **Multi-Select & Bulk Merge Actions**:
  - Selection counter badge (`N selected`).
  - **"Merge N" Button (`Merge`)**: Combines 2 or more sequential scenes into a single composite scene.
  - **"Clear" Button**: Clears all active selections.
  - **"Select All Filtered"**: 1-click selection of all currently visible scenes.
- **View Layout Switcher**:
  - `Cards View` (`LayoutGrid`): Rich visual cards showing hero previews, prompts, and controls.
  - `Compact View` (`List`): Dense list layout for rapid skimming and high scene counts.

#### C. Storyboard Scene Card (`StoryboardSceneCard.tsx`)
- **Card Header**:
  - Checkbox for multi-selection.
  - Scene Index Tag (`SC_001`, `SC_002`) and Timecode range (`00:00 → 00:04 (4.0s)`).
  - Status badge (`Ready`, `Synthesizing`, `Failed`, or `Pending`).
  - **Edit Button (`Edit3`)**: Opens inline directives editor.
  - **Details Button (`PanelRight`)**: Opens full telemetry modal.
- **Hero Image Canvas**:
  - Strict aspect ratio preview matching project dimensions.
  - **Drag-and-Drop Dropzone**: Drag any `.png` or `.jpg` from your desktop directly onto the canvas to replace the scene visual instantly.
  - **Source Pill**: Displays origin badge (`🎨 Flux`, `📁 Device Upload`, or `📊 Graphic Card`).
  - **Resolution Pill**: Displays exact dimensions (e.g. `1024×576`).
  - **Hover Zoom**: Click anywhere to open Cinema Lightbox.
  - **Quick Controls Overlay**: Fullscreen (`Maximize2`), Upload replacement (`Upload`), and Single-scene Regenerate (`RefreshCw`).
- **Card Body**:
  - **Narration Quote**: Scene dialogue/captions.
  - **Scene Direction (`ChevronDown`)**: Expandable visual description.
  - **Prompt Directive (`ChevronDown`)**: Expandable compiled prompt with:
    - **Copy Button (`Copy`)**: Copies prompt to clipboard with temporary `Copied` confirmation.
    - **Tweak Button (`Sparkles`)**: Opens direct guidance modal.
    - **Variations Button (`Palette`)**: Opens candidate variations modal.
- **Card Bottom Actions**:
  - **Graphic Card (`Layers`)**: Opens graphic card generator.
  - **Variations (`Palette`)**: Generates 3 candidate visual options.
  - **Upload (`Upload`)**: File selector for desktop image replacement.
  - **Generate / Regenerate / Retry CTA**: Primary action tailored to the current scene state.

#### D. Inline Scene Directives Editor
- Slides in directly below the image canvas when clicking **Edit**:
  - `Image Generation Prompt` (monospace textarea).
  - `Visual Description` (scene direction textarea).
  - `Camera Motion` (e.g. *Slow Zoom In*, *Pan Right*).
  - `Transition` (e.g. *Cross Dissolve*, *Match Cut*).
  - `Image Aspect Ratio` (Override selector: `16:9`, `9:16`, `1:1`).
  - `Save Changes` & `Cancel` buttons with loading spinner.

#### E. Dedicated Root-Level Modals
1. **Scene Telemetry & Technical Spec Modal (`StoryboardDetailsModal.tsx`)**:
   - Comprehensive diagnostic inspector displaying raw prompt text, prompt hash, seed, dimensions, file size, storage paths, resolved Video Bible entities, and reference image modes.
2. **Direct Prompt Guidance & Tweak Modal (`StoryboardTweakModal.tsx`)**:
   - Allows creator to input specific instructions (e.g. *“Dramatic rim lighting with rain”*) and inject curated directorial presets (*35mm Anamorphic*, *Golden Hour Rim*, *Cyberpunk Rain*, *Macro Close-Up*, *Volumetric Fog*, *Teal & Orange Grade*).
3. **Fullscreen Cinema Image Lightbox Modal (`StoryboardLightboxModal.tsx`)**:
   - Darkened theater modal with left/right keyboard navigation, metadata chip, scene narration overlay, and direct high-resolution image download.
4. **Smart Scene Clustering Modal (`StoryboardClusteringModal.tsx`)**:
   - Groups rapid micro-captions into cohesive 10–25s scenes using either fixed duration or semantic LLM grouping.
5. **Parallel Candidate Variations Modal (`StoryboardVariationsModal.tsx`)**:
   - Generates 3 distinct framing variations (Medium framing, Wide establishing, Close-up detail) with randomized seeds for creator A/B selection.
6. **Graphic Card Template Modal (`StoryboardGraphicModal.tsx`)**:
   - Renders instant high-resolution graphic cards (*Title Card*, *Quote Card*, *Stats Card*, *Step Card*, *Split Overview*) with custom headlines, subtext, and brand accent colors without calling external AI APIs.

---

### 3. How to Use Stage 3 (Step-by-Step)

#### Step 1: Synthesize AI Prompts from Timeline & Video Bible
1. Upon arriving at Stage 3 from Stage 2, if no prompts exist yet, you will see the **Storyboard Empty State**.
2. Click **"Synthesize Storyboard"**.
3. The LLM engine pairs each scene's narration with the Video Bible characters, locations, and art style to compile scene directions, image prompts, suggested camera motions, and transitions.

#### Step 2: Select Your AI Image Provider & Model
1. In the top command bar, click the **AI Model Picker** (`Cpu`).
2. Choose your preferred model based on your workflow:
   - For fast free generation: Choose **Flux Realism** or **Flux Anime** (*Free Cloud*).
   - For deterministic daily quota: Choose **Cloudflare Workers AI**.
   - For complete offline GPU rendering: Choose **SANA-Sprint** (*Local Machine*).
   - For premium high-fidelity models: Choose **OpenAI DALL-E 3** or **Gemini Imagen 3** (*Advanced Cloud*).
3. Verify that the **Style** dropdown matches your Video Bible art direction (e.g., *Cinematic*, *3D Animation*, or *Anime*).

#### Step 3: Generate Scene Visuals (Single or Batch)
- **To generate all scenes at once**: Click **"Generate All Images"** in the top right. A live progress bar will track completion.
- **To generate a single scene**: Click **"Generate Visual"** on that specific scene card.
- **If any scenes fail**: Click the red **"Retry Failed"** button in the command header to re-run only the incomplete scenes.

#### Step 4: Refine with Directorial Tweaks, Variations, and Replacements
1. **A/B Variation Testing**: Click **"Variations"** on any scene card to generate 3 framing options. Click **"Select Visual"** on your favorite candidate.
2. **Direct Prompt Tweaks**: Click **"Tweak"** on any card, select a directorial preset (e.g., *Golden Hour Rim* or *35mm Anamorphic*), and click **"Regenerate Prompt"**.
3. **Replace with Your Own Image**: Either click **"Upload"** on the card or drag any image directly from your desktop onto the canvas.
4. **Create a Graphic Card**: Click **"Graphic Card"**, select a template (*Quote Card*, *Stats Card*), type your headline, and click **"Apply Template"**.
5. **Inspect Fullscreen**: Click on any completed image thumbnail to open the Cinema Lightbox; use arrow keys to step through your video.

#### Step 5: Advance to Stage 4
- When all scene images look compelling, click **"Proceed to Stage 4: Timeline Studio"** at the bottom navigation bar.

---

### 4. Stage 3 Audit & Production Upgrades Done
- **Non-Blocking Error Handling**: Eliminated browser-freezing `alert()` on failed image uploads in `StoryboardView.tsx`, routing all errors to the non-blocking inline error banner and toast notifications.
- **Video Bible Style Synchronization**: Implemented dynamic `styleMode` initialization from `project.video_bible.overall_style.visual_style` and `realism_level`, ensuring artistic choices from Stage 2 carry over seamlessly into Stage 3 prompt rendering.
- **Batch Generation Timeout Protection**: Added `asyncio.wait_for(..., timeout=90.0)` in `_gen_worker` and `_retry_worker` in `scene_image_service.py` to ensure hanging external APIs release worker slots gracefully and mark timed-out scenes cleanly without blocking the rest of the batch.
- **CSS Grid Compatibility**: Preserved `storyboard-scene-grid` alongside `sb-scene-grid` for complete selector and automated test backward compatibility.
- **Automated Test Validation**: Frontend tests (14/14 passed), backend storyboard suite (5/5 passed), and regression tests for Stages 1 & 2 (9/9 passed).

---

## Roadmap: Upcoming Stages (To Be Updated)

### Stage 4: Timeline Studio & Motion Engine *(Next)*
- Multi-track timeline sequencing with real-time playback preview.
- Camera motion dynamic controls (Ken Burns pans, zooms, tilts).
- Visual transitions (crossfades, cuts, wipes, dissolves).
- Audio waveform synchronization, speech speed adjustments, and background music (BGM) mixing.

### Stage 5: Export & Deliver *(Pending)*
- Multi-track FFmpeg rendering pipeline.
- Subtitle synchronization and on-screen caption burning.
- Aspect ratio conversions (16:9 widescreen, 9:16 vertical shorts/reels).
- Cloud asset packaging and instant MP4 export delivery.

