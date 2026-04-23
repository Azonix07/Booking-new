"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyPendingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/list-your-business/pending");
  }, [router]);
  return null;
}
