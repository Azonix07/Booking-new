"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WizardData } from "@/app/setup/page";
import {
  Building2,
  Clock,
  Gamepad2,
  Timer,
  DollarSign,
  CreditCard,
  UserCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Rocket,
  MapPin,
  Pencil,
} from "lucide-react";

interface Props {
  data: WizardData;
  onFinalize: () => void;
  onGoToStep?: (step: number) => void;
  saving: boolean;
}

function Section({
  icon: Icon,
  title,
  done,
  stepNumber,
  onGoToStep,
  children,
}: {
  icon: any;
  title: string;
  done: boolean;
  stepNumber?: number;
  onGoToStep?: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border bg-background p-4 transition-colors ${
        done ? "border-border" : "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
          done ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
        }`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{title}</p>
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              ) : (
                <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-800 h-4 px-1.5">
                  Not set
                </Badge>
              )}
            </div>
            {stepNumber && onGoToStep && (
              <button
                onClick={() => onGoToStep(stepNumber)}
                className="text-xs font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors shrink-0"
              >
                <Pencil className="h-3 w-3" />
                {done ? "Edit" : "Set up"}
              </button>
            )}
          </div>
          {done ? (
            <div className="text-sm">{children}</div>
          ) : (
            <p className="text-xs text-muted-foreground">Not configured yet — click &quot;Set up&quot; to add this.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StepReview({ data, onFinalize, onGoToStep, saving }: Props) {
  const sections = [
    { key: "businessType", done: !!data.businessType, step: 1 },
    { key: "location", done: !!data.location, step: 2 },
    { key: "businessHours", done: !!data.businessHours, step: 3 },
    { key: "services", done: data.services?.length > 0, step: 4 },
    { key: "slotConfig", done: !!data.slotConfig, step: 5 },
    { key: "pricing", done: data.pricing?.length > 0, step: 6 },
    { key: "paymentMethod", done: !!data.paymentMethod, step: 7 },
    { key: "customerFields", done: !!data.customerFields, step: 8 },
  ];
  const doneCount = sections.filter((s) => s.done).length;
  const allDone = doneCount === sections.length;
  const missingCount = sections.length - doneCount;
  const firstMissing = sections.find((s) => !s.done);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Review &amp; launch</h2>
        <p className="text-muted-foreground mt-1.5">
          Give everything a quick look. Tap Edit to tweak any section.
        </p>
      </div>

      {/* Completion banner */}
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border ${
          allDone
            ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800"
            : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
        }`}
      >
        {allDone ? (
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="font-bold text-base">
            {allDone
              ? "All set — ready to launch!"
              : `${missingCount} step${missingCount !== 1 ? "s" : ""} left before launch`}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {allDone
              ? "Your booking page is ready. Hit Launch below."
              : "Complete the highlighted sections below to enable launch."}
          </p>
          {!allDone && firstMissing && onGoToStep && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-1.5"
              onClick={() => onGoToStep(firstMissing.step)}
            >
              Finish step {firstMissing.step}
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        <Section icon={Building2} title="Business Type" done={!!data.businessType} stepNumber={1} onGoToStep={onGoToStep}>
          <p className="capitalize">
            {data.businessType?.category?.replace(/-/g, " ")}
            {data.businessType?.customCategory && ` — ${data.businessType.customCategory}`}
          </p>
        </Section>

        <Section icon={MapPin} title="Location" done={!!data.location} stepNumber={2} onGoToStep={onGoToStep}>
          {data.location && (
            <div className="space-y-0.5">
              {data.location.address?.street && <p>{data.location.address.street}</p>}
              <p>
                {[data.location.address?.city, data.location.address?.state, data.location.address?.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {data.location.coordinates && (
                <p className="text-muted-foreground text-xs">
                  {data.location.coordinates.latitude.toFixed(4)}, {data.location.coordinates.longitude.toFixed(4)}
                </p>
              )}
            </div>
          )}
        </Section>

        <Section icon={Clock} title="Business Hours" done={!!data.businessHours} stepNumber={3} onGoToStep={onGoToStep}>
          {data.businessHours && (
            <div className="space-y-0.5">
              <p>{data.businessHours.sameForAllDays ? "Same hours every open day" : "Different hours per day"}</p>
              <p className="text-muted-foreground text-xs">
                Open {data.businessHours.hours?.filter((h: any) => !h.isClosed).length || 0} days a week
              </p>
            </div>
          )}
        </Section>

        <Section icon={Gamepad2} title="Services / Devices" done={data.services?.length > 0} stepNumber={4} onGoToStep={onGoToStep}>
          <div className="flex flex-wrap gap-1.5">
            {data.services?.map((s: any, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {s.name} ({s.numberOfDevices} × {s.maxPlayersPerDevice}p)
              </Badge>
            ))}
          </div>
        </Section>

        <Section icon={Timer} title="Slot Configuration" done={!!data.slotConfig} stepNumber={5} onGoToStep={onGoToStep}>
          {data.slotConfig && (
            <p>
              {data.slotConfig.slotDurationMinutes}-min slots · {data.slotConfig.minBookingNoticeHours}h notice · up to {data.slotConfig.maxAdvanceBookingDays}d ahead
              {data.slotConfig.allowWalkIns && " · walk-ins OK"}
            </p>
          )}
        </Section>

        <Section icon={DollarSign} title="Pricing" done={data.pricing?.length > 0} stepNumber={6} onGoToStep={onGoToStep}>
          <div className="space-y-0.5">
            {data.pricing?.slice(0, 5).map((p: any, i: number) => (
              <p key={i}>
                {p.serviceName}: {p.currency} {p.basePrice}
                {p.durationOptions?.length > 0 && (
                  <> <span className="text-muted-foreground">({p.durationOptions.map((d: any) => d.label).join(", ")})</span></>
                )}
              </p>
            ))}
            {data.pricing?.length > 5 && (
              <p className="text-muted-foreground text-xs">+{data.pricing.length - 5} more</p>
            )}
          </div>
        </Section>

        <Section icon={CreditCard} title="Payment Method" done={!!data.paymentMethod} stepNumber={7} onGoToStep={onGoToStep}>
          {data.paymentMethod && (
            <div className="flex flex-wrap gap-1.5">
              {data.paymentMethod.acceptOnlinePayment && (
                <Badge variant="secondary" className="text-xs">Online</Badge>
              )}
              {data.paymentMethod.acceptPayAtShop && (
                <Badge variant="secondary" className="text-xs">Pay at shop</Badge>
              )}
              {data.paymentMethod.showPriceBeforeBooking && (
                <Badge variant="outline" className="text-xs">Prices visible</Badge>
              )}
            </div>
          )}
        </Section>

        <Section icon={UserCircle} title="Customer Information" done={!!data.customerFields} stepNumber={8} onGoToStep={onGoToStep}>
          {data.customerFields && (
            <div className="flex flex-wrap gap-1.5">
              {data.customerFields.nameRequired && <Badge variant="secondary" className="text-xs">Name</Badge>}
              {data.customerFields.phoneRequired && <Badge variant="secondary" className="text-xs">Phone</Badge>}
              {data.customerFields.emailRequired && <Badge variant="secondary" className="text-xs">Email</Badge>}
              {data.customerFields.customFields?.map((cf: any, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {cf.label}{cf.required && " *"}
                </Badge>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Launch button */}
      <div className="pt-2">
        <Button
          onClick={onFinalize}
          disabled={!allDone || saving}
          size="lg"
          className="w-full h-14 text-base gap-2 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30"
        >
          {saving ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Launching your site...</>
          ) : (
            <><Rocket className="h-5 w-5" /> {allDone ? "Launch booking website" : `Finish ${missingCount} more step${missingCount !== 1 ? "s" : ""} to launch`}</>
          )}
        </Button>
        {allDone && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            You can edit anything from your dashboard after launch.
          </p>
        )}
      </div>
    </div>
  );
}
