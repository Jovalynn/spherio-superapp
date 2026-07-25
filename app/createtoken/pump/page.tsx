"use client";

import { redirect } from "next/navigation";

export default function PumpIndexPage() {
  redirect("/createtoken/pump/discovery");
}
