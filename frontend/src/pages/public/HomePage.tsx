import React, { useEffect, useState } from "react";
import { ArrowRight, Check, Clapperboard, Layers3, Play, Sparkles, WandSparkles } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { SiteContainer } from "../../components/public/SiteContainer";
import { api, type PlanConfigResponse } from "../../services/api";
import { useRouter } from "../../router/Router";
import { useSEO, PAGE_SEO } from "../../utils/seo";

const workflowStages = [
  { number: "01", title: "Bring the story", description: "Start with narration, a script, or a rough idea. ScenoraEdits turns the raw material into a visual plan.", icon: Clapperboard },
  { number: "02", title: "Lock the world", description: "Keep characters, locations, and visual rules consistent through a living Video Bible built into the project.", icon: Layers3 },
  { number: "03", title: "Ship the cut", description: "Assemble scenes, duck music under speech, and export a polished 1080p master from one production workspace.", icon: WandSparkles },
];

const featureHighlights = [
  ["Character continuity", "One source of truth for every recurring person, prop, and place."],
  ["Sub-second scene generation", "Move from a visual prompt to a usable shot without leaving the story."],
  ["Editorial control", "Shape the pacing, soundtrack, captions, and exports instead of accepting a black-box result."],
];

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();
  const [plan, setPlan] = useState<PlanConfigResponse | null>(null);
  useSEO(PAGE_SEO.home);

  useEffect(() => {
    let active = true;
    api.getYearlyPlan().then((data) => {
      if (active) setPlan(data);
    }).catch(() => {
      // Keep the page usable while the public pricing endpoint is unavailable.
    });
    return () => { active = false; };
  }, []);

  const priceInr = plan ? `₹${plan.price_inr.toLocaleString("en-IN")}` : "₹2,999";
  const priceUsd = plan ? `$${plan.price_usd}` : "$49";
  const duration = plan?.duration_days ?? 365;

  return (
    <main className="public-page overflow-hidden bg-[var(--surface)] text-[var(--text)]">
      <section className="relative border-b border-[var(--border)]" style={{ background: "radial-gradient(circle at 82% 20%, var(--orange-subtle), transparent 30%), var(--surface)" }}>
        <SiteContainer className="relative py-16 sm:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--orange)]"><Sparkles size={14} />The creator production system</div>
              <h1 className="mt-5 text-[clamp(2.7rem,6vw,5.7rem)] leading-[0.96] font-black tracking-[-0.04em] text-[var(--text)]">Make the story. Keep the control.</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--text-secondary)]">ScenoraEdits turns narration into consistent scenes, an editable timeline, and a finished YouTube video without scattering your creative decisions across five tools.</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight size={17} />} onClick={() => navigate("/app")} className="px-6 font-bold">Start creating free</Button>
                <Button size="lg" variant="secondary" leftIcon={<Play size={15} />} onClick={() => navigate("/how-it-works")} className="px-6 font-bold">See how it works</Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-500" />5 free generations monthly</span>
                <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-500" />No credit card to start</span>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="relative rounded-[8px] border border-[var(--border)] bg-[var(--surface-alt)] p-3 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-2 pb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]"><span>Scenora Studio / Project 014</span><span className="inline-flex items-center gap-1.5 text-emerald-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Ready to render</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_150px] gap-3 pt-3">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[6px] bg-black"><img src="/assets/hero_astronaut_main.jpg" alt="Cinematic astronaut scene in the ScenoraEdits studio" className="h-full w-full object-cover" /><div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 text-white"><div><div className="text-[10px] uppercase tracking-[0.14em] text-white/60">Scene 04</div><div className="mt-1 text-sm font-bold">The signal comes back</div></div><span className="rounded-full border border-white/30 px-2 py-1 text-[10px] font-bold">1080p</span></div></div>
                  <div className="grid grid-cols-3 sm:grid-cols-1 gap-2"><img src="/assets/scene_1_wide.jpg" alt="Storyboard scene one" className="aspect-[4/3] w-full rounded-[6px] object-cover" /><img src="/assets/scene_2_profile.jpg" alt="Storyboard scene two" className="aspect-[4/3] w-full rounded-[6px] object-cover" /><img src="/assets/scene_3_landscape.jpg" alt="Storyboard scene three" className="aspect-[4/3] w-full rounded-[6px] object-cover" /></div>
                </div>
                <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--orange)]">Narration</span><div className="flex h-5 items-center gap-0.5 overflow-hidden">{[12, 20, 8, 26, 17, 32, 11, 24, 18, 30, 14, 22, 10, 28, 16, 25, 9, 20, 13, 29, 17, 24, 10, 27, 16, 22].map((height, index) => <span key={index} className="w-1 shrink-0 rounded-full bg-[var(--orange)]" style={{ height: `${height}px` }} />)}</div><span className="font-mono text-[10px] text-[var(--text-secondary)]">04:18</span></div>
              </div>
              <p className="mt-3 text-center text-xs font-semibold text-[var(--text-secondary)]">One workspace for the visual decision, the edit, and the export.</p>
            </div>
          </div>
        </SiteContainer>
      </section>

      <section className="border-b border-[var(--border)] bg-[var(--surface-alt)]"><SiteContainer className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">{[["01", "Narration in", "Start with what you already have: a voiceover, a script, or a rough cut."], ["02", "Continuity locked", "Your Video Bible keeps the visual language stable from the first scene to the last."], ["03", "Master out", "Export a clean, share-ready video with captions, audio ducking, and pacing intact."]].map(([number, title, description]) => <div key={number} className="py-8 md:px-8 first:md:pl-0 last:md:pr-0"><div className="font-mono text-xs font-bold text-[var(--orange)]">{number}</div><h2 className="mt-2 text-lg font-bold text-[var(--text)]">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p></div>)}</SiteContainer></section>

      <section className="py-20 sm:py-24"><SiteContainer><div className="max-w-2xl"><div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--orange)]">A production loop that holds together</div><h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-[var(--text)]">From first line to final frame, without losing the thread.</h2></div><div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-3">{workflowStages.map(({ number, title, description, icon: Icon }) => <article key={number} className="border border-[var(--border)] bg-[var(--surface-alt)] p-6 rounded-[8px]"><div className="flex items-center justify-between"><span className="font-mono text-xs font-bold text-[var(--orange)]">{number}</span><Icon size={20} className="text-[var(--orange)]" /></div><h3 className="mt-14 text-xl font-bold text-[var(--text)]">{title}</h3><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{description}</p></article>)}</div></SiteContainer></section>

      <section className="py-20 sm:py-28"><SiteContainer><div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start"><div className="lg:col-span-4 lg:sticky lg:top-28"><div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--orange)]">Built for the whole cut</div><h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-[var(--text)]">Less tool-hopping. More finished stories.</h2><p className="mt-5 text-base leading-7 text-[var(--text-secondary)]">AI should remove production friction without taking the director out of the room. ScenoraEdits keeps generation fast and every meaningful decision editable.</p><button type="button" onClick={() => navigate("/features")} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--orange)] hover:gap-3 transition-all cursor-pointer">Explore the feature set <ArrowRight size={15} /></button></div><div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">{featureHighlights.map(([title, description], index) => <article key={title} className={`border border-[var(--border)] bg-[var(--surface-alt)] p-6 rounded-[8px] ${index === 0 ? "sm:col-span-2" : ""}`}><div className="flex items-center justify-between"><span className="font-mono text-xs text-[var(--orange)]">0{index + 1}</span><ArrowRight size={16} className="text-[var(--text-secondary)]" /></div><h3 className="mt-12 text-xl font-bold text-[var(--text)]">{title}</h3><p className="mt-3 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">{description}</p></article>)}</div></div></SiteContainer></section>

      <section className="border-y border-[var(--border)] py-16 sm:py-20" style={{ background: "var(--surface-alt)" }}><SiteContainer><div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8"><div className="max-w-2xl"><div className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--orange)]">Start with the free tier</div><h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-[var(--text)]">When the channel grows, your pipeline should grow with it.</h2><p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">Try the local workflow first. Upgrade when you want priority cloud rendering, unlimited generations, and every future Pro feature included.</p></div><div className="min-w-[260px] border border-[var(--border)] bg-[var(--surface)] p-5 rounded-[8px]"><div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Pro yearly</div><div className="mt-2 flex items-baseline gap-2"><span className="text-3xl font-black text-[var(--text)]">{priceInr}</span><span className="text-sm text-[var(--text-secondary)]">/ {duration} days</span></div><div className="mt-1 text-xs text-[var(--text-secondary)]">International price {priceUsd}</div><Button size="md" variant="primary" rightIcon={<ArrowRight size={15} />} onClick={() => navigate("/pricing")} className="mt-5 w-full font-bold">See full pricing</Button></div></div></SiteContainer></section>

      <section className="py-20 sm:py-24"><SiteContainer><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-[var(--border)] pb-10"><div><h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text)]">Your next upload starts here.</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Build the visual system once. Make the next episode faster.</p></div><Button size="lg" variant="primary" rightIcon={<ArrowRight size={17} />} onClick={() => navigate("/app")} className="font-bold">Open the studio</Button></div></SiteContainer></section>
    </main>
  );
};
