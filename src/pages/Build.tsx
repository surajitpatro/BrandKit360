import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { SiteHeader } from "@/components/SiteChrome";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { generateBrandSystem, nudgeDna, type WizardAnswers } from "@/lib/generator";
import { VisualDirectionStep } from "@/sections/build/VisualDirectionStep";
import { fontStack } from "@/lib/fontLibrary";
import type { BrandData, BrandDNA } from "@contracts/brand";

const PERSONALITY_OPTIONS = [
  "Premium", "Modern", "Friendly", "Bold", "Minimal", "Playful",
  "Elegant", "Professional", "Innovative", "Trustworthy", "Energetic", "Traditional",
];

const AUDIENCE_SUGGESTIONS = [
  "Consumers (B2C)", "Businesses (B2B)", "Younger audiences", "Established professionals",
  "Local community", "Global customers", "Design-aware buyers", "Price-conscious buyers",
];

const USAGE_OPTIONS = [
  "Website", "Social media", "Packaging", "Print", "Advertising",
  "Presentations", "Signage", "Events", "Mobile app", "Product",
];

/** Detect dominant colours from a raster image — labelled DETECTED, never facts. */
function detectColours(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 48;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve([]);
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      const buckets = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (data[i + 3] < 128) continue;
        // skip near-white/near-black greys as "paper" isn't a brand colour
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        if (max - min < 18 && (max > 235 || max < 25)) continue;
        const key = [r, g, b].map((v) => Math.round(v / 24) * 24).join(",");
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
      URL.revokeObjectURL(url);
      const top = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      resolve(top.map(([k]) => "#" + k.split(",").map((v) => (+v).toString(16).padStart(2, "0")).join("")));
    };
    img.onerror = () => resolve([]);
    img.src = url;
  });
}

const EXAMPLE: WizardAnswers = {
  brandName: "Northpine Coffee Roasters",
  business: "Small-batch coffee roastery and café serving direct-trade beans",
  audience: ["Consumers (B2C)", "Local community"],
  personality: ["Premium", "Friendly", "Trustworthy"],
  usage: ["Website", "Packaging", "Social media", "Print"],
  admired: "Patagonia — quiet confidence and craft; avoid startup clichés",
  avoid: "Overly rustic clichés and busy packaging",
};

