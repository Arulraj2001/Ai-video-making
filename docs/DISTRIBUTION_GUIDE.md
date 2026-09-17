# ScenoraEdits — Distribution & Launch Playbook

This document contains copy-pasteable launch assets, community post templates, and directory submission packages for ScenoraEdits.

---

## 1. Product Positioning Core

- **Brand Name**: ScenoraEdits
- **Primary Category**: Scene-Based Video Composer / Audio-to-Video Scene Builder
- **Core Tagline**: Bring your audio. Assign your images. Export your video.
- **Elevator Pitch**: ScenoraEdits automatically splits your voiceover narration into timed scenes. Drop one image onto each scene — or generate one with AI using your own API key. Add captions, motion, and overlays. Export as MP4, ready for YouTube.
- **Target Audience**: Faceless YouTube channel operators, podcasters repurposing episodes for YouTube, AI image artists, and course educators.
- **Key Differentiators**:
  1. Scene-level control (discrete image per acoustic beat; not random 5-second video loops).
  2. Bring Your Own API Key (BYOK) for raw-cost image generation ($0.003–$0.04/image vs $1.00 platform credits).
  3. Video Bible™ character & style continuity engine (no facial warping between shots).
  4. Zero-drift deterministic FFmpeg demuxer (<0.05s sync variance on long videos).
  5. Zero watermarks and 100% commercial YouTube monetization rights.

---

## 2. Product Hunt Launch Package

### Product Listing Details
- **Product Name**: ScenoraEdits
- **Tagline**: Turn your audio into a scene-by-scene YouTube video
- **Primary Category**: Artificial Intelligence, Video, YouTube, Content Creation
- **Website URL**: https://scenoraedits.web.app

### Short Description (60 characters)
Audio-to-video composer with scene control & Video Bible.

### Long Description (260 characters)
Upload your voiceover and assign one image to each scene. Add captions, Ken Burns motion, and automatic audio ducking — then export a finished 1080p MP4. Free scene-based video builder for faceless YouTube creators.

### Maker First Comment (Post on launch morning)
> Hey Product Hunt! 👋
>
> I built ScenoraEdits because every existing "AI video generator" made the same mistake: they generate random 5-second video clips where you have zero control over what appears when. If frame 12 had an artifact or the character's face morphed, you had to re-roll the entire video and burn more subscription credits.
>
> ScenoraEdits takes a different approach — **Scene-Based Video Composition**:
>
> 1. **Bring Your Audio**: Upload your voiceover MP3 or type a script. Whisper acoustic detection slices it into natural 4–8 second scene slots based on speech pauses.
> 2. **Lock Your Visuals (Video Bible™)**: Set your art style and character faces once. Every subsequent image inherits those identity anchors so characters never change faces.
> 3. **Assign One Image per Scene**: Drop your own Midjourney/Flux stills or generate with AI directly. You can replace any individual shot in 1 click.
> 4. **Add Motion & Subtitles**: Ken Burns slow camera zoom/pan, TikTok Bold or Netflix subtitles, and automatic -14dB audio ducking under speech.
> 5. **Export in 1080p**: Multi-format render produces MP4 1080p, 720p draft, WebM, and MP3 podcast cuts with zero watermarks.
>
> **Best part**: You can bring your own OpenAI, Fal.ai (Flux), or Gemini API key and pay raw developer prices (~$0.003/image) with zero token markup. Or use our built-in free image engine.
>
> Try it free without signing up: https://scenoraedits.web.app
>
> I'd love to hear your feedback on the timeline editor and Video Bible consistency engine!

---

## 3. Reddit Community Post Templates

### Template A: `r/SideProject` (Builder & Technical Angle)
**Title**: I built an open-source audio-to-video studio that splits voiceovers into scenes and renders with zero drift

**Body**:
```text
Hey r/SideProject,

Over the past few months, I got frustrated with web-based video editors. Tools like Canva are clunky for audio timing, and generic AI video tools force you to pay $60/month for random video loops that don't match your script.

So I built ScenoraEdits (https://scenoraedits.web.app) — a scene-based video composer.

How the pipeline works under the hood:
1. Audio Segmentation: Uses Whisper phonetic alignment to detect breath pauses and segment speech into discrete scenes (averaging 5–7 seconds).
2. Video Bible: We store persistent character seeds, wardrobe tokens, and 35mm lens descriptors in a project registry so diffusion models don't mutate character faces between cuts.
3. Bring Your Own Key (BYOK): You can connect your own OpenAI DALL-E 3 or Fal.ai (Flux Schnell) key. Flux renders at ~$0.003/image, meaning 300 scenes cost under $1.00.
4. Deterministic FFmpeg Render: Instead of browser canvas capture (which desyncs over 10 minutes), our backend renders scene clips and stitches them via FFmpeg concat demuxer with sample-accurate PTS presentation timestamps (<0.05s drift verified).

The frontend is built with React + Vite + TypeScript, and the backend is FastAPI + FFmpeg.

You can try it completely free without creating an account:
https://scenoraedits.web.app

Would love feedback from creators and developers on the workflow!
```

