import { useEffect } from "react";

const SITE_URL = "https://scenoraedits.web.app";
const SITE_NAME = "ScenoraEdits";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`;

export interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noIndex?: boolean;
}

export function useSEO(config: SEOConfig): void {
  useEffect(() => {
    const {
      title,
      description,
      canonical,
      ogTitle,
      ogDescription,
      ogImage = DEFAULT_OG_IMAGE,
      ogType = "website",
      twitterTitle,
      twitterDescription,
      twitterImage,
      noIndex = false,
    } = config;

    document.title = title;

    const setMeta = (selector: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        const match = selector.match(/\[(\w+(?::\w+)?)="([^"]+)"\]/);
        if (match) el.setAttribute(match[1], match[2]);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    setMeta('[name="robots"]', noIndex ? "noindex, nofollow" : "index, follow");
    setMeta('[name="description"]', description);
    if (canonical) setLink("canonical", canonical);
    setMeta('[property="og:type"]', ogType);
    setMeta('[property="og:site_name"]', SITE_NAME);
    setMeta('[property="og:title"]', ogTitle ?? title);
    setMeta('[property="og:description"]', ogDescription ?? description);
    setMeta('[property="og:url"]', canonical ?? SITE_URL);
    setMeta('[property="og:image"]', ogImage);
    setMeta('[property="og:image:alt"]', ogTitle ?? title);
    setMeta('[property="og:locale"]', "en_US");
    setMeta('[name="twitter:card"]', "summary_large_image");
    setMeta('[name="twitter:title"]', twitterTitle ?? ogTitle ?? title);
    setMeta('[name="twitter:description"]', twitterDescription ?? ogDescription ?? description);
    setMeta('[name="twitter:image"]', twitterImage ?? ogImage);
    setMeta('[name="twitter:image:alt"]', twitterTitle ?? ogTitle ?? title);
  }, [
    config.title,
    config.description,
    config.canonical,
    config.ogTitle,
    config.ogDescription,
    config.ogImage,
    config.ogType,
    config.twitterTitle,
    config.twitterDescription,
    config.twitterImage,
    config.noIndex,
  ]);
}

export const PAGE_SEO = {
  home: {
    title: "ScenoraEdits \u2014 AI Video Maker for YouTube Creators",
    description: "Create YouTube videos faster with ScenoraEdits. Turn scripts, voiceovers and captions into AI-powered storyboards, visuals, timelines and ready-to-export videos.",
    canonical: `${SITE_URL}/`,
  },
  features: {
    title: "Features \u2014 ScenoraEdits AI Video Pipeline",
    description: "Explore every ScenoraEdits feature: AI storyboard generation, Video Bible character consistency, multi-track timeline editor, local GPU inference, and Full HD 1080p export.",
    canonical: `${SITE_URL}/features`,
    ogTitle: "ScenoraEdits Features \u2014 Complete AI Video Pipeline",
  },
  howItWorks: {
    title: "How It Works \u2014 ScenoraEdits 5-Stage Pipeline",
    description: "From voiceover audio to exported 1080p video in under 30 minutes. Learn how ScenoraEdits automates script ingestion, storyboarding, timeline assembly and rendering.",
    canonical: `${SITE_URL}/how-it-works`,
    ogTitle: "How ScenoraEdits Works \u2014 5-Stage AI Video Production",
  },
  pricing: {
    title: "Pricing \u2014 ScenoraEdits Free & Pro Plans",
    description: "Start free with local GPU generation. Upgrade to Creator Pro for priority cloud GPUs and advanced features. ScenoraEdits transparent, creator-first pricing.",
    canonical: `${SITE_URL}/pricing`,
    ogTitle: "ScenoraEdits Pricing \u2014 Start Free, Scale With Cloud",
  },
  blog: {
    title: "Creator Guides & Blog \u2014 ScenoraEdits",
    description: "Engineering deep dives, AI storyboard workflows, local GPU tutorials, and YouTube creator playbooks from the ScenoraEdits team.",
    canonical: `${SITE_URL}/blog`,
    ogTitle: "ScenoraEdits Creator Guides & Blog",
  },
  contact: {
    title: "Contact \u2014 ScenoraEdits Support",
    description: "Get help with ScenoraEdits. Reach our engineering team for pipeline configuration, GPU setup assistance, or enterprise inquiries.",
    canonical: `${SITE_URL}/contact`,
    ogTitle: "Contact ScenoraEdits \u2014 Creator Support",
  },
  signIn: {
    title: "Sign In \u2014 ScenoraEdits",
    description: "Sign in to access your ScenoraEdits AI video projects, Video Bible, and production studio.",
    canonical: `${SITE_URL}/sign-in`,
    noIndex: true,
  },
  signUp: {
    title: "Sign Up \u2014 ScenoraEdits",
    description: "Create your free ScenoraEdits account and start building AI-powered YouTube videos today.",
    canonical: `${SITE_URL}/sign-up`,
    noIndex: true,
  },
  notFound: {
    title: "404 \u2014 Page Not Found | ScenoraEdits",
    description: "The page you are looking for could not be found. Return to ScenoraEdits.",
    noIndex: true,
  },
} as const;