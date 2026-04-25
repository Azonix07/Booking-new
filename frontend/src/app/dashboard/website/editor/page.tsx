"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { PageLoader } from "@/components/page-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  ExternalLink,
  Palette,
  Layout,
  Layers,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Send,
  Loader2,
  MousePointerClick,
  PanelLeftClose,
  PanelLeftOpen,
  Wand2,
} from "lucide-react";
import type {
  WebsiteConfig,
  WebsiteSection,
  SectionType,
  Tenant,
  Service,
  SubscriptionPlan,
} from "@/lib/types";
import { PlanUpgradePrompt } from "@/components/plan-upgrade-prompt";

const CUSTOMIZATION_PLANS: SubscriptionPlan[] = [
  "standard",
  "ai",
  "full_service",
];

const SECTION_TYPES: SectionType[] = [
  "hero", "services", "about", "testimonials", "gallery",
  "contact", "faq", "pricing", "team", "cta", "custom",
];

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero Banner",
  services: "Services",
  about: "About Us",
  testimonials: "Testimonials",
  gallery: "Gallery",
  contact: "Contact",
  faq: "FAQ",
  pricing: "Pricing",
  team: "Team",
  cta: "Call to Action",
  custom: "Custom Section",
};

const FONT_OPTIONS = [
  "Inter", "Montserrat", "Playfair Display", "Rajdhani", "Nunito",
  "Lora", "Source Sans Pro", "Poppins", "Roboto", "Open Sans",
];

type EditorPanel = "sections" | "theme" | "layout" | "seo" | "ai";

