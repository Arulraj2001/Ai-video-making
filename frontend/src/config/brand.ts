/**
 * ScenoraEdits — Central Brand Configuration
 * Single source of truth for product branding across public, app, studio, and admin shells.
 */

export const BRAND = {
  name: "ScenoraEdits",
  studio: "ScenoraEdits Studio",
  admin: "ScenoraEdits Admin",
  local: "ScenoraEdits Local",
  tagline: "Turn narration into cinematic visuals",
  description:
    "Intelligent video production platform that converts voiceover audio and timestamped captions into AI-directed storyboards, visual consistency, and Full HD videos.",
  version: "1.0.0-phase12",
  copyright: "© 2026 ScenoraEdits. All rights reserved.",
  links: {
    github: "https://github.com/Arulraj2001/Ai-video-making",
    howItWorks: "/how-it-works",
    features: "/features",
    pricing: "/pricing",
    contact: "/contact",
  },
} as const;

export type BrandConfig = typeof BRAND;
