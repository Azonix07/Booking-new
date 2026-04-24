"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Banknote, Loader2, Eye, ShieldCheck, ArrowRight, AlertCircle, Smartphone } from "lucide-react";

interface PaymentMethod {
  acceptOnlinePayment: boolean;
  acceptPayAtShop: boolean;
  showPriceBeforeBooking: boolean;
}

interface Props {
  data: PaymentMethod | null;
  onSave: (data: PaymentMethod) => void;
  saving: boolean;
}

export default function StepPaymentMethod({ data, onSave, saving }: Props) {
  const [config, setConfig] = useState<PaymentMethod>(
    data || {
      acceptOnlinePayment: true,
      acceptPayAtShop: true,
      showPriceBeforeBooking: true,
    },
  );

  const update = (field: keyof PaymentMethod, value: boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const atLeastOne = config.acceptOnlinePayment || config.acceptPayAtShop;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How will customers pay?</h2>
        <p className="text-muted-foreground mt-1.5">
          Pick at least one. Most businesses enable both to give customers options.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Online Payment */}
        <button
          type="button"
          onClick={() => update("acceptOnlinePayment", !config.acceptOnlinePayment)}
          className={`relative text-left rounded-2xl border-2 p-5 transition-all ${
            config.acceptOnlinePayment
              ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
              : "border-border hover:border-primary/40 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
              config.acceptOnlinePayment ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}>
              <CreditCard className="h-6 w-6" />
            </div>
            <Switch
              checked={config.acceptOnlinePayment}
              onCheckedChange={(c) => update("acceptOnlinePayment", c)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <p className="font-bold text-base">Pay online</p>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            Customers pay when booking — secured by Razorpay.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border text-[11px] font-medium text-muted-foreground">
              <Smartphone className="h-3 w-3" /> UPI
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border text-[11px] font-medium text-muted-foreground">
              Cards
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border text-[11px] font-medium text-muted-foreground">
              Wallets
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border border-border text-[11px] font-medium text-muted-foreground">
              Netbanking
            </span>
          </div>
        </button>

        {/* Pay at Shop */}
        <button
          type="button"
          onClick={() => update("acceptPayAtShop", !config.acceptPayAtShop)}
          className={`relative text-left rounded-2xl border-2 p-5 transition-all ${
            config.acceptPayAtShop
              ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
              : "border-border hover:border-primary/40 hover:bg-muted/40"
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
              config.acceptPayAtShop ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}>
              <Banknote className="h-6 w-6" />
            </div>
            <Switch
              checked={config.acceptPayAtShop}
              onCheckedChange={(c) => update("acceptPayAtShop", c)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <p className="font-bold text-base">Pay at shop</p>
          <p className="text-sm text-muted-foreground mt-1">
            Customers reserve online, pay when they arrive (cash, UPI, or card).
          </p>
        </button>
      </div>

      {!atLeastOne && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200 px-3 py-2.5 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>Turn on at least one — customers need a way to pay.</p>
        </div>
      )}

      {/* Show price toggle */}
      <div className="rounded-xl border border-border bg-background p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Eye className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Show prices on the booking page</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Turn off if you prefer to quote prices after the customer contacts you
            </p>
          </div>
        </div>
        <Switch
          checked={config.showPriceBeforeBooking}
          onCheckedChange={(c) => update("showPriceBeforeBooking", c)}
        />
      </div>

      {/* Trust note */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2.5">
        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
        <p>
          Online payments are PCI-compliant and go straight to your bank, minus Razorpay&apos;s standard fee. You can set this up anytime from your dashboard.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => onSave(config)}
          disabled={!atLeastOne || saving}
          size="lg"
          className="gap-1.5 rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}