export default function WebsiteEditorPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<WebsiteConfig | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activePanel, setActivePanel] = useState<EditorPanel>("sections");
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>("section");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.tenantId) return;
    api.setTenantId(user.tenantId);
    Promise.all([
      api.get<WebsiteConfig>("/website").catch(() => null),
      api.get<Tenant>("/shop").catch(() => null),
      api.get<Service[]>("/services").catch(() => []),
    ]).then(([cfg, t, svcs]) => {
      setConfig(cfg);
      setTenant(t);
      setServices(svcs || []);
      setLoading(false);
    });
  }, [user]);

  const saveAll = useCallback(async () => {
    if (!config) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/website", {
        theme: config.theme,
        layout: config.layout,
        sections: config.sections,
        seo: config.seo,
        customCSS: config.customCSS,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  }, [config]);

  const toggleVisibility = (index: number) => {
    if (!config) return;
    const sections = [...config.sections];
    sections[index] = { ...sections[index], isVisible: !sections[index].isVisible };
    setConfig({ ...config, sections });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    if (!config) return;
    const sections = [...config.sections];
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const tmpOrder = sections[index].order;
    sections[index] = { ...sections[index], order: sections[target].order };
    sections[target] = { ...sections[target], order: tmpOrder };
    sections.sort((a, b) => a.order - b.order);
    setConfig({ ...config, sections });
  };

  const addSection = (type: SectionType) => {
    if (!config) return;
    const maxOrder = config.sections.length > 0 ? Math.max(...config.sections.map((s) => s.order)) : 0;
    const newSection: WebsiteSection = {
      type,
      order: maxOrder + 1,
      isVisible: true,
      config: getDefaultSectionConfig(type),
    };
    setConfig({ ...config, sections: [...config.sections, newSection] });
  };

  const removeSection = (index: number) => {
    if (!config) return;
    setConfig({ ...config, sections: config.sections.filter((_, i) => i !== index) });
    if (selectedSection === index) setSelectedSection(null);
  };

  const updateSectionConfig = (index: number, key: string, value: any) => {
    if (!config) return;
    const sections = [...config.sections];
    sections[index] = { ...sections[index], config: { ...sections[index].config, [key]: value } };
    setConfig({ ...config, sections });
  };

  const [aiError, setAiError] = useState("");
  const [aiSuccess, setAiSuccess] = useState(false);

  const handleAiEdit = async () => {
    if (!aiPrompt.trim() || !config) return;
    setAiLoading(true);
    setAiError("");
    setAiSuccess(false);
    try {
      const result = await api.post<WebsiteConfig>("/website/ai-edit", {
        target: selectedTarget,
        sectionIndex: selectedTarget === "section" ? selectedSection : undefined,
        prompt: aiPrompt,
      });
      if (result) setConfig(result);
      setAiPrompt("");
      setAiSuccess(true);
      setTimeout(() => setAiSuccess(false), 3000);
    } catch (err: any) {
      setAiError(err?.message || "AI edit failed. Please try again.");
    }
    setAiLoading(false);
  };

  const handleSectionClick = (index: number) => {
    setSelectedSection(index);
    setSelectedTarget("section");
    setActivePanel("ai");
  };

  if (loading) return <PageLoader />;

  const plan = user?.onboarding?.subscription?.plan;
  const planActive = user?.onboarding?.subscription?.status === "active";
  if (!plan || !planActive || !CUSTOMIZATION_PLANS.includes(plan)) {
    return (
      <PlanUpgradePrompt
        feature="Website Customization"
        description="Edit your theme, layout, and page sections to match your brand. Available on Standard, AI, and Full-Service plans."
        requiredPlans={CUSTOMIZATION_PLANS}
      />
    );
  }
  const isAiPlan = plan === "ai" || plan === "full_service";

  if (!config) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Wand2 className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No website created yet.</p>
          <a href="/dashboard/website">
            <Button>Create Website</Button>
          </a>
        </div>
      </div>
    );
  }

  const sortedSections = [...config.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-6">
      {/* ─── Left sidebar ─── */}
      {sidebarOpen && (
        <div className="w-80 border-r bg-background flex flex-col shrink-0 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-1">
              {saved && <span className="text-xs text-green-600 font-medium">Saved!</span>}
              <Button onClick={saveAll} disabled={saving} size="sm" variant="default">
                <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "..." : "Save"}
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <a href={`/store/${tenant?.slug || user?.tenantId}?preview=true`} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Preview">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(false)}>
                <PanelLeftClose className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex border-b">
            {([
              { id: "sections", icon: Layers, label: "Sections" },
              { id: "theme", icon: Palette, label: "Theme" },
              { id: "layout", icon: Layout, label: "Layout" },
              ...(isAiPlan
                ? [{ id: "ai" as const, icon: Sparkles, label: "AI Edit" }]
                : []),
            ] as { id: EditorPanel; icon: any; label: string }[]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className={`flex-1 text-center py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                  activePanel === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5 mx-auto mb-0.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* ─── SECTIONS PANEL ─── */}
            {activePanel === "sections" && (
              <>
                {sortedSections.map((section, i) => {
                  const realIndex = config.sections.indexOf(section);
                  const isSelected = selectedSection === realIndex;
                  return (
                    <div
                      key={`${section.type}-${i}`}
                      className={`rounded-lg border p-3 cursor-pointer transition-all ${
                        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:border-primary/40"
                      }`}
                      onClick={() => { setSelectedSection(realIndex); setSelectedTarget("section"); }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{SECTION_LABELS[section.type] || section.type}</span>
                        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveSection(realIndex, -1)}>
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveSection(realIndex, 1)}>
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleVisibility(realIndex)}>
                            {section.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeSection(realIndex)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Inline section config editor */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
                          <SectionConfigEditor
                            section={section}
                            index={realIndex}
                            onUpdate={updateSectionConfig}
                          />
                          {isAiPlan && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => setActivePanel("ai")}
                            >
                              <Sparkles className="h-3 w-3 mr-1" /> Edit with AI
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <Separator />
                <p className="text-xs text-muted-foreground">Add section:</p>
                <div className="flex flex-wrap gap-1.5">
                  {SECTION_TYPES.filter(
                    (t) => !config.sections.some((s) => s.type === t) || t === "custom",
                  ).map((type) => (
                    <Button key={type} variant="outline" size="sm" className="text-xs h-7" onClick={() => addSection(type)}>
                      <Plus className="h-3 w-3 mr-1" /> {SECTION_LABELS[type]}
                    </Button>
                  ))}
                </div>
              </>
            )}

            {/* ─── THEME PANEL ─── */}
            {activePanel === "theme" && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Colors</p>
                {([
                  ["primaryColor", "Primary"],
                  ["secondaryColor", "Secondary"],
                  ["backgroundColor", "Background"],
                  ["textColor", "Text"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.theme[key]}
                        onChange={(e) => setConfig({ ...config, theme: { ...config.theme, [key]: e.target.value } })}
                        className="h-9 w-9 rounded border cursor-pointer shrink-0"
                      />
                      <Input
                        value={config.theme[key]}
                        onChange={(e) => setConfig({ ...config, theme: { ...config.theme, [key]: e.target.value } })}
                        className="font-mono text-xs h-9"
                      />
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="space-y-1">
                  <Label className="text-xs">Font Family</Label>
                  <select
                    value={config.theme.fontFamily}
                    onChange={(e) => setConfig({ ...config, theme: { ...config.theme, fontFamily: e.target.value } })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mode</Label>
                  <div className="flex gap-2">
                    {(["light", "dark"] as const).map((mode) => (
                      <Button
                        key={mode}
                        variant={config.theme.mode === mode ? "default" : "outline"}
                        size="sm"
                        className="flex-1 capitalize text-xs"
                        onClick={() => setConfig({ ...config, theme: { ...config.theme, mode } })}
                      >
                        {mode}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Border Radius</Label>
                  <Input
                    value={config.theme.borderRadius}
                    onChange={(e) => setConfig({ ...config, theme: { ...config.theme, borderRadius: e.target.value } })}
                    className="text-xs h-9"
                  />
                </div>
                {isAiPlan && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => { setSelectedTarget("theme"); setActivePanel("ai"); }}
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> Edit Theme with AI
                  </Button>
                )}
              </div>
            )}

            {/* ─── LAYOUT PANEL ─── */}
            {activePanel === "layout" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Header Style</Label>
                  {(["left-aligned", "centered", "transparent"] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setConfig({ ...config, layout: { ...config.layout, headerStyle: style } })}
                      className={`w-full text-left rounded-lg border px-3 py-2 text-xs transition-colors ${
                        config.layout.headerStyle === style ? "border-primary bg-primary/5 font-medium" : "border-border hover:border-primary/40"
                      }`}
                    >
                      {style.replace("-", " ")}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Footer Style</Label>
                  {(["minimal", "full", "none"] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setConfig({ ...config, layout: { ...config.layout, footerStyle: style } })}
                      className={`w-full text-left rounded-lg border px-3 py-2 text-xs transition-colors ${
                        config.layout.footerStyle === style ? "border-primary bg-primary/5 font-medium" : "border-border hover:border-primary/40"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Width</Label>
                  <Input
                    value={config.layout.maxWidth}
                    onChange={(e) => setConfig({ ...config, layout: { ...config.layout, maxWidth: e.target.value } })}
                    className="text-xs h-9"
                  />
                </div>
                {isAiPlan && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => { setSelectedTarget("layout"); setActivePanel("ai"); }}
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> Edit Layout with AI
                  </Button>
                )}
              </div>
            )}

            {/* ─── AI EDIT PANEL ─── */}
            {activePanel === "ai" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">AI Editor</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select what to edit, then describe your changes. AI will apply them.
                </p>

                {/* Target selector */}
                <div className="space-y-2">
                  <Label className="text-xs">Editing Target</Label>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      variant={selectedTarget === "theme" ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setSelectedTarget("theme")}
                    >
                      <Palette className="h-3 w-3 mr-1" /> Theme
                    </Badge>
                    <Badge
                      variant={selectedTarget === "layout" ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setSelectedTarget("layout")}
                    >
                      <Layout className="h-3 w-3 mr-1" /> Layout
                    </Badge>
                    {sortedSections.map((section, i) => {
                      const realIndex = config.sections.indexOf(section);
                      return (
                        <Badge
                          key={`${section.type}-${i}`}
                          variant={selectedTarget === "section" && selectedSection === realIndex ? "default" : "outline"}
                          className="cursor-pointer text-xs capitalize"
                          onClick={() => { setSelectedTarget("section"); setSelectedSection(realIndex); }}
                        >
                          {section.type}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {selectedTarget === "section" && selectedSection !== null && config.sections[selectedSection] && (
                  <SectionEditGuide section={config.sections[selectedSection]} />
                )}

                {selectedTarget === "theme" && (
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                    <p className="text-xs font-semibold">What you can change:</p>
                    <div className="flex flex-wrap gap-1">
                      {["Primary Color", "Secondary Color", "Background", "Text Color", "Font Family", "Border Radius", "Dark/Light Mode"].map((p) => (
                        <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTarget === "layout" && (
                  <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                    <p className="text-xs font-semibold">What you can change:</p>
                    <div className="flex flex-wrap gap-1">
                      {["Header Style", "Footer Style", "Page Width"].map((p) => (
                        <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Prompt */}
                <div className="space-y-2">
                  <Label className="text-xs">Describe your edit</Label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={getPlaceholder(selectedTarget, selectedTarget === "section" && selectedSection !== null ? config.sections[selectedSection] : null)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAiEdit();
                      }
                    }}
                  />
                </div>

                <Button
                  onClick={handleAiEdit}
                  disabled={!aiPrompt.trim() || aiLoading}
                  className="w-full"
                  size="sm"
                >
                  {aiLoading ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Applying...</>
                  ) : (
                    <><Send className="h-3.5 w-3.5 mr-1" /> Apply with AI</>
                  )}
                </Button>

                {/* Success / Error feedback */}
                {aiSuccess && (
                  <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                    ✓ AI changes applied successfully! Remember to save.
                  </div>
                )}
                {aiError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                    {aiError}
                    <button className="ml-2 underline" onClick={() => setAiError("")}>Dismiss</button>
                  </div>
                )}

                {/* Categorized Quick prompts */}
                <QuickPromptPanel
                  target={selectedTarget}
                  section={selectedTarget === "section" && selectedSection !== null ? config.sections[selectedSection] : null}
                  onSelect={setAiPrompt}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Sidebar toggle (when closed) ─── */}
      {!sidebarOpen && (
        <div className="border-r flex flex-col items-center py-3 px-1.5 gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(true)}>
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
          <Button onClick={saveAll} disabled={saving} size="icon" className="h-8 w-8" variant="default">
            <Save className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* ─── Live Preview ─── */}
      <div className="flex-1 overflow-auto bg-muted/30" ref={previewRef}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-background/80 backdrop-blur border-b">
          <div className="flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Click any section in the preview to edit it</span>
          </div>
          <a href={`/store/${tenant?.slug || user?.tenantId}?preview=true`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="text-xs h-7">
              <ExternalLink className="h-3 w-3 mr-1" /> Full Preview
            </Button>
          </a>
        </div>

        {/* Rendered preview */}
        <div className="min-h-full" style={{
          backgroundColor: config.theme.backgroundColor,
          color: config.theme.textColor,
          fontFamily: config.theme.fontFamily,
        }}>
          {/* Header preview */}
          <div
            className={`px-6 py-4 flex items-center justify-between cursor-pointer border-2 border-transparent transition-colors ${
              selectedTarget === "layout" ? "border-primary/50 bg-primary/5" : "hover:border-primary/20"
            }`}
            onClick={() => { setSelectedTarget("layout"); setActivePanel("ai"); }}
            style={{
              backgroundColor: config.layout.headerStyle === "transparent"
                ? "transparent"
                : config.theme.backgroundColor,
              maxWidth: config.layout.maxWidth,
              margin: "0 auto",
            }}
          >
            <span className="font-bold" style={{ color: config.theme.textColor }}>
              {tenant?.name || "Your Business"}
            </span>
            <span
              className="px-4 py-2 rounded text-sm text-white font-medium"
              style={{ backgroundColor: config.theme.primaryColor, borderRadius: config.theme.borderRadius }}
            >
              Book Now
            </span>
          </div>

          {/* Sections preview */}
          {sortedSections.map((section, i) => {
            if (!section.isVisible) return null;
            const realIndex = config.sections.indexOf(section);
            const isSelected = selectedTarget === "section" && selectedSection === realIndex;
            return (
              <div
                key={`${section.type}-${i}`}
                className={`relative cursor-pointer border-2 transition-all ${
                  isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/20"
                }`}
                onClick={() => handleSectionClick(realIndex)}
              >
                {/* Section label overlay */}
                <div className={`absolute top-2 left-2 z-10 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  <Badge variant="default" className="text-xs shadow-lg capitalize">
                    {section.type}
                  </Badge>
                </div>

                <PreviewSection
                  section={section}
                  tenant={tenant}
                  services={services}
                  config={config}
                />
              </div>
            );
          })}

          {/* Footer preview */}
          {config.layout.footerStyle !== "none" && (
            <div
              className={`py-8 px-6 text-center text-sm cursor-pointer border-2 transition-colors ${
                selectedTarget === "layout" ? "border-primary/50" : "border-transparent hover:border-primary/20"
              }`}
              onClick={() => { setSelectedTarget("layout"); setActivePanel("ai"); }}
              style={{
                borderTopWidth: "1px",
                borderTopColor: `color-mix(in srgb, ${config.theme.textColor} 10%, transparent)`,
                color: `color-mix(in srgb, ${config.theme.textColor} 60%, transparent)`,
              }}
            >
              &copy; {new Date().getFullYear()} {tenant?.name || "Your Business"}. All rights reserved.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Preview Section (simplified renders for the editor) ──────────────────────

function PreviewSection({
  section,
  tenant,
  services,
  config,
}: {
  section: WebsiteSection;
  tenant: Tenant | null;
  services: Service[];
  config: WebsiteConfig;
}) {
  const cfg = section.config || {};
  const theme = config.theme;
  // Per-section background: use section config override or fall back to theme
  const sectionBg = cfg.backgroundColor || theme.backgroundColor;
  const altBg = cfg.backgroundColor || `color-mix(in srgb, ${theme.textColor} 3%, ${theme.backgroundColor})`;

  switch (section.type) {
    case "hero":
      return (
        <section
          className="py-20 px-6 text-center"
          style={{
            background: cfg.backgroundImage
              ? `url(${cfg.backgroundImage}) center/cover no-repeat`
              : cfg.backgroundColor
                ? cfg.backgroundColor
                : `linear-gradient(135deg, ${theme.primaryColor}15, ${theme.backgroundColor}, ${theme.secondaryColor}15)`,
          }}
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ color: theme.textColor }}>
            {cfg.headline || cfg.title || tenant?.name || "Welcome"}
          </h1>
          <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: `color-mix(in srgb, ${theme.textColor} 70%, transparent)` }}>
            {cfg.subtitle || cfg.subheadline || "Book your experience today"}
          </p>
          <span
            className="inline-block mt-6 px-6 py-3 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}
          >
            {cfg.ctaText || "Book Now"}
          </span>
        </section>
      );

    case "services":
      return (
        <section className="py-16 px-6" style={{ backgroundColor: sectionBg }}>
          <div className="mx-auto" style={{ maxWidth: config.layout.maxWidth }}>
            <h2 className="text-2xl font-bold text-center mb-8" style={{ color: theme.textColor }}>
              {cfg.title || "Our Services"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {services.slice(0, 6).map((svc) => (
                <div
                  key={svc._id}
                  className="rounded-lg border p-4"
                  style={{ borderColor: `color-mix(in srgb, ${theme.textColor} 10%, transparent)`, borderRadius: theme.borderRadius }}
                >
                  <h3 className="font-semibold" style={{ color: theme.textColor }}>{svc.name}</h3>
                  {svc.description && (
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: `color-mix(in srgb, ${theme.textColor} 60%, transparent)` }}>
                      {svc.description}
                    </p>
                  )}
                  <p className="mt-2 font-bold" style={{ color: theme.primaryColor }}>₹{svc.price}</p>
                </div>
              ))}
              {services.length === 0 && (
                <div className="col-span-3 text-center py-8 text-sm" style={{ color: `color-mix(in srgb, ${theme.textColor} 40%, transparent)` }}>
                  Services will appear here
                </div>
              )}
            </div>
          </div>
        </section>
      );

    case "about":
      return (
        <section className="py-16 px-6" style={{ backgroundColor: altBg }}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.textColor }}>{cfg.title || "About Us"}</h2>
            <p style={{ color: `color-mix(in srgb, ${theme.textColor} 70%, transparent)` }}>
              {cfg.content || tenant?.description || "We provide the best experience for our customers."}
            </p>
          </div>
        </section>
      );

    case "testimonials":
      return (
        <section className="py-16 px-6" style={{ backgroundColor: sectionBg }}>
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: theme.textColor }}>
            {cfg.title || "What Our Customers Say"}
          </h2>
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {(cfg.items?.length > 0 ? cfg.items : [
              { text: "Amazing experience!", author: "Customer", rating: 5 },
              { text: "Will definitely come back!", author: "Customer", rating: 5 },
              { text: "Best in the city!", author: "Customer", rating: 5 },
            ]).slice(0, 3).map((item: any, i: number) => (
              <div key={i} className="rounded-lg border p-4" style={{ borderColor: `color-mix(in srgb, ${theme.textColor} 10%, transparent)`, borderRadius: theme.borderRadius }}>
                <div className="flex mb-2">
                  {Array.from({ length: item.rating || 5 }).map((_, j) => (
                    <span key={j} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm italic" style={{ color: `color-mix(in srgb, ${theme.textColor} 70%, transparent)` }}>
                  &ldquo;{item.text}&rdquo;
                </p>
                <p className="text-xs font-medium mt-2" style={{ color: theme.textColor }}>— {item.author}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "contact":
      return (
        <section className="py-16 px-6" style={{ backgroundColor: altBg }}>
          <h2 className="text-2xl font-bold text-center mb-6" style={{ color: theme.textColor }}>
            {cfg.title || "Contact Us"}
          </h2>
          <div className="max-w-md mx-auto text-center text-sm" style={{ color: `color-mix(in srgb, ${theme.textColor} 70%, transparent)` }}>
            {cfg.phone && <p>📞 {cfg.phone}</p>}
            {cfg.email && <p className="mt-1">✉️ {cfg.email}</p>}
            {tenant?.address?.street && <p className="mt-1">📍 {[tenant.address.street, tenant.address.city].filter(Boolean).join(", ")}</p>}
          </div>
        </section>
      );

    case "faq":
      return (
        <section className="py-16 px-6" style={{ backgroundColor: sectionBg }}>
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: theme.textColor }}>
            {cfg.title || "FAQ"}
          </h2>
          <div className="max-w-2xl mx-auto space-y-2">
            {(cfg.items || []).slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="rounded-lg border p-4" style={{ borderColor: `color-mix(in srgb, ${theme.textColor} 10%, transparent)`, borderRadius: theme.borderRadius }}>
                <p className="font-medium text-sm" style={{ color: theme.textColor }}>{item.question || item.q}</p>
                <p className="text-xs mt-1" style={{ color: `color-mix(in srgb, ${theme.textColor} 60%, transparent)` }}>{item.answer || item.a}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "pricing":
      return (
        <section className="py-16 px-6" style={{ backgroundColor: altBg }}>
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: theme.textColor }}>
            {cfg.title || "Pricing"}
          </h2>
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {services.slice(0, 3).map((svc, i) => (
              <div key={svc._id} className="rounded-lg border p-6 text-center" style={{
                borderColor: i === 1 ? theme.primaryColor : `color-mix(in srgb, ${theme.textColor} 10%, transparent)`,
                borderRadius: theme.borderRadius,
              }}>
                <h3 className="font-semibold" style={{ color: theme.textColor }}>{svc.name}</h3>
                <p className="text-3xl font-bold mt-3" style={{ color: theme.primaryColor }}>₹{svc.price}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "cta":
      return (
        <section className="py-16 px-6 text-center" style={{ backgroundColor: cfg.backgroundColor || theme.primaryColor }}>
          <h2 className="text-2xl font-bold text-white">{cfg.title || "Ready to Book?"}</h2>
          <p className="mt-3 text-white/80">{cfg.subtitle || "Reserve your spot now!"}</p>
          <span
            className="inline-block mt-6 px-6 py-3 text-sm font-medium rounded-lg"
            style={{ backgroundColor: "#fff", color: theme.primaryColor, borderRadius: theme.borderRadius }}
          >
            {cfg.buttonText || "Book Now"}
          </span>
        </section>
      );

    case "team":
      return (
        <section className="py-16 px-6" style={{ backgroundColor: sectionBg }}>
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: theme.textColor }}>
            {cfg.title || "Our Team"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {(cfg.members?.length > 0 ? cfg.members : [{ name: "Team Member", role: "Role" }]).map((m: any, i: number) => (
              <div key={i} className="text-center">
                <div className="h-16 w-16 rounded-full mx-auto flex items-center justify-center text-lg font-bold" style={{
                  backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 15%, ${theme.backgroundColor})`,
                  color: theme.primaryColor,
                }}>
                  {m.name?.charAt(0) || "?"}
                </div>
                <p className="font-medium text-sm mt-3" style={{ color: theme.textColor }}>{m.name}</p>
                <p className="text-xs" style={{ color: `color-mix(in srgb, ${theme.textColor} 50%, transparent)` }}>{m.role}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "gallery":
      return (
        <section className="py-16 px-6" style={{ backgroundColor: sectionBg }}>
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: theme.textColor }}>{cfg.title || "Gallery"}</h2>
          <div className={`grid grid-cols-${cfg.columns || 3} gap-3 max-w-3xl mx-auto`}>
            {cfg.images?.length > 0
              ? cfg.images.map((img: any, i: number) => (
                <div key={i} className="aspect-video rounded-lg overflow-hidden" style={{ borderRadius: theme.borderRadius }}>
                  <img
                    src={img.url || img}
                    alt={img.alt || img.caption || `Gallery image ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.classList.add("flex", "items-center", "justify-center");
                      (e.target as HTMLImageElement).parentElement!.style.backgroundColor = `color-mix(in srgb, ${theme.primaryColor} 15%, ${theme.backgroundColor})`;
                      (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-2xl">📸</span>`;
                    }}
                  />
                  {img.caption && (
                    <p className="text-xs text-center mt-1 truncate" style={{ color: `color-mix(in srgb, ${theme.textColor} 60%, transparent)` }}>
                      {img.caption}
                    </p>
                  )}
                </div>
              ))
              : [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-video rounded-lg flex items-center justify-center text-2xl" style={{
                  backgroundColor: `color-mix(in srgb, ${theme.primaryColor} ${8 + i * 3}%, ${theme.backgroundColor})`,
                  borderRadius: theme.borderRadius,
                }}>
                  📸
                </div>
              ))
            }
          </div>
        </section>
      );

    case "custom":
      return (
        <section className="py-16 px-6" style={{ backgroundColor: sectionBg }}>
          <div className="max-w-2xl mx-auto text-center">
            {cfg.title && <h2 className="text-2xl font-bold mb-4" style={{ color: theme.textColor }}>{cfg.title}</h2>}
            {cfg.content && <p style={{ color: `color-mix(in srgb, ${theme.textColor} 70%, transparent)` }}>{cfg.content}</p>}
          </div>
        </section>
      );

    default:
      return null;
  }
}

// ─── Section Config Editor ───────────────────────────────────────────────────

function SectionConfigEditor({
  section,
  index,
  onUpdate,
}: {
  section: WebsiteSection;
  index: number;
  onUpdate: (index: number, key: string, value: any) => void;
}) {
  const cfg = section.config || {};

  const field = (key: string, label: string, type: "text" | "textarea" = "text") => (
    <div key={key} className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {type === "textarea" ? (
        <textarea
          value={cfg[key] || ""}
          onChange={(e) => onUpdate(index, key, e.target.value)}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
        />
      ) : (
        <Input value={cfg[key] || ""} onChange={(e) => onUpdate(index, key, e.target.value)} className="text-xs h-8" />
      )}
    </div>
  );

  const toggle = (key: string, label: string) => (
    <div key={key} className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <button
        onClick={() => onUpdate(index, key, !cfg[key])}
        className={`h-5 w-9 rounded-full transition-colors ${cfg[key] ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${cfg[key] ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );

  const colorField = (key: string, label: string) => (
    <div key={key} className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={cfg[key] || "#ffffff"}
          onChange={(e) => onUpdate(index, key, e.target.value)}
          className="h-8 w-8 rounded border cursor-pointer shrink-0"
        />
        <Input
          value={cfg[key] || ""}
          onChange={(e) => onUpdate(index, key, e.target.value)}
          placeholder="Leave empty for default"
          className="text-xs h-8 font-mono"
        />
      </div>
    </div>
  );

  switch (section.type) {
    case "hero":
      return <div className="space-y-2">{field("headline", "Headline")}{field("subtitle", "Subtitle")}{field("ctaText", "Button Text")}{colorField("backgroundColor", "Background")}</div>;
    case "services":
      return <div className="space-y-2">{field("title", "Title")}{toggle("showPrice", "Show Price")}{toggle("showDuration", "Show Duration")}{colorField("backgroundColor", "Background")}</div>;
    case "about":
      return <div className="space-y-2">{field("title", "Title")}{field("content", "Content", "textarea")}{colorField("backgroundColor", "Background")}</div>;
    case "testimonials":
      return <div className="space-y-2">{field("title", "Title")}{colorField("backgroundColor", "Background")}</div>;
    case "contact":
      return <div className="space-y-2">{field("title", "Title")}{field("phone", "Phone")}{field("email", "Email")}{colorField("backgroundColor", "Background")}</div>;
    case "faq":
      return <div className="space-y-2">{field("title", "Title")}{colorField("backgroundColor", "Background")}</div>;
    case "pricing":
      return <div className="space-y-2">{field("title", "Title")}{colorField("backgroundColor", "Background")}</div>;
    case "cta":
      return <div className="space-y-2">{field("title", "Heading")}{field("subtitle", "Description")}{field("buttonText", "Button Text")}{colorField("backgroundColor", "Background")}</div>;
    case "team":
      return <div className="space-y-2">{field("title", "Title")}{colorField("backgroundColor", "Background")}</div>;
    case "gallery":
      return <div className="space-y-2">{field("title", "Title")}{colorField("backgroundColor", "Background")}</div>;
    case "custom":
      return <div className="space-y-2">{field("title", "Title")}{field("content", "Content", "textarea")}{colorField("backgroundColor", "Background")}</div>;
    default:
      return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPlaceholder(target: string, section: WebsiteSection | null): string {
  if (target === "theme") return "e.g. Switch to a dark theme with neon green accents and Rajdhani font";
  if (target === "layout") return "e.g. Use a transparent header and a full footer with social links";
  if (!section) return "Select a section, then describe what you want to change...";
  const cfg = section.config || {};
  switch (section.type) {
    case "hero": return `e.g. Change headline to 'Ultimate Experience Awaits' and button to 'Reserve Now', add a dark gradient background`;
    case "services": return "e.g. Change background to dark grey, show only 2 columns";
    case "about": return "e.g. Write a warm 3-sentence paragraph about our passion for customer experience";
    case "testimonials": return "e.g. Add 4 realistic 5-star reviews mentioning friendly staff and great ambiance";
    case "gallery": return "e.g. Add 6 images of a modern gaming room with neon lights, comfortable chairs, and big screens";
    case "contact": return "e.g. Update phone to +91 98765 43210 and email to hello@ourbusiness.com";
    case "faq": return "e.g. Add 5 FAQs about booking process, cancellation policy, group discounts, timing, and what to bring";
    case "team": return "e.g. Add 4 team members — a manager, 2 game masters, and a front desk person with fun bios";
    case "cta": return "e.g. Change to 'Limited Slots Available — Book Now!' with a red/orange background";
    case "pricing": return "e.g. Change title to 'Choose Your Package' and add a subtitle about value";
    default: return "Describe what you want to change — text, colors, images, layout, etc.";
  }
}

function getDefaultSectionConfig(type: SectionType): Record<string, any> {
  switch (type) {
    case "hero": return { headline: "Welcome", subtitle: "Book your experience today", ctaText: "Book Now" };
    case "services": return { title: "Our Services", columns: 3, showPrice: true, showDuration: true };
    case "about": return { title: "About Us", content: "", showImage: true, layout: "centered" };
    case "testimonials": return { title: "What Our Customers Say", items: [] };
    case "gallery": return { title: "Gallery", columns: 3, images: [] };
    case "contact": return { title: "Contact Us", showMap: true, showForm: true };
    case "faq": return { title: "FAQ", items: [] };
    case "pricing": return { title: "Pricing" };
    case "team": return { title: "Our Team", columns: 4, members: [] };
    case "cta": return { title: "Ready to Book?", subtitle: "Reserve your spot now!", buttonText: "Book Now" };
    case "custom": return { title: "", content: "" };
    default: return {};
  }
}

// ─── Section Edit Guide — shows what properties AI can change ────────────────

function SectionEditGuide({ section }: { section: WebsiteSection }) {
  const cfg = section.config || {};

  const editableProps = SECTION_EDITABLE_PROPS[section.type] || [];
  const currentValues: string[] = [];

  // Show current values so user knows what's there
  if (cfg.headline || cfg.title) currentValues.push(`Title: "${cfg.headline || cfg.title}"`);
  if (cfg.subtitle) currentValues.push(`Subtitle: "${cfg.subtitle}"`);
  if (cfg.ctaText || cfg.buttonText) currentValues.push(`Button: "${cfg.ctaText || cfg.buttonText}"`);
  if (cfg.content) currentValues.push(`Content: "${cfg.content.substring(0, 60)}${cfg.content.length > 60 ? "..." : ""}"`);
  if (cfg.items?.length) currentValues.push(`${cfg.items.length} items`);
  if (cfg.members?.length) currentValues.push(`${cfg.members.length} team members`);
  if (cfg.images?.length) currentValues.push(`${cfg.images.length} images`);
  if (cfg.backgroundColor) currentValues.push(`Background: ${cfg.backgroundColor}`);

  return (
    <div className="rounded-lg border bg-muted/50 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold capitalize">{SECTION_LABELS[section.type]}</span>
        <Badge variant="outline" className="text-[10px] h-4">{section.isVisible ? "Visible" : "Hidden"}</Badge>
      </div>

      {/* Current values */}
      {currentValues.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Current content:</p>
          {currentValues.map((v, i) => (
            <p key={i} className="text-[11px] text-muted-foreground truncate">{v}</p>
          ))}
        </div>
      )}

      {/* Editable properties */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">You can ask AI to change:</p>
        <div className="flex flex-wrap gap-1">
          {editableProps.map((p) => (
            <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const SECTION_EDITABLE_PROPS: Record<string, string[]> = {
  hero: ["Headline Text", "Subtitle Text", "Button Text", "Background Color", "Background Image"],
  services: ["Section Title", "Columns", "Show Price", "Show Duration", "Background Color"],
  about: ["Title", "Content Text", "Layout Style", "Background Color"],
  testimonials: ["Title", "Reviews (text/author/rating)", "Add Reviews", "Background Color"],
  gallery: ["Title", "Images (add/replace)", "Columns", "Captions", "Background Color"],
  contact: ["Title", "Phone", "Email", "Address", "Show Map", "Background Color"],
  faq: ["Title", "Questions & Answers", "Add FAQ Items", "Background Color"],
  pricing: ["Title", "Subtitle", "Background Color"],
  team: ["Title", "Members (name/role/bio)", "Add Members", "Columns", "Background Color"],
  cta: ["Heading", "Description", "Button Text", "Background Color"],
  custom: ["Title", "Content", "Background Color"],
};

// ─── Quick Prompt Panel — categorized suggestions ────────────────────────────

function QuickPromptPanel({
  target,
  section,
  onSelect,
}: {
  target: string;
  section: WebsiteSection | null;
  onSelect: (prompt: string) => void;
}) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categories = target === "theme"
    ? getThemePromptCategories()
    : target === "layout"
      ? getLayoutPromptCategories()
      : section
        ? getSectionPromptCategories(section.type, section.config || {})
        : [];

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium">Suggestions — click to use:</p>
      {categories.map((cat) => (
        <div key={cat.label} className="rounded-lg border overflow-hidden">
          <button
            onClick={() => setExpandedCategory(expandedCategory === cat.label ? null : cat.label)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </span>
            {expandedCategory === cat.label ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
          {expandedCategory === cat.label && (
            <div className="border-t px-1 py-1 space-y-0.5">
              {cat.prompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(p)}
                  className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-md hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

type PromptCategory = { icon: string; label: string; prompts: string[] };

function getThemePromptCategories(): PromptCategory[] {
  return [
    {
      icon: "🎨",
      label: "Color Schemes",
      prompts: [
        "Make it dark mode with neon accents",
        "Use warm earthy tones — brown, beige, forest green",
        "Switch to a luxury gold and black theme",
        "Use a calming blue and white medical/spa theme",
        "Make the colors more vibrant and energetic",
        "Use a soft pastel color palette",
        "Create a high-contrast bold look",
      ],
    },
    {
      icon: "🔤",
      label: "Typography",
      prompts: [
        "Use Playfair Display for an elegant serif look",
        "Switch to Montserrat for a modern clean feel",
        "Use Rajdhani for a techy/gaming vibe",
        "Use Poppins for a friendly rounded look",
        "Use Lora for a classic editorial style",
      ],
    },
    {
      icon: "✨",
      label: "Style Presets",
      prompts: [
        "Make it look like a premium gaming lounge website",
        "Give it a clean minimalist SaaS look",
        "Style it like a luxury spa or salon",
        "Make it sporty and energetic like a fitness center",
        "Give it a cozy, warm restaurant feel",
      ],
    },
  ];
}

function getLayoutPromptCategories(): PromptCategory[] {
  return [
    {
      icon: "📐",
      label: "Layout Options",
      prompts: [
        "Use a transparent header that overlays the hero section",
        "Center-align the header with the logo in the middle",
        "Add a full footer with social links and business info",
        "Use a minimal footer with just copyright",
        "Make the page wider (1400px max width)",
        "Make the layout more compact and narrow",
      ],
    },
  ];
}

function getSectionPromptCategories(type: string, cfg: Record<string, any>): PromptCategory[] {
  const categories: PromptCategory[] = [];

  // Content category — always present
  const contentPrompts: string[] = [];
  const stylePrompts: string[] = [];

  switch (type) {
    case "hero":
      contentPrompts.push(
        "Write a powerful headline that grabs attention",
        `Change the headline to something about ${cfg.headline ? "our unique experience" : "premium gaming"}`,
        "Write a compelling subtitle that highlights our best feature",
        "Change the button text to 'Reserve Your Spot'",
        "Add an exciting call-to-action that creates urgency",
        "Make the text sound more professional and trustworthy",
      );
      stylePrompts.push(
        "Add a dark gradient background for a premium look",
        "Change the background to a deep blue",
        "Make it vibrant with an orange/red gradient",
        "Give it a clean white background with colored text",
      );
      break;

    case "services":
      contentPrompts.push(
        "Change the section title to 'What We Offer'",
        "Update the title to 'Our Experiences'",
      );
      stylePrompts.push(
        "Change the background to a dark color",
        "Use a light grey background for contrast",
        "Add a subtle colored background that matches the theme",
        "Show 2 columns instead of 3",
      );
      break;

    case "about":
      contentPrompts.push(
        "Write a professional about us paragraph (3-4 sentences)",
        "Write a friendly, casual about us description",
        "Highlight our experience, quality, and customer satisfaction",
        "Include our mission and what makes us different",
        "Make the content sound more personal and authentic",
      );
      stylePrompts.push(
        "Change the background color to something warm",
        "Use a contrasting dark background",
      );
      break;

    case "testimonials":
      contentPrompts.push(
        "Add 3 realistic 5-star customer reviews",
        "Add a review about great service and friendly staff",
        "Add 5 diverse testimonials with different experiences",
        "Make the review text sound more natural and authentic",
        "Add reviews mentioning specific services we offer",
      );
      stylePrompts.push(
        "Give it a warm background color for trust",
        "Use a dark background with light text for the reviews",
      );
      break;

    case "gallery":
      contentPrompts.push(
        "Add 6 gaming room images with descriptions",
        "Add images showcasing our facilities and equipment",
        "Add images of happy customers enjoying our services",
        "Update image captions to be more descriptive",
        "Add photos of our interior, equipment, and ambiance",
      );
      stylePrompts.push(
        "Use 2 columns for a larger image display",
        "Use 4 columns for a compact grid",
        "Add a dark background to make images pop",
      );
      break;

    case "contact":
      contentPrompts.push(
        "Update the phone number and email address",
        "Add our full street address",
        "Change the title to 'Get in Touch'",
        "Add our business hours information",
      );
      stylePrompts.push(
        "Give it a colored background",
        "Use a dark background for the contact section",
      );
      break;

    case "faq":
      contentPrompts.push(
        "Add 5 common booking FAQs (cancellation, payment, timing)",
        "Add a question about pricing and packages",
        "Add FAQ about group bookings and events",
        "Add questions about what to expect on first visit",
        "Add safety and requirement FAQs",
      );
      stylePrompts.push(
        "Give it a light background for readability",
      );
      break;

    case "pricing":
      contentPrompts.push(
        "Change the section title to 'Our Packages'",
        "Add a subtitle like 'Best value for your experience'",
      );
      stylePrompts.push(
        "Use a dark background to make prices stand out",
        "Add a subtle gradient background",
      );
      break;

    case "team":
      contentPrompts.push(
        "Add 4 team members with realistic names and roles",
        "Add team members: a manager, 2 instructors, and a receptionist",
        "Update team member bios to sound professional",
        "Add short fun bios for each team member",
      );
      stylePrompts.push(
        "Change background to add visual separation",
        "Use 3 columns instead of 4",
      );
      break;

    case "cta":
      contentPrompts.push(
        "Write an urgent call to action with a limited offer",
        "Change heading to 'Don't Miss Out — Book Today!'",
        "Add a subtitle about special weekend rates",
        "Change button text to 'Grab Your Slot Now'",
        "Make it sound exciting and create FOMO",
      );
      stylePrompts.push(
        "Change the background to a gradient",
        "Use our secondary color for the background",
        "Make it dark with a neon accent button",
      );
      break;

    case "custom":
      contentPrompts.push(
        "Add a paragraph about our special offers",
        "Write content about upcoming events",
        "Add information about our loyalty program",
      );
      stylePrompts.push(
        "Add a colored background",
      );
      break;
  }

  if (contentPrompts.length > 0) {
    categories.push({ icon: "✏️", label: "Content & Text", prompts: contentPrompts });
  }
  if (stylePrompts.length > 0) {
    categories.push({ icon: "🎨", label: "Colors & Style", prompts: stylePrompts });
  }

  // General improvement category
  categories.push({
    icon: "⚡",
    label: "Quick Improvements",
    prompts: [
      "Make this section look more professional",
      "Improve the overall content quality",
      "Make the text more engaging and conversion-focused",
      "Optimize this section for a better user experience",
    ],
  });

  return categories;
}
