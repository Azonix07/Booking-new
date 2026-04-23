"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy route — redirects to the new standalone setup wizard at /setup
 */
export default function DashboardSetupRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/setup");
  }, [router]);
  return null;
}
