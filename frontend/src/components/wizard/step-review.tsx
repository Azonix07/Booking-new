"use client";

import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";

interface Props {
  data: WizardData;
  onFinalize: () => void;
  saving: boolean;
}

function Section({
  icon: Icon,
  title,
  done,
  children,
}: {
  icon: any;
  title: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={!done ? "border-dashed opacity-60" : ""}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${done ? "text-primary" : "text-muted-foreground"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-semibold">{title}</p>
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Not set</Badge>
              )}
            </div>
            {done ? children : <p className="text-sm text-muted-foreground">Not configured yet</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StepReview({ data, onFinalize, saving }: Props) {
  const sections = [
    { key: "businessType", done: !!data.businessType },
    { key: "businessHours", done: !!data.businessHours },
    { key: "services", done: data.services?.length > 0 },
    { key: "slotConfig", done: !!data.slotConfig },
    { key: "pricing", done: data.pricing?.length > 0 },
    { key: "paymentMethod", done: !!data.paymentMethod },
    { key: "customerFields", done: !!data.customerFields },
  ];
  const doneCount = sections.filter((s) => s.done).length;
  const allDone = doneCount === sections.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review & Create</h2>
        <p className="text-muted-foreground mt-1">
          Review your configuration before launching your booking website
        </p>
      </div>

      {/* Completion badge */}
      <div className={`flex items-center gap-3 p-4 rounded-lg border ${allDone ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"}`}>
        {allDone ? (
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        ) : (
          <AlertCircle className="h-6 w-6 text-amber-600" />
        )}
        <div>
          <p className="font-semibold">{allDone ? "All steps completed!" : `${doneCount} of ${sections.length} steps completed`}</p>
          <p className="text-sm text-muted-foreground">
            {allDone ? "Your booking website is ready to launch" : "Complete all steps to launch your website"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Business Type */}
        <Section icon={Building2} title="Business Type" done={!!data.businessType}>
          <p className="text-sm capitalize">
            {data.businessType?.category?.replace(/-/g, " ")}
            {data.businessType?.customCategory && ` — ${data.businessType.customCategory}`}
          </p>
        </Section>

        {/* Business Hours */}
        <Section icon={Clock} title="Business Hours" done={!!data.businessHours}>
          {data.businessHours && (
            <div className="text-sm space-y-0.5">
              {data.businessHours.sameForAllDays ? (
                <p>Same timing for all open days</p>
              ) : (
                <p>Custom hours per day</p>
              )}
              <p className="text-muted-foreground">
                {data.businessHours.hours?.filter((h: any) => !h.closed).length || 0} days open per week
              </p>
            </div>
          )}
        </Section>

        {/* Services */}
        <Section icon={Gamepad2} title="Services / Devices" done={data.services?.length > 0}>
          <div className="flex flex-wrap gap-1.5">
            {data.services?.map((s: any, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {s.name} ({s.numberOfDevices} × {s.maxPlayersPerDevice}p)
              </Badge>
            ))}
          </div>
        </Section>

        {/* Slot Config */}
        <Section icon={Timer} title="Slot Configuration" done={!!data.slotConfig}>
          {data.slotConfig && (
            <p className="text-sm">
              {data.slotConfig.slotDurationMinutes} min slots
              ・{data.slotConfig.minBookingNoticeHours}h notice
              ・{data.slotConfig.maxAdvanceBookingDays}d advance
              {data.slotConfig.allowWalkIns && " ・Walk-ins OK"}
            </p>
          )}
        </Section>

        {/* Pricing */}
        <Section icon={DollarSign} title="Pricing" done={data.pricing?.length > 0}>
          <div className="text-sm space-y-0.5">
            {data.pricing?.slice(0, 5).map((p: any, i: number) => (
              <p key={i}>
                {p.serviceName}: {p.currency} {p.basePrice}
                {p.durationOptions?.length > 0 && (
                  <> ({p.durationOptions.map((d: any) => d.label).join(", ")})</>
                )}
                {(p.pricePerAdditionalPerson || 0) > 0 && ` (+${p.pricePerAdditionalPerson}/person)`}
              </p>
            ))}
            {data.pricing?.length > 5 && (
              <p className="text-muted-foreground">+{data.pricing.length - 5} more</p>
            )}
          </div>
        </Section>

        {/* Payment */}
        <Section icon={CreditCard} title="Payment Method" done={!!data.paymentMethod}>
          {data.paymentMethod && (
            <div className="flex gap-2">
              {data.paymentMethod.acceptOnlinePayment && (
                <Badge variant="secondary" className="text-xs">Online</Badge>
              )}
              {data.paymentMethod.acceptPayAtShop && (
                <Badge variant="secondary" className="text-xs">Pay at Shop</Badge>
              )}
              {data.paymentMethod.showPriceBeforeBooking && (
                <Badge variant="outline" className="text-xs">Prices visible</Badge>
              )}
            </div>
          )}
        </Section>

        {/* Customer Fields */}
        <Section icon={UserCircle} title="Customer Information" done={!!data.customerFields}>
          {data.customerFields && (
            <div className="flex flex-wrap gap-1.5">
              {data.customerFields.nameRequired && (
                <Badge variant="secondary" className="text-xs">Name</Badge>
              )}
              {data.customerFields.phoneRequired && (
                <Badge variant="secondary" className="text-xs">Phone</Badge>
              )}
              {data.customerFields.emailRequired && (
                <Badge variant="secondary" className="text-xs">Email</Badge>
              )}
              {data.customerFields.customFields?.map((cf: any, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {cf.label} {cf.required && "*"}
                </Badge>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Launch button */}
      <div className="pt-4">
        <Button
          onClick={onFinalize}
          disabled={!allDone || saving}
          size="lg"
          className="w-full h-14 text-lg gap-2"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Rocket className="h-5 w-5" />
          )}
          {saving ? "Creating your website..." : "Launch Booking Website"}
        </Button>
        {!allDone && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            Complete all steps above to enable launch
          </p>
        )}
      </div>
    </div>
  );
}
