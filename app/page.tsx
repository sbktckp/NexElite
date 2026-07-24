"use client";

import dynamic from "next/dynamic";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Work, CTA, Footer } from "@/components/WorkAndFooter";
import { SmoothScroll } from "@/components/SmoothScroll";

const SignalField = dynamic(
  () => import("@/components/SignalField").then((m) => m.SignalField),
  { ssr: false }
);

export default function Home() {
  return (
    <SmoothScroll>
      <div className="relative">
        <SignalField />
        <Hero />
        <Services />
        <Work />
        <CTA />
        <Footer />
      </div>
    </SmoothScroll>
  );
}
