import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  Music,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Mic,
  FileText,
  Info,
} from "lucide-react";
import { api } from "../services/api";
import type { Scene, Project, TTSVoice } from "../types";

export interface ImportProjectProps {
  onSuccess: (project: any) => void;
  onCancel: () => void;
  targetProject?: Project | null;
}

const SAMPLE_CAPTIONS = `00:00 - 00:05
Deep beneath the neon-soaked skyline of Neo-Veridia, ancient data vaults hum with forgotten memories.

00:05 - 00:11
Maya Vance, a cybernetic archivist in a worn leather trench coat, decodes an encrypted holographic transmission.

00:11 - 00:18
The holographic artifact flickers, revealing coordinate vectors pointing toward the orbital citadel.

00:18 - 00:24
With her cybernetic optic glowing cyan, she prepares her grav-bike for an ascent into the stratosphere.`;

const SAMPLE_TTS_SCRIPT = `Deep beneath the neon-soaked skyline of Neo-Veridia, ancient data vaults hum with forgotten memories.
Maya Vance, a cybernetic archivist in a worn leather trench coat, decodes an encrypted holographic transmission.
The holographic artifact flickers, revealing coordinate vectors pointing toward the orbital citadel.
With her cybernetic optic glowing cyan, she prepares her grav-bike for an ascent into the stratosphere.`;

const FALLBACK_VOICES: TTSVoice[] = [
  { id: "en-US-ChristopherNeural", name: "Christopher (US Documentary Male)", gender: "Male", locale: "en-US", style: "Deep, authoritative, cinematic documentary narration" },
  { id: "en-US-JennyNeural", name: "Jenny (US Expressive Female)", gender: "Female", locale: "en-US", style: "Warm, natural, versatile storytelling" },
  { id: "en-US-GuyNeural", name: "Guy (US Storyteller Male)", gender: "Male", locale: "en-US", style: "Casual, friendly narrative voice" },
  { id: "en-GB-SoniaNeural", name: "Sonia (UK Narrator Female)", gender: "Female", locale: "en-GB", style: "Refined, articulate British narration" },
  { id: "en-GB-RyanNeural", name: "Ryan (UK Documentary Male)", gender: "Male", locale: "en-GB", style: "Authoritative British documentary voice" },
  { id: "en-IN-NeerjaNeural", name: "Neerja (India Professional Female)", gender: "Female", locale: "en-IN", style: "Clear, engaging Indian English narration" },
  { id: "en-IN-PrabhatNeural", name: "Prabhat (India Confident Male)", gender: "Male", locale: "en-IN", style: "Energetic Indian English voiceover" },
  { id: "en-AU-WilliamNeural", name: "William (Australia Calm Male)", gender: "Male", locale: "en-AU", style: "Laid back Australian narrator" },
];

