"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Banknote, Loader2, Eye } from "lucide-react";

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
        <h2 className="text-2xl font-bold">Payment method</h2>
        <p className="text-muted-foreground mt-1">
          Choose how customers can pay for their bookings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Online Payment */}
        <Card
          className={`cursor-pointer transition-all ${
            config.acceptOnlinePayment
              ? "border-primary ring-2 ring-primary/20"
              : "border-border"
          }`}
          onClick={() => update("acceptOnlinePayment", !config.acceptOnlinePayment)}
        >
          <CardContent className="pt-6 text-center space-y-3">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${
              config.acceptOnlinePayment ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              <CreditCard className="h-7 w-7" />
            </div>
            <p className="font-semibold">Online Payment</p>
            <p className="text-sm text-muted-foreground">
              Customers pay via Razorpay (UPI, cards, wallets)
            </p>
            <Switch
              checked={config.acceptOnlinePayment}
              onCheckedChange={(c) => update("acceptOnlinePayment", c)}
            />
          </CardContent>
        </Card>

        {/* Pay at Shop */}
        <Card
          className={`cursor-pointer transition-all ${
            config.acceptPayAtShop
              ? "border-primary ring-2 ring-primary/20"
              : "border-border"
          }`}
          onClick={() => update("acceptPayAtShop", !config.acceptPayAtShop)}
        >
          <CardContent className="pt-6 text-center space-y-3">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${
              config.acceptPayAtShop ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              <Banknote className="h-7 w-7" />
            </div>
            <p className="font-semibold">Pay at Shop</p>
            <p className="text-sm text-muted-foreground">
              Customers pay in person when they arrive
            </p>
            <Switch
              checked={config.acceptPayAtShop}
              onCheckedChange={(c) => update("acceptPayAtShop", c)}
            />
          </CardContent>
        </Card>
      </div>

      {!atLeastOne && (
        <p className="text-sm text-destructive">Please enable at least one payment method</p>
      )}

      {/* Show price toggle */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">Show price before booking</p>
                <p className="text-sm text-muted-foreground">
                  Display pricing on the booking page
                </p>
              </div>
            </div>
            <Switch
              checked={config.showPriceBeforeBooking}
              onCheckedChange={(c) => update("showPriceBeforeBooking", c)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onSave(config)} disabled={!atLeastOne || saving} size="lg">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Continue
        </Button>
      </div>
    </div>
  );
}
