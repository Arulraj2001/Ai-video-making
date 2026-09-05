# AI Video Maker 🎬 (Phase 3)

> Full-stack web application for automated video production: Audio Ingestion, Clipchamp Caption Parsing, Master Timeline Management, and Video Bible Consistency Engine.

---

## Architecture Overview

```
YT/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── health.py        # GET /api/health -> {"status": "ok"}
│   │   │       ├── projects.py      # Project CRUD, parse-captions, import, scene updates
│   │   │       └── video_bible.py   # Video Bible CRUD, reference uploads, visual context
│   │   ├── configuration/
│   │   │   └── config.py            # Environment variables & CORS
│   │   ├── models/
│   │   │   ├── scene.py             # SceneModel (id, start, end, duration, caption)
│   │   │   ├── project.py           # ProjectModel & AudioFileModel
│   │   │   └── video_bible.py       # OverallStyle, Character, Location, Object, VideoBible models
│   │   ├── schemas/
│   │   │   ├── health.py            # Health response schema
│   │   │   ├── project.py           # SceneSchema, ParseCaptions, AudioFile schemas
│   │   │   └── video_bible.py       # Pydantic schemas for Video Bible & VisualContext
│   │   ├── services/
│   │   │   ├── caption_parser.py    # Tolerant Clipchamp parser & validation engine
│   │   │   ├── visual_context.py    # build_visual_context() normalization engine
│   │   │   └── project_service.py   # Project, audio, reference image persistence on disk
│   │   ├── utils/
│   │   │   └── errors.py            # Exception classes and global handlers
│   │   └── main.py                  # FastAPI entry point, CORS & /media static mount
│   ├── tests/
│   │   ├── test_health.py           # Health endpoint test
│   │   ├── test_parser.py           # Caption parsing, validation & import tests
│   │   ├── test_projects.py         # Project lifecycle test
│   │   └── test_video_bible.py      # Video Bible API & build_visual_context tests
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # App header, active project, /api/health pill
│   │   │   ├── ImportProject.tsx    # Audio dropzone, Clipchamp textarea & validation preview
│   │   │   ├── SceneTable.tsx       # Master Timeline scenes table with inline editing
│   │   │   ├── EmptyState.tsx       # Empty project state
│   │   │   ├── TimelinePlaceholder.tsx # Future timeline placeholder
│   │   │   ├── Workspace.tsx        # View switcher: Master Timeline vs Video Bible
│   │   │   ├── video-bible/
│   │   │   │   ├── VideoBibleEditor.tsx    # Master Video Bible editor container
│   │   │   │   ├── OverallStyleSection.tsx # Style, realism, lighting, camera, lens, mood
│   │   │   │   ├── CharactersSection.tsx   # Character cards & reference photo uploads
│   │   │   │   ├── LocationsSection.tsx    # Location cards & environment tags
│   │   │   │   ├── ObjectsSection.tsx      # Recurring props and key items
│   │   │   │   ├── GlobalRulesSection.tsx  # Preset rules + custom directives
│   │   │   │   └── VisualContextDrawer.tsx # Normalized prompt fragment inspector
│   │   │   ├── CreateProjectModal.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── pages/
│   │   │   └── DashboardPage.tsx    # Primary dashboard layout
│   │   ├── services/
│   │   │   └── api.ts               # Typed API client using VITE_API_BASE_URL
│   │   ├── hooks/
│   │   │   ├── useHealth.ts         # Hook monitoring /api/health
│   │   │   └── useProjects.ts       # Hook managing project state & scene updates
│   │   ├── types/
│   │   │   ├── api.ts
│   │   │   ├── project.ts           # Scene, AudioFile, Project, ParseCaptions types
│   │   │   ├── video_bible.ts       # VideoBible, Style, Character, Location, Object types
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   └── formatters.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── tests/
│   │   └── formatters.test.mjs      # Frontend unit tests
│   ├── package.json
│   ├── netlify.toml                 # Netlify SPA build & redirect configuration
│   └── .env.example
│
├── render.yaml                      # Render blueprint deployment specification
└── README.md
```

---

## Phase 3 Video Bible Capabilities

1. **Overall Style Engine**:
   - Visual Style, Realism Level, Color Treatment, Lighting, Camera Style, Lens/Cinematography, Mood.
   - Synchronized across the project to provide the master aesthetic anchor.

2. **Recurring Character Registry**:
   - Name, Description, Physical Appearance, Clothing, Age Range, Personality.
   - Reference image upload with local storage and streaming preview.

3. **Recurring Location Registry**:
   - Location Name, Description, Environment / Setting, Location Lighting.
   - Reference photo upload support for architectural consistency.

4. **Recurring Objects & Artifacts**:
   - Key signature props, vehicles, or items with descriptions and reference uploads.

5. **Global Visual Rules**:
   - Toggle presets (`cinematic`, `realistic`, `documentary`, `animation`, `historical`, `futuristic`, `noir`, `anamorphic`).
   - Add/remove custom directives (e.g. `no modern brand logos`).

6. **Normalized Visual Context (`build_visual_context`)**:
   - Synthesizes a unified global prompt prefix fragment.
   - Generates structured entity token dictionaries for downstream scene prompt synthesis.
   - Real-time inspection drawer with one-click clipboard copying.

---

## How to Run Locally

### 1. Backend Setup (FastAPI)
```powershell
cd backend
.\venv\Scripts\Activate.ps1
$env:PYTHONPATH="."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
* **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

#### Run Backend Tests
```powershell
$env:PYTHONPATH="backend"
.\backend\venv\Scripts\pytest backend/tests/ -v
```

### 2. Frontend Setup (React + Vite + TypeScript)
```powershell
cd frontend
npm install
npm run dev
```
* **Application URL**: [http://localhost:5173](http://localhost:5173)

#### Run Frontend Tests & Build
```powershell
npm test
npm run build
```