export const ImportProject: React.FC<ImportProjectProps> = ({ onSuccess, onCancel, targetProject }) => {
  const [ingestMode, setIngestMode] = useState<"upload" | "tts">("upload");
  const [name, setName] = useState(targetProject?.name || "");
  const [description, setDescription] = useState(targetProject?.description || "");
  
  // Audio + Captions state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [rawCaptions, setRawCaptions] = useState("");
  const [audioDragActive, setAudioDragActive] = useState(false);
  const [captionDragActive, setCaptionDragActive] = useState(false);

  // Edge-TTS State
  const [scriptText, setScriptText] = useState("");
  const [voices, setVoices] = useState<TTSVoice[]>(FALLBACK_VOICES);
  const [selectedVoice, setSelectedVoice] = useState("en-US-ChristopherNeural");
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);

  // Parsing & validation preview state
  const [previewScenes, setPreviewScenes] = useState<Scene[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasValidated, setHasValidated] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<string>("");
  const [generalError, setGeneralError] = useState<string | null>(null);

  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const captionFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch live voices from backend
    api.getTTSVoices()
      .then((data) => {
        if (data && data.length > 0) {
          setVoices(data);
          if (!data.some((v) => v.id === selectedVoice)) {
            setSelectedVoice(data[0].id);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not fetch remote TTS voices, using fallback voices:", err);
      });
  }, []);

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAudioDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetAudio(e.dataTransfer.files[0]);
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetAudio(e.target.files[0]);
    }
  };

  const validateAndSetAudio = (file: File) => {
    const validExtensions = [".mp3", ".wav", ".m4a", ".aac", ".ogg"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setGeneralError(`Unsupported audio format '${ext}'. Allowed: MP3, WAV, M4A, AAC, OGG.`);
      return;
    }
    setGeneralError(null);
    setAudioFile(file);
  };

  const handleCaptionFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCaptionDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await readAndSetCaptionFile(e.dataTransfer.files[0]);
    }
  };

  const handleCaptionFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await readAndSetCaptionFile(e.target.files[0]);
    }
  };

  const readAndSetCaptionFile = async (file: File) => {
    try {
      const text = await file.text();
      setRawCaptions(text);
      setGeneralError(null);
      await validateCaptionsText(text);
    } catch (err: any) {
      setGeneralError(`Failed to read file '${file.name}': ${err.message}`);
    }
  };

  const validateCaptionsText = async (text: string) => {
    if (!text.trim()) {
      setValidationErrors(["Please provide captions or upload an SRT file."]);
      setHasValidated(true);
      setIsStale(false);
      setPreviewScenes([]);
      return;
    }

    try {
      setValidating(true);
      setGeneralError(null);
      const res = await api.parseCaptions(text);
      setHasValidated(true);
      setIsStale(false);
      if (res.valid) {
        setPreviewScenes(res.scenes);
        setValidationErrors([]);
      } else {
        setPreviewScenes([]);
        setValidationErrors(res.errors);
      }
    } catch (err: any) {
      setGeneralError(err.message || "Failed to validate captions");
    } finally {
      setValidating(false);
    }
  };

  const handleParsePreview = async () => {
    await validateCaptionsText(rawCaptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProject && !name.trim()) {
      setGeneralError("Please enter a project name.");
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    try {
      setSubmitting(true);
      setGeneralError(null);
      let project: any;

      if (ingestMode === "tts") {
        if (!scriptText.trim()) {
          setGeneralError("Please enter your script or story text.");
          setSubmitting(false);
          return;
        }

        setSubmitPhase("Synthesizing neural AI voiceover...");
        timers.push(setTimeout(() => setSubmitPhase("Analyzing speech boundaries & sentence timecodes..."), 1600));
        timers.push(setTimeout(() => setSubmitPhase("Building Master Timeline scenes..."), 3200));

        if (targetProject) {
          project = await api.generateVoiceover(
            targetProject.id,
            scriptText.trim(),
            selectedVoice,
            voiceSpeed
          );
        } else {
          project = await api.importWithTTS({
            name: name.trim(),
            script_text: scriptText.trim(),
            description: description.trim() || undefined,
            voice: selectedVoice,
            speed: voiceSpeed,
          });
        }
      } else {
        // Upload mode
        if (!rawCaptions.trim()) {
          setGeneralError("Please paste captions or upload an SRT / VTT subtitle file.");
          setSubmitting(false);
          return;
        }

        setSubmitPhase(audioFile ? "Uploading narration audio & subtitle track..." : "Parsing captions into Master Timeline...");
        timers.push(setTimeout(() => setSubmitPhase("Calculating scene timestamps & durations..."), 1200));
        timers.push(setTimeout(() => setSubmitPhase("Locking Master Timeline..."), 2600));

        const formData = new FormData();
        if (audioFile) {
          formData.append("audio_file", audioFile);
        }
        formData.append("raw_captions", rawCaptions.trim());

        if (targetProject) {
          project = await api.ingestProjectMedia(targetProject.id, formData);
        } else {
          formData.append("name", name.trim());
          if (description.trim()) {
            formData.append("description", description.trim());
          }
          project = await api.importProject(formData);
        }
      }

      setSubmitPhase("Master Timeline Ready!");
      onSuccess(project);
    } catch (err: any) {
      setGeneralError(err.message || "Failed to process project ingestion");
    } finally {
      timers.forEach(clearTimeout);
      setSubmitting(false);
      setSubmitPhase("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          <ArrowLeft size={14} />
          <span>{targetProject ? "Back to Studio" : "Back to Dashboard"}</span>
        </button>
        <div className="flex items-center gap-2">
          {targetProject && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold meta-mono bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-border-subtle)]">
              Project: {targetProject.name}
            </span>
          )}
          <span className="badge badge-info text-xs">Stage 1 Ingestion</span>
        </div>
      </div>

      <div className="studio-card p-6 sm:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold font-display" style={{ color: "var(--text-primary)" }}>
              {targetProject ? "Ingest Media & Master Timeline" : "Create Master Timeline"}
            </h2>
            <div
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--color-primary)] cursor-help transition-colors"
              title="The Master Timeline is the core timing backbone of your video, locking narration audio to timestamped visual scenes so every AI image and subtitle remains perfectly synchronized."
            >
              <Info size={16} />
            </div>
          </div>
          <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {targetProject
              ? `Configure narration audio and timestamped scenes for ${targetProject.name}.`
              : "Choose whether to upload existing voiceover & captions, or generate natural AI voiceover directly from your script."}
          </p>
          <div className="mt-2.5 px-3 py-2 rounded-lg bg-[var(--color-surface-sunken)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)] flex items-center gap-2">
            <span className="font-bold text-[var(--color-primary)]">Pro Tip:</span>
            <span>The Master Timeline locks your voiceover audio to visual scenes so AI image diffusion and video pacing stay locked to spoken words.</span>
          </div>
        </div>

        {/* Ingestion Mode Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl border mb-6" style={{ background: "var(--bg-app)", borderColor: "var(--border-subtle)" }}>
          <button
            type="button"
            onClick={() => setIngestMode("upload")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              ingestMode === "upload"
                ? "bg-[var(--accent-primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <UploadCloud size={15} />
            <span>Upload Audio & Captions (.srt / .vtt)</span>
          </button>

          <button
            type="button"
            onClick={() => setIngestMode("tts")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              ingestMode === "tts"
                ? "bg-[var(--accent-primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Mic size={15} />
            <span>Generate with AI Voiceover (Edge-TTS)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">New</span>
          </button>
        </div>

        {generalError && (
          <div
            className="mb-6 p-4 rounded-xl border text-xs flex items-start gap-2.5"
            style={{
              background: "var(--accent-danger-subtle)",
              borderColor: "var(--accent-danger)",
              color: "var(--accent-danger-text)",
            }}
          >
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name & Description (Only shown when creating a brand new project) */}
          {!targetProject && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Project Name <span style={{ color: "var(--accent-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cyberpunk Detective Ep. 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Brief project notes or storyline..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-text"
                />
              </div>
            </div>
          )}

          {/* ================= MODE 1: UPLOAD AUDIO & CAPTIONS ================= */}
          {ingestMode === "upload" && (
            <>
              {/* 1. Audio Upload */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Narration / Voiceover Audio (MP3, WAV, M4A, AAC, OGG)
                </label>

                <div style={{ minHeight: 88 }}>
                  {!audioFile ? (
                    <div
                      onDragEnter={() => setAudioDragActive(true)}
                      onDragLeave={() => setAudioDragActive(false)}
                      onDragOver={(e) => { e.preventDefault(); setAudioDragActive(true); }}
                      onDrop={handleAudioDrop}
                      onClick={() => audioFileInputRef.current?.click()}
                      className={`dropzone cursor-pointer ${audioDragActive ? "active" : ""}`}
                      style={{ minHeight: 88 }}
                    >
                      <input
                        ref={audioFileInputRef}
                        type="file"
                        accept=".mp3,.wav,.m4a,.aac,.ogg"
                        onChange={handleAudioSelect}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "var(--radius-md)",
                            background: "var(--accent-primary-subtle)",
                            color: "var(--accent-primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Music size={18} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                            Drag & drop your voiceover narration file here, or <span style={{ color: "var(--accent-primary)" }}>browse</span>
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                            MP3, WAV, M4A, AAC, or OGG up to 50MB
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="p-3.5 rounded-xl border flex items-center justify-between"
                      style={{
                        background: "var(--bg-app)",
                        borderColor: "var(--border-subtle)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "var(--radius-md)",
                            background: "var(--accent-success-subtle)",
                            color: "var(--accent-success)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Music size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                            {audioFile.name}
                          </div>
                          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAudioFile(null)}
                        className="btn-ghost text-xs py-1 px-2.5"
                        style={{ color: "var(--accent-danger-text)" }}
                      >
                        Replace
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Captions / Subtitles (SRT, VTT, Textarea) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Clipchamp Captions or Subtitle File (.srt, .vtt, .txt) <span style={{ color: "var(--accent-danger)" }}>*</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => captionFileInputRef.current?.click()}
                      className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1.5"
                      title="Upload an SRT or VTT file directly"
                    >
                      <FileText size={12} />
                      <span>Upload SRT / VTT</span>
                    </button>
                    <input
                      ref={captionFileInputRef}
                      type="file"
                      accept=".srt,.vtt,.txt"
                      onChange={handleCaptionFileSelect}
                      className="hidden"
                    />

                    <span style={{ color: "var(--border-subtle)" }}>•</span>

                    <button
                      type="button"
                      onClick={() => {
                        setRawCaptions(SAMPLE_CAPTIONS);
                        validateCaptionsText(SAMPLE_CAPTIONS);
                      }}
                      className="text-[11px] font-medium transition-colors hover:underline"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      Paste Sample
                    </button>

                    <span style={{ color: "var(--border-subtle)" }}>•</span>

                    <button
                      type="button"
                      onClick={handleParsePreview}
                      disabled={validating || !rawCaptions.trim()}
                      className="btn-secondary text-[11px] py-1 px-2"
                    >
                      <Sparkles size={11} />
                      <span>{validating ? "Validating..." : "Verify Timestamps"}</span>
                    </button>
                  </div>
                </div>

                <div
                  onDragEnter={() => setCaptionDragActive(true)}
                  onDragLeave={() => setCaptionDragActive(false)}
                  onDragOver={(e) => { e.preventDefault(); setCaptionDragActive(true); }}
                  onDrop={handleCaptionFileDrop}
                  className={`relative rounded-xl transition-all ${captionDragActive ? "ring-2 ring-indigo-500" : ""}`}
                >
                  <textarea
                    required
                    rows={7}
                    placeholder={`00:00 - 00:04\nFirst scene narration text goes here.\n\n00:04 - 00:09\nSecond scene narration text goes here.\n\n(Or drag & drop an .srt or .vtt file directly here)`}
                    value={rawCaptions}
                    onChange={(e) => {
                      setRawCaptions(e.target.value);
                      if (hasValidated) setIsStale(true);
                    }}
                    className="textarea-custom font-mono text-xs"
                  />
                  {captionDragActive && (
                    <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-sm rounded-xl flex items-center justify-center text-xs font-semibold text-indigo-200 border-2 border-dashed border-indigo-400">
                      Drop .SRT or .VTT file here to load
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Feedback Banner */}
              {hasValidated && (
                <div>
                  {validationErrors.length > 0 ? (
                    <div
                      className="p-4 rounded-xl border space-y-2 text-xs"
                      style={{
                        background: "var(--accent-danger-subtle)",
                        borderColor: "var(--accent-danger)",
                        color: "var(--accent-danger-text)",
                      }}
                    >
                      <div className="font-semibold flex items-center gap-1.5">
                        <AlertTriangle size={15} />
                        <span>Caption Formatting Errors Detected:</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-1">
                        {validationErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div
                      className="p-4 rounded-xl border space-y-3"
                      style={{
                        background: "var(--accent-success-subtle)",
                        borderColor: isStale ? "var(--accent-warning)" : "var(--accent-success)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: isStale ? "var(--accent-warning-text)" : "var(--accent-success-text)" }}>
                          <CheckCircle2 size={15} />
                          <span>Valid Timestamps • {previewScenes.length} Scenes Extracted</span>
                        </div>
                        {isStale ? (
                          <span className="badge badge-warning text-[10px]">Edited — re-verify</span>
                        ) : (
                          <span className="badge badge-success text-[10px]">Ready to Ingest</span>
                        )}
                      </div>

                      {/* Scene Preview Cards */}
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {previewScenes.map((sc) => (
                          <div
                            key={sc.id}
                            className="p-2.5 rounded-lg border flex items-start gap-3 text-xs"
                            style={{
                              background: "var(--bg-surface)",
                              borderColor: "var(--border-subtle)",
                            }}
                          >
                            <span className="badge badge-neutral text-[10px] font-mono shrink-0">
                              {sc.id} • {sc.start.toFixed(1)}s - {sc.end.toFixed(1)}s
                            </span>
                            <span className="truncate" style={{ color: "var(--text-primary)" }}>
                              {sc.caption}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ================= MODE 2: EDGE-TTS GENERATION ================= */}
          {ingestMode === "tts" && (
            <div className="space-y-5">
              {/* Recommended Script Format Guide Banner */}
              <div
                className="p-4 rounded-xl border flex items-start gap-3 text-xs"
                style={{
                  background: "rgba(99, 102, 241, 0.08)",
                  borderColor: "rgba(99, 102, 241, 0.25)",
                  color: "var(--text-secondary)",
                }}
              >
                <Info size={18} className="shrink-0 text-indigo-400 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-indigo-300">Recommended Script Format</div>
                  <p className="text-[11px] leading-relaxed">
                    Separate your story or narration into clear sentences or short paragraphs (1–2 sentences each). Microsoft Edge-TTS will synthesize natural human-grade neural voiceover and automatically generate synchronized sentence timestamps into Master Timeline scenes!
                  </p>
                </div>
              </div>

              {/* Voice & Speed Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border" style={{ background: "var(--bg-app)", borderColor: "var(--border-subtle)" }}>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Microsoft Neural Voice
                  </label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="input-text text-xs cursor-pointer"
                  >
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.gender})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                    {voices.find((v) => v.id === selectedVoice)?.style || "High-fidelity neural voice"}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      Speech Speed: {voiceSpeed.toFixed(2)}x
                    </label>
                    <button
                      type="button"
                      onClick={() => setVoiceSpeed(1.0)}
                      className="text-[10px] text-indigo-400 hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.50"
                    step="0.05"
                    value={voiceSpeed}
                    onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
                    <span>0.75x (Cinematic)</span>
                    <span>1.0x (Normal)</span>
                    <span>1.50x (Fast)</span>
                  </div>
                </div>
              </div>

              {/* Script Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Script / Narration Text <span style={{ color: "var(--accent-danger)" }}>*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setScriptText(SAMPLE_TTS_SCRIPT)}
                    className="text-[11px] font-medium transition-colors hover:underline text-indigo-400"
                  >
                    Load Sample Script
                  </button>
                </div>

                <textarea
                  required
                  rows={8}
                  placeholder={`Deep beneath the neon-soaked skyline of Neo-Veridia, ancient data vaults hum with forgotten memories.\n\nMaya Vance, a cybernetic archivist in a worn leather trench coat, decodes an encrypted holographic transmission.\n\nWith her cybernetic optic glowing cyan, she prepares her grav-bike for an ascent into the stratosphere.`}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  className="textarea-custom text-xs"
                />
                <div className="flex justify-between text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                  <span>{scriptText.trim().split(/\s+/).filter(Boolean).length} words</span>
                  <span>{scriptText.length} characters</span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                (!targetProject && !name.trim()) ||
                (ingestMode === "upload" && !rawCaptions.trim()) ||
                (ingestMode === "tts" && !scriptText.trim())
              }
              className="btn-primary text-xs py-2 px-5 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="font-medium">{submitPhase || (ingestMode === "tts" ? "Synthesizing AI Audio..." : "Building Master Timeline...")}</span>
                </>
              ) : (
                <>
                  <span>
                    {ingestMode === "tts"
                      ? "Generate AI Voiceover & Master Timeline"
                      : targetProject
                      ? "Generate Master Timeline"
                      : "Create Project & Master Timeline"}
                  </span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