---

### Template B: `r/youtubers` (Creator & Retention Angle)
**Title**: How we cut faceless video production from 12 hours to 30 mins (without paying $80/mo for AI credits)

**Body**:
```text
Hey creators,

If you run a faceless channel in history, true crime, finance, or lore, your biggest weekly bottleneck is usually matching imagery to your narration.

The traditional process:
- Record a 15-minute voiceover
- Spend 4 hours scouring stock video sites
- Spend 3 hours in Premiere cutting clips to every sentence
- Manually keyframe background music volume curves
- Manually animate subtitles

We built a tool called ScenoraEdits (https://scenoraedits.web.app) to automate the tedious parts while keeping 100% creative control:
- Upload voiceover: It auto-cuts into scenes based on speech pauses.
- Video Bible: Keeps character faces and armor consistent across 40+ shots.
- One image per scene: Drop your own custom artwork or generate per scene.
- Auto-ducking: Music ducks -14dB automatically under dialogue.
- 1080p 60fps MP4 export with zero watermarks and full commercial rights.

It also supports BYOK (Bring Your Own Key) for OpenAI or Flux, so you generate images at raw API cost instead of paying $1 per credit on SaaS tools.

Free guest trial (no sign-up required): https://scenoraedits.web.app

Hope this helps anyone grinding on weekly YouTube uploads!
```

---

### Template C: `r/AItools` (BYOK & Architecture Angle)
**Title**: Built a free audio-to-video studio with BYOK (OpenAI, Flux, Gemini) and Video Bible character consistency

**Body**:
```text
Tired of AI video tools charging 500% credit markups?

We launched ScenoraEdits (https://scenoraedits.web.app), a web studio that turns audio narration into scene-by-scene videos:

Key features:
• Scene-Level Control: Every scene card is a discrete visual slot aligned with your voiceover timestamps.
• BYOK (Bring Your Own Key): Plug in your OpenAI (DALL-E 3), Fal.ai (Flux Schnell), or Gemini key. You pay raw provider rates (~$0.003 to $0.04/image).
• Video Bible™: Solves character face morphing by anchoring facial seeds and lighting tags across scenes.
• Kinetic Captions: TikTok Bold yellow-highlighted subtitles and classic documentary presets.
• Free Built-In Engines: Pollinations.ai works out of the box with zero keys required.
• Multi-Format Export: 1080p MP4, 720p draft, WebM, and MP3 podcast audio with zero watermarks.

Try it free: https://scenoraedits.web.app
```

---

## 4. AI Directory Submission Data

### Directory 1: There's An AI For That (TAAFT)
- **Tool Name**: ScenoraEdits
- **Website URL**: https://scenoraedits.web.app
- **Short Tagline**: Turn audio voiceovers into scene-by-scene YouTube videos
- **Category**: Video Generator, Video Editor, Text-to-Video, YouTube Automation
- **Pricing**: Freemium ($0 Free Tier, BYOK API Keys)
- **Key Features**:
  - Whisper speech segmentation into timed scene slots
  - Video Bible character face and wardrobe consistency engine
  - Bring Your Own API Key (BYOK) for OpenAI, Flux, and Gemini
  - Ken Burns slow zoom camera motion and dynamic transitions
  - Automated -14dB speech-aware music ducking
  - Full HD 1080p MP4 export with 100% commercial YouTube rights

---

### Directory 2: Futurepedia
- **Tool Name**: ScenoraEdits
- **One-Liner**: Audio-to-video scene builder for faceless YouTube creators and podcasters.
- **Description**: ScenoraEdits automatically parses voiceovers into timed scenes, locks character consistency with Video Bible, allows custom image assignment per scene, and renders 1080p MP4 videos with animated captions and audio ducking.
- **Pricing Model**: Free / Bring Your Own Key (BYOK)
- **Platforms**: Web Application

---

### Directory 3: Toolify.ai
- **Tool Name**: ScenoraEdits
- **Primary Keyword**: AI Video Composer, Faceless YouTube Video Maker, Audio to Video
- **Short Description**: Compose 1080p scene-based videos from voiceover audio with Video Bible character locking and BYOK image generation.
- **Pricing**: Free plan available, zero watermark.

---

### Directory 4: AI Valley & AI Tool Hunt
- **Name**: ScenoraEdits
- **Tagline**: Audio-to-video composer with scene-level image control
- **Description**: Upload your voiceover and assign one image to each scene. Add captions, motion, and overlays — then export a finished MP4. Free scene-based video builder for YouTube creators.
- **Tags**: #VideoEditing #YouTubeAutomation #VideoBible #BYOK #TextToVideo
