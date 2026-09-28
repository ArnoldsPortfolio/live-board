"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { token } from "@/lib/api";
export default function HomePage() {
  const router = useRouter();
  useEffect(() => { router.replace(token() ? "/dashboard" : "/login"); }, [router]);
  return <p className="muted" style={{ padding: "2rem" }}>Opening…</p>;
}
