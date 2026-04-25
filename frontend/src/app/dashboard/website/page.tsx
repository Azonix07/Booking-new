"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Globe,
  Eye,
  EyeOff,
  Wand2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
  Palette,
  Type,
  ExternalLink,
  RefreshCw,
  Pencil,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import type { WebsiteConfig, Tenant, SubscriptionPlan } from "@/lib/types";
import { PlanUpgradePrompt } from "@/components/plan-upgrade-prompt";

const AI_PLANS: SubscriptionPlan[] = ["ai", "full_service"];

interface BusinessType {
  id: string;
  name: string;
  icon: string;
}

interface DesignStyle {
  id: string;
  name: string;
  description: string;
  preview: { primary: string; secondary: string; bg: string; mode: string };
}

// ─── Wizard Steps ────────────────────────────────────────────────────────────

type WizardStep = "business-type" | "design-style" | "extra-prompt" | "generating" | "preview";

export default function WebsitePage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<WebsiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  // Wizard state
  const [wizardActive, setWizardActive] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>("business-type");
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [designStyles, setDesignStyles] = useState<DesignStyle[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [selectedDesign, setSelectedDesign] = useState<string>("");
  const [extraPrompt, setExtraPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Load existing config
  useEffect(() => {
    if (!user?.tenantId) return;
    api.setTenantId(user.tenantId);

    Promise.all([
      api.get<WebsiteConfig>("/website").catch(() => null),
      api.get<BusinessType[]>("/website/business-types").catch(() => []),
      api.get<DesignStyle[]>("/website/design-styles").catch(() => []),
      api.get<Tenant>("/shop").catch(() => null),
    ]).then(([cfg, bt, ds, t]) => {
      setConfig(cfg);
      setBusinessTypes(bt || []);
      setDesignStyles(ds || []);
      setTenant(t);
      setLoading(false);
    });
  }, [user]);

  const startWizard = useCallback(() => {
    setWizardActive(true);
    setWizardStep("business-type");
    setSelectedBusiness("");
    setSelectedDesign("");
    setExtraPrompt("");
  }, []);

  const generateWebsite = useCallback(async () => {
    setWizardStep("generating");
    setGenerating(true);
    setGenerateError(null);
    try {
      const isRegenerate = !!config;
      const endpoint = isRegenerate ? "/website/regenerate" : "/website";

      const body = isRegenerate
        ? {
            businessType: selectedBusiness,
            designStyle: selectedDesign,
            prompt: extraPrompt || `${selectedBusiness} with ${selectedDesign} style`,
          }
        : {
            mode: "ai_generated",
            businessType: selectedBusiness,
            designStyle: selectedDesign,
            prompt: extraPrompt || `${selectedBusiness} with ${selectedDesign} style`,
          };

      const result = await api.post<WebsiteConfig>(endpoint, body);
      setConfig(result);
      setWizardStep("preview");
    } catch (err: any) {
      setGenerateError(err?.message || "Failed to generate website. Please try again.");
      setWizardStep("extra-prompt");
    } finally {
      setGenerating(false);
    }
  }, [config, selectedBusiness, selectedDesign, extraPrompt]);

  const togglePublish = async () => {
    if (!config) return;
    try {
      const status = config.status === "published" ? "draft" : "published";
      await api.put("/website/status", { status });
      setConfig({ ...config, status });
    } catch {}
  };

  if (loading) return <PageLoader />;

  const plan = user?.onboarding?.subscription?.plan;
  const planActive = user?.onboarding?.subscription?.status === "active";
  if (!plan || !planActive || !AI_PLANS.includes(plan)) {
    return (
      <PlanUpgradePrompt
        feature="AI Website Builder"
        description="Generate a complete website from a short prompt, then drag-and-edit any section with AI. Available on AI and Full-Service plans."
        requiredPlans={AI_PLANS}
      />
    );
  }

  // ─── WIZARD MODE ──────────────────────────────────────────────────────────

  if (!config || wizardActive) {
    return (
      <div>
        <PageHeader
          title="AI Website Builder"
          description="Create your booking website in seconds"
        />

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {["Business Type", "Design Style", "Details", "Generate"].map((label, i) => {
            const steps: WizardStep[] = ["business-type", "design-style", "extra-prompt", "generating"];
            const stepIndex = steps.indexOf(wizardStep);
            const isActive = i === stepIndex;
            const isComplete = i < stepIndex || wizardStep === "preview";
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className={`h-px w-8 ${isComplete ? "bg-primary" : "bg-border"}`} />}
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isComplete
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete && !isActive ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                  <span className="hidden sm:inline">{label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* STEP 1: Business Type */}
        {wizardStep === "business-type" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">What type of business do you run?</h2>
              <p className="text-sm text-muted-foreground">
                We&apos;ll tailor your website content, layout, and messaging to match your industry.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {businessTypes.map((bt) => (
                <button
                  key={bt.id}
                  onClick={() => setSelectedBusiness(bt.id)}
                  className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:shadow-md ${
                    selectedBusiness === bt.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="text-3xl">{bt.icon}</span>
                  <span className="text-sm font-medium text-center">{bt.name}</span>
                  {selectedBusiness === bt.id && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setWizardStep("design-style")}
                disabled={!selectedBusiness}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Design Style */}
        {wizardStep === "design-style" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Choose your design style</h2>
              <p className="text-sm text-muted-foreground">
                This sets the color palette, fonts, and overall visual feel of your website.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {designStyles.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => setSelectedDesign(ds.id)}
                  className={`relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                    selectedDesign === ds.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {/* Color preview */}
                  <div className="flex gap-1.5">
                    <div
                      className="h-8 w-8 rounded-lg"
                      style={{ backgroundColor: ds.preview.primary }}
                    />
                    <div
                      className="h-8 w-8 rounded-lg"
                      style={{ backgroundColor: ds.preview.secondary }}
                    />
                    <div
                      className="h-8 w-8 rounded-lg border"
                      style={{ backgroundColor: ds.preview.bg }}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-medium">{ds.name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{ds.description}</p>
                  </div>
                  {selectedDesign === ds.id && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setWizardStep("business-type")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => setWizardStep("extra-prompt")}
                disabled={!selectedDesign}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Extra Details */}
        {wizardStep === "extra-prompt" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Any specific preferences?</h2>
              <p className="text-sm text-muted-foreground">
                Optional — describe any specific features, colors, or content you&apos;d like. We&apos;ll incorporate them into your design.
              </p>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant="outline" className="gap-1">
                    <Palette className="h-3 w-3" />
                    {designStyles.find((d) => d.id === selectedDesign)?.name || selectedDesign}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Type className="h-3 w-3" />
                    {businessTypes.find((b) => b.id === selectedBusiness)?.name || selectedBusiness}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label>Additional preferences (optional)</Label>
                  <textarea
                    value={extraPrompt}
                    onChange={(e) => setExtraPrompt(e.target.value)}
                    placeholder="e.g. Use dark purple as the main color, include a section about our VIP packages, emphasize our 5-star reviews..."
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">{extraPrompt.length}/2000 characters</p>
                </div>
              </CardContent>
            </Card>
            {generateError && (
              <div className="flex items-start gap-3 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-red-700">
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Generation failed</p>
                  <p className="text-sm opacity-80">{generateError}</p>
                </div>
                <button onClick={() => setGenerateError(null)} className="text-red-400 hover:text-red-600 font-bold text-lg leading-none">×</button>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setWizardStep("design-style")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={generateWebsite} disabled={generating}>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Website
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Generating */}
        {wizardStep === "generating" && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative mb-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Building your website...</h2>
            <p className="text-sm text-muted-foreground max-w-sm text-center">
              Our AI is generating a customized website based on your business type and design preferences.
            </p>
            <div className="mt-6 flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Preview (after generation) */}
        {wizardStep === "preview" && config && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Your website is ready!</h2>
                <p className="text-sm text-muted-foreground">
                  Here&apos;s a summary of what was generated. You can edit everything from the editor.
                </p>
              </div>
            </div>

            {/* Preview summary */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Theme
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="h-8 w-8 rounded-lg border" style={{ backgroundColor: config.theme.primaryColor }} />
                      <div className="h-8 w-8 rounded-lg border" style={{ backgroundColor: config.theme.secondaryColor }} />
                      <div className="h-8 w-8 rounded-lg border" style={{ backgroundColor: config.theme.backgroundColor }} />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{config.theme.fontFamily}</p>
                      <p className="text-muted-foreground">{config.theme.mode} mode</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sections ({config.sections.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {config.sections
                      .filter((s) => s.isVisible)
                      .sort((a, b) => a.order - b.order)
                      .map((section, i) => (
                        <Badge key={i} variant="outline" className="capitalize">
                          {section.type}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/website/editor">
                <Button>
                  <Pencil className="mr-2 h-4 w-4" /> Open Editor
                </Button>
              </Link>
              <Link href={`/store/${tenant?.slug || user?.tenantId}?preview=true`} target="_blank">
                <Button variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" /> Preview Site
                </Button>
              </Link>
              <Button variant="outline" onClick={startWizard}>
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
              </Button>
              <Button
                variant="outline"
                onClick={() => setWizardActive(false)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── DASHBOARD MODE (website already exists) ─────────────────────────────

  return (
    <div>
      <PageHeader
        title="Website"
        description="Manage your public booking website"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={togglePublish}>
              {config.status === "published" ? (
                <><EyeOff className="mr-2 h-4 w-4" /> Unpublish</>
              ) : (
                <><Eye className="mr-2 h-4 w-4" /> Publish</>
              )}
            </Button>
          </div>
        }
      />

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={config.status === "published" ? "default" : "secondary"}>
              {config.status}
            </Badge>
            {config.generationCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Generated {config.generationCount} time{config.generationCount > 1 ? "s" : ""}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theme</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: config.theme.primaryColor }} />
              <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: config.theme.secondaryColor }} />
            </div>
            <span className="text-sm">{config.theme.fontFamily}</span>
            <Badge variant="outline">{config.theme.mode}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {config.sections.filter((s) => s.isVisible).length} visible / {config.sections.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Link href="/dashboard/website/editor">
          <Button>
            <Pencil className="mr-2 h-4 w-4" /> Open Editor
          </Button>
        </Link>
        <Link href={`/store/${tenant?.slug || user?.tenantId}?preview=true`} target="_blank">
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" /> Preview Site
          </Button>
        </Link>
        <Button variant="outline" onClick={startWizard}>
          <Wand2 className="mr-2 h-4 w-4" /> Regenerate with AI
        </Button>
      </div>

      {/* Sections overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sections ({config.sections.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {config.sections
              .sort((a, b) => a.order - b.order)
              .map((section, i) => (
                <div key={i} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium capitalize">{section.type}</span>
                    <Badge variant={section.isVisible ? "default" : "secondary"}>
                      {section.isVisible ? "Visible" : "Hidden"}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">Order: {section.order}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
