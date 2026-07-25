"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PumpCreateRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/createtoken/pump/board?create=1");
  }, [router]);

  return (
    <main className="min-h-screen bg-[#030813]" />
  );
}