export default function Build() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [params] = useSearchParams();

  // wizard state
  const [step, setStep] = useState(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [detected, setDetected] = useState<string[]>([]);
  const [answers, setAnswers] = useState<WizardAnswers>({
    brandName: "", business: "", audience: [], personality: [], usage: [],
    admired: "", avoid: "",
  });
  const [brandName, setBrandName] = useState("");
  const [system, setSystem] = useState<BrandData | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const createBrand = trpc.brands.create.useMutation();
  const trpcUpdateBrand = trpc.brands.update.useMutation();
  const uploadLogo = trpc.assets.upload.useMutation();
  /** Automatic launch imagery — fires after save; the server generates in the background. */
  const launchImagery = trpc.imagery.generateLaunchSet.useMutation();

  const goExample = () => {
    setAnswers(EXAMPLE);
    setBrandName(EXAMPLE.brandName);
    setStep(3);
  };

  const canNext = useMemo(() => {
    switch (step) {
      case 1: return !!logoFile || !!logoPreview;
      case 2: return answers.business.trim().length > 2 && answers.personality.length > 0;
      case 3: return true;
      default: return true;
    }
  }, [step, logoFile, logoPreview, answers]);

  const handleFile = useCallback(async (file: File) => {
    if (!/\.(svg|png|jpe?g)$/i.test(file.name)) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
    if (!/\.svg$/i.test(file.name)) {
      const cols = await detectColours(file);
      setDetected(cols);
      setAnswers((a) => ({ ...a, detectedColors: cols.length ? cols : undefined }));
    } else {
      setDetected([]);
      setAnswers((a) => ({ ...a, detectedColors: undefined }));
    }
  }, []);

  const generate = (data: BrandData) => {
    // colour direction (logo colours / curated / custom overrides) is already
    // baked into `data` by the generator from the answers committed in step 03
    setSystem(data);
    setStep(5);
  };

  const save = async () => {
    if (!system) return;
    setSaveError(null);
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent("/build?resume=1")}`);
      return;
    }
    try {
      // brand row first so the logo upload is brand-scoped in object storage
      const data = { ...system, logo: { ...system.logo, assetKey: null, fileName: logoFile?.name ?? system.logo.fileName } };
      const brand = await createBrand.mutateAsync({
        name: brandName, business: answers.business, data,
      });
      let assetKey: string | null = null;
      if (logoFile) {
        const contentBase64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result).split(",")[1]);
          r.onerror = reject;
          r.readAsDataURL(logoFile);
        });
        const up = await uploadLogo.mutateAsync({
          brandId: brand.id,
          assetType: "logo",
          name: logoFile.name,
          contentBase64,
          contentType: logoFile.type,
        });
        assetKey = up.key;
        await trpcUpdateBrand.mutateAsync({
          id: brand.id,
          data: { ...data, logo: { ...data.logo, assetKey } },
        });
      }
      // automatic imagery package — no user action; server runs it in the background
      launchImagery.mutate({ brandId: brand.id });
      navigate(`/studio/${brand.id}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed. Please retry.");
    }
  };

  // resume after login
  useEffect(() => {
    if (params.get("resume") === "1" && isAuthenticated && system && step === 5) save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, isAuthenticated]);

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-28 md:px-8">
        {/* progress rail */}
        {step > 0 && step < 6 && (
          <div className="mb-10 flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`h-1 flex-1 transition-colors duration-500 ${s <= step ? "bg-brand-accent" : "bg-[color:var(--line)]"}`} />
            ))}
          </div>
        )}

        {/* STEP 0 — first screen (§7) */}
        {step === 0 && (
          <div className="text-center">
            <p className="font-mono-tech text-[11px] uppercase tracking-[0.24em] text-ink-faint">BrandKit360 — Start</p>
            <h1 className="mx-auto mt-6 max-w-2xl text-balance text-4xl leading-[1.08] md:text-[3.2rem]">
              Start with <span className="text-brand-accent">your logo.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-ink-soft">
              Tell us a little about your business and we'll help turn your logo into
              a complete brand system. Explore freely — we'll only ask you to sign in
              when it's time to save.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setStep(1)}
                className="btn-clip breathe bg-brand-accent px-9 py-4 text-sm font-semibold tracking-wide text-white"
              >
                <span className="btn-mask bg-ink" aria-hidden />
                Start Building
              </button>
              <button
                onClick={goExample}
                className="border border-[color:var(--line-strong)] px-9 py-4 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                See an Example
              </button>
            </div>
          </div>
        )}

        {/* STEP 1 — logo upload (§8) */}
        {step === 1 && (
          <div>
            <StepTitle n="01" title="Upload your logo" sub="SVG, PNG or JPG. Your file stays on your device until you save." />
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
              className="mt-8 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-[color:var(--line-strong)] bg-panel px-6 py-16 transition-colors hover:border-brand-accent"
            >
              <input type="file" accept=".svg,.png,.jpg,.jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {logoPreview ? (
                <div className="brand-grid-bg-fine flex h-48 w-full max-w-sm items-center justify-center bg-paper p-8">
                  <img src={logoPreview} alt="Uploaded logo preview" className="max-h-36 max-w-full object-contain" />
                </div>
              ) : (
                <>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" className="text-ink-faint" aria-hidden>
                    <path d="M12 16V4m0 0 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <p className="mt-4 text-sm font-semibold text-ink">Drop your logo here, or click to browse</p>
                  <p className="mt-1 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-ink-faint">SVG · PNG · JPG — PDF where technically possible</p>
                </>
              )}
            </label>

            {logoPreview && (
              <div className="mt-6 hairline-panel bg-panel p-5">
                <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Detected — from your file, labelled honestly</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detected.length ? detected.map((hex) => (
                    <span key={hex} className="flex items-center gap-2 border border-[color:var(--line)] bg-paper px-2.5 py-1.5">
                      <span className="h-4 w-4 border border-black/10" style={{ background: hex }} />
                      <code className="font-mono-tech text-[11px] text-ink">{hex.toUpperCase()}</code>
                    </span>
                  )) : <span className="text-[13px] text-ink-soft">No raster colours detected (SVG or a light logo). We'll suggest a palette in the next step instead.</span>}
                </div>
              </div>
            )}

            <WizardNav onBack={() => setStep(0)} onNext={() => setStep(2)} canNext={canNext} />
          </div>
        )}

        {/* STEP 2 — business questionnaire (§9: exactly five questions) */}
        {step === 2 && (
          <div>
            <StepTitle n="02" title="Tell us about your business" sub="Five questions. Visual cards, not jargon." />
            <div className="mt-8 space-y-10">
              <div>
                <Q number="Q1" text="What does your business do?" />
                <input
                  value={answers.business}
                  onChange={(e) => setAnswers({ ...answers, business: e.target.value })}
                  placeholder="e.g. Small-batch coffee roastery and café…"
                  className="mt-3 w-full border border-[color:var(--line-strong)] bg-panel px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-accent"
                />
                <input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Brand name (e.g. Northpine)"
                  className="mt-3 w-full border border-[color:var(--line-strong)] bg-panel px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-accent"
                />
              </div>

              <div>
                <Q number="Q2" text="Who are your customers?" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {AUDIENCE_SUGGESTIONS.map((a) => (
                    <Chip key={a} active={answers.audience.includes(a)} onClick={() => toggle(answers, setAnswers, "audience", a)}>{a}</Chip>
                  ))}
                </div>
              </div>

              <div>
                <Q number="Q3" text="How should your brand feel? (pick 3–5)" />
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {PERSONALITY_OPTIONS.map((p) => (
                    <PersonalityCard key={p} label={p} active={answers.personality.includes(p)}
                      onClick={() => {
                        const cur = answers.personality;
                        const next = cur.includes(p) ? cur.filter((x) => x !== p)
                          : cur.length >= 5 ? cur : [...cur, p];
                        setAnswers({ ...answers, personality: next });
                      }} />
                  ))}
                </div>
                <p className="mt-2 font-mono-tech text-[10px] tracking-[0.14em] text-ink-faint">{answers.personality.length}/5 selected</p>
              </div>

              <div>
                <Q number="Q4" text="Where will you use your brand?" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {USAGE_OPTIONS.map((u) => (
                    <Chip key={u} active={answers.usage.includes(u)} onClick={() => toggle(answers, setAnswers, "usage", u)}>{u}</Chip>
                  ))}
                </div>
              </div>

              <div>
                <Q number="Q5" text="Which brands do you admire — and what should yours avoid?" />
                <textarea
                  value={answers.admired}
                  onChange={(e) => setAnswers({ ...answers, admired: e.target.value })}
                  placeholder="e.g. Patagonia — quiet confidence; I like how they…"
                  rows={2}
                  className="mt-3 w-full border border-[color:var(--line-strong)] bg-panel px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-accent"
                />
                <textarea
                  value={answers.avoid}
                  onChange={(e) => setAnswers({ ...answers, avoid: e.target.value })}
                  placeholder="What should your brand avoid? (optional)"
                  rows={2}
                  className="mt-3 w-full border border-[color:var(--line-strong)] bg-panel px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand-accent"
                />
              </div>
            </div>
            <WizardNav onBack={() => setStep(1)} onNext={() => setStep(3)} canNext={canNext} />
          </div>
        )}

        {/* STEP 3 — colour direction & typography (§10) */}
        {step === 3 && (
          <VisualDirectionStep
            answers={answers}
            setAnswers={setAnswers}
            brandName={brandName || answers.brandName}
            detected={detected}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {/* STEP 4 — Brand DNA (§11) */}
        {step === 4 && (
          <DnaReview
            answers={{ ...answers, brandName: brandName || "Your Brand" }}
            onBack={() => setStep(3)}
            onNext={(data) => generate(data)}
          />
        )}

        {/* STEP 5 — generate & review */}
        {step === 5 && system && (
          <div>
            <StepTitle n="05" title="Your brand system is ready" sub="Review it below, then save it to your studio. Everything stays editable forever." />
            <SystemSummaryPreview data={system} />
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={save}
                disabled={createBrand.isPending || uploadLogo.isPending}
                className="btn-clip breathe bg-brand-accent px-8 py-4 text-sm font-semibold tracking-wide text-white disabled:opacity-50"
              >
                <span className="btn-mask bg-ink" aria-hidden />
                {createBrand.isPending || uploadLogo.isPending ? "Saving…" : isAuthenticated ? "Save to my Studio" : "Sign in to save"}
              </button>
              <button onClick={() => setStep(4)} className="border border-[color:var(--line-strong)] px-8 py-4 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper">
                Back to DNA
              </button>
              {!isAuthenticated && (
                <p className="w-full text-[13px] text-ink-soft">
                  We don't force accounts on first contact — but to keep your system safe
                  and versioned, saving requires a free sign-in.
                </p>
              )}
              {saveError && <p className="w-full border border-destructive/40 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">{saveError}</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );

  function toggle(a: WizardAnswers, set: (x: WizardAnswers) => void, key: "audience" | "usage", v: string) {
    const cur = a[key];
    set({ ...a, [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  }
}

function StepTitle({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <div>
      <p className="font-mono-tech text-[11px] tracking-[0.24em] text-brand-accent">{n}</p>
      <h1 className="mt-2 text-3xl md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">{sub}</p>
    </div>
  );
}

function Q({ number, text }: { number: string; text: string }) {
  return (
    <p className="text-[15px] font-semibold text-ink">
      <span className="mr-2 font-mono-tech text-[11px] tracking-[0.14em] text-brand-accent">{number}</span>
      {text}
    </p>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`border px-3.5 py-2 text-[13px] transition-colors duration-300 ${active ? "border-ink bg-ink text-paper" : "border-[color:var(--line-strong)] bg-panel text-ink hover:border-ink"}`}
    >
      {children}
    </button>
  );
}

function PersonalityCard({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden border p-4 text-left transition-all duration-300 ${active ? "border-ink bg-ink text-paper" : "border-[color:var(--line-strong)] bg-panel hover:border-ink"}`}
    >
      <span className={`font-display text-lg ${active ? "text-paper" : "text-ink"}`}>{label}</span>
      <span className={`mt-3 block h-px w-full origin-left transition-transform duration-500 ${active ? "bg-brand-accent" : "bg-[color:var(--line)] group-hover:bg-[color:var(--line-strong)]"}`} />
      <span className={`mt-3 block font-mono-tech text-[9px] uppercase tracking-[0.16em] ${active ? "text-brand-accent" : "text-ink-faint"}`}>
        {active ? "Selected" : "Tap to select"}
      </span>
    </button>
  );
}

function WizardNav({ onBack, onNext, canNext }: { onBack: () => void; onNext: () => void; canNext: boolean }) {
  return (
    <div className="mt-12 flex items-center justify-between">
      <button onClick={onBack} className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink">← Back</button>
      <button
        onClick={onNext}
        disabled={!canNext}
        className="btn-clip bg-ink px-8 py-3.5 text-sm font-semibold tracking-wide text-paper disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="btn-mask bg-brand-accent" aria-hidden />
        Continue
      </button>
    </div>
  );
}

/** §11 — Brand DNA review: editable, with refinement presets + AI (if entitled). */
function DnaReview({ answers, onBack, onNext }: { answers: WizardAnswers; onBack: () => void; onNext: (data: BrandData) => void }) {
  const draft = useMemo(() => generateBrandSystem(answers), [answers]);
  const [dna, setDna] = useState<BrandDNA>(draft.dna);
  const { isAuthenticated } = useAuth();
  const ent = trpc.plans.myEntitlements.useQuery(undefined, { enabled: isAuthenticated });
  const canAi = ent.data?.entitlements.includes("ai_studio");
  const refine = trpc.ai.refineDna.useMutation();
  const [aiInstruction, setAiInstruction] = useState("");

  const applyRefined = (patch: Partial<BrandDNA>) => setDna((d) => ({ ...d, ...patch }));

  return (
    <div>
      <StepTitle n="04" title="Build your Brand DNA" sub="The strategic core of the system. Edit anything — one change updates what depends on it, never the whole system." />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          {([
            ["essence", "Brand Essence"],
            ["positioning", "Positioning"],
            ["audience", "Audience"],
            ["promise", "Brand Promise"],
            ["toneOfVoice", "Tone of Voice"],
            ["visualDirection", "Visual Direction"],
          ] as const).map(([key, label]) => (
            <div key={key} className="hairline-panel bg-panel p-5">
              <div className="flex items-center justify-between">
                <label className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">{label}</label>
                <span className="font-mono-tech text-[9px] uppercase tracking-[0.14em] text-ok">editable</span>
              </div>
              <textarea
                value={dna[key]}
                onChange={(e) => setDna({ ...dna, [key]: e.target.value })}
                rows={key === "essence" || key === "positioning" ? 3 : 2}
                className="mt-2 w-full resize-y bg-transparent text-[14.5px] leading-relaxed text-ink outline-none"
              />
            </div>
          ))}
          <div className="hairline-panel bg-panel p-5">
            <label className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Keywords</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {dna.keywords.map((k) => (
                <span key={k} className="border border-[color:var(--line-strong)] bg-paper px-3 py-1 font-mono-tech text-[11px] text-ink">{k}</span>
              ))}
            </div>
          </div>
        </div>

        {/* refinement column */}
        <div className="space-y-4 self-start">
          <div className="hairline-panel bg-ink p-5 text-paper">
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-brand-accent">Refine with a phrase</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Make it more premium", "Make it more approachable", "This feels too corporate", "Make it more energetic"].map((p) => (
                <button
                  key={p}
                  onClick={() => setDna(nudgeDna(dna, p))}
                  className="border border-paper/25 px-3 py-1.5 text-[12px] text-paper/85 transition-colors hover:border-brand-accent hover:text-brand-accent"
                >
                  “{p}.”
                </button>
              ))}
            </div>
            {canAi ? (
              <div className="mt-5 border-t border-paper/15 pt-4">
                <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-paper/50">AI Brand Director — System Pro</p>
                <div className="mt-2 flex gap-2">
                  <input
                    value={aiInstruction}
                    onChange={(e) => setAiInstruction(e.target.value)}
                    placeholder="Ask for a refinement…"
                    className="min-w-0 flex-1 border border-paper/25 bg-transparent px-3 py-2 text-[13px] text-paper outline-none placeholder:text-paper/35 focus:border-brand-accent"
                  />
                  <button
                    disabled={refine.isPending || aiInstruction.trim().length < 2}
                    onClick={async () => {
                      const r = await refine.mutateAsync({ brandName: answers.brandName, business: answers.business, dna, instruction: aiInstruction });
                      applyRefined(r);
                    }}
                    className="bg-brand-accent px-4 text-[12px] font-semibold text-white disabled:opacity-40"
                  >
                    {refine.isPending ? "…" : "Ask"}
                  </button>
                </div>
                {refine.error && <p className="mt-2 text-[11px] text-brand-accent">{refine.error.message}</p>}
              </div>
            ) : (
              <p className="mt-5 border-t border-paper/15 pt-4 text-[12px] leading-relaxed text-paper/55">
                AI refinement unlocks with <Link to="/pricing" className="text-brand-accent underline">System Pro</Link>.
                The phrase presets above work on every plan.
              </p>
            )}
          </div>
          <div className="hairline-panel bg-panel p-5">
            <p className="text-[13px] leading-relaxed text-ink-soft">
              Personality: <strong className="text-ink">{dna.personality.join(" · ")}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <button onClick={onBack} className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink">← Back</button>
        <button
          onClick={() => onNext({ ...draft, dna, essence: dna.essence })}
          className="btn-clip breathe bg-brand-accent px-8 py-4 text-sm font-semibold tracking-wide text-white"
        >
          <span className="btn-mask bg-ink" aria-hidden />
          Generate my brand system
        </button>
      </div>
    </div>
  );
}

/** Compact preview of the generated system on the review step. */
export function SystemSummaryPreview({ data }: { data: BrandData }) {
  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      <div className="hairline-panel bg-panel p-6">
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Colour system</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {data.colors.list.map((c) => (
            <div key={c.role}>
              <div className="h-14 border border-[color:var(--line)]" style={{ background: c.hex }} />
              <p className="mt-1.5 text-[10.5px] font-semibold capitalize text-ink">{c.role}</p>
              <code className="font-mono-tech text-[9.5px] text-ink-faint">{c.hex.toUpperCase()}</code>
            </div>
          ))}
        </div>
      </div>
      <div className="hairline-panel bg-panel p-6">
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Typography</p>
        <p className="mt-4 text-4xl text-ink" style={{ fontFamily: fontStack(data.typography.heading), fontWeight: data.typography.heading.weights[0] ?? 500 }}>
          {data.typography.heading.family}
        </p>
        <p className="mt-1 text-sm text-ink-soft">with {data.typography.body.family} for text · {data.typography.mono.family} for labels</p>
        <p className="mt-4 border-t border-[color:var(--line)] pt-4 text-[12.5px] leading-relaxed text-ink-soft">{data.typography.note}</p>
      </div>
      <div className="hairline-panel bg-panel p-6">
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Voice — sample headlines</p>
        <ul className="mt-4 space-y-2.5">
          {data.voice.headlines.map((h) => (
            <li key={h} className="border-l-2 border-brand-accent pl-3 font-display text-[15px] text-ink">{h}</li>
          ))}
        </ul>
      </div>
      <div className="hairline-panel bg-panel p-6">
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-ink-faint">Applications</p>
        <ul className="mt-4 space-y-2">
          {data.applications.map((a) => (
            <li key={a} className="flex items-center gap-2.5 text-[13px] text-ink">
              <span className="h-1.5 w-1.5 bg-brand-accent" />
              {a}
            </li>
          ))}
        </ul>
        <p className="mt-5 border-t border-[color:var(--line)] pt-4 text-[12px] leading-relaxed text-ink-soft">
          Plus graphic language, photography direction, illustration, iconography, layout,
          design tokens and do's & don'ts — {data.rules.do.length + data.rules.dont.length} rules total.
        </p>
      </div>
    </div>
  );
}
