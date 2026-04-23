"use client";

import { useCallback, useEffect, useRef } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  bookingRef: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  businessName?: string;
  onSuccess: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure: (error: any) => void;
  onDismiss?: () => void;
}

/** Loads the Razorpay checkout script and provides an `openCheckout` function */
export function useRazorpay() {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current || typeof window === "undefined") return;
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      scriptLoaded.current = true;
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
    };
    document.body.appendChild(script);
  }, []);

  const openCheckout = useCallback((opts: RazorpayCheckoutOptions) => {
    if (!window.Razorpay) {
      opts.onFailure(new Error("Razorpay SDK not loaded"));
      return;
    }

    const razorpayOptions = {
      key: opts.keyId,
      amount: opts.amount,
      currency: opts.currency,
      name: opts.businessName || "Booking Platform",
      description: `Booking ${opts.bookingRef}`,
      order_id: opts.orderId,
      handler: (response: any) => {
        opts.onSuccess({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      prefill: {
        name: opts.customerName || "",
        email: opts.customerEmail || "",
        contact: opts.customerPhone || "",
      },
      theme: {
        color: "#6366f1",
      },
      modal: {
        ondismiss: () => {
          opts.onDismiss?.();
        },
        escape: true,
        confirm_close: true,
      },
    };

    const rzp = new window.Razorpay(razorpayOptions);

    rzp.on("payment.failed", (response: any) => {
      opts.onFailure(response.error);
    });

    rzp.open();
  }, []);

  return { openCheckout };
}
