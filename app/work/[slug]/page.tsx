import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { CASE_STUDIES, getCaseStudy } from "@/lib/work";

/**
 * Case study detail. Server rendered and fully static, so it costs no
 * client JavaScript beyond the shared runtime. The corridor deliberately
 * does not mount here. This page is the payoff, not the journey, and it
 * should load instantly.
 */

export function generateStaticParams() {
  return CASE_STUDIES.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) return {};
  return {
    title: `${study.client} — NexElite Media`,
    description: study.summary,
    openGraph: {
      title: `${study.client} — NexElite Media`,
      description: study.summary,
      images: [{ url: study.cover }],
    },
  };
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <section className="mb-10">
      <p
        className="font-tech text-xs font-bold uppercase tracking-[0.22em] mb-3"
        style={{ color: "#7EC8E3" }}
      >
        {label}
      </p>
      <p className="text-base sm:text-lg leading-relaxed" style={{ color: "#4d6577" }}>
        {body}
      </p>
    </section>
  );
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) notFound();

  return (
    <main
      className="min-h-[100svh] px-5 sm:px-6 pt-28 pb-24"
      style={{ background: "#ffffff", color: "#2F5D7C" }}
    >
      <div className="max-w-3xl mx-auto">
        <Link
          href="/#work"
          className="font-tech text-xs font-bold uppercase tracking-[0.22em] inline-block mb-8"
          style={{ color: "#7EC8E3" }}
        >
          Back to the work
        </Link>

        <p
          className="font-tech text-xs font-bold uppercase tracking-[0.22em] mb-4"
          style={{ color: "#2F5D7C" }}
        >
          {study.channel}
        </p>
        <h1
          className="font-disp font-extrabold mb-6"
          style={{
            fontSize: "clamp(34px, 8vw, 62px)",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          {study.client}
        </h1>
        <p className="text-lg sm:text-xl leading-relaxed mb-10" style={{ color: "#4d6577" }}>
          {study.summary}
        </p>

        <div className="relative aspect-[3/2] rounded-2xl overflow-hidden mb-12">
          <Image
            src={study.cover}
            alt={study.coverAlt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            style={{ viewTransitionName: `work-${study.slug}` }}
          />
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-6 p-6 rounded-2xl mb-12"
          style={{
            background: "rgba(234,246,255,0.7)",
            border: "1px solid rgba(126,200,227,0.45)",
          }}
        >
          {study.results.map((r) => (
            <div key={r.metric}>
              <p
                className="font-disp font-extrabold"
                style={{ fontSize: "clamp(24px, 5vw, 38px)", letterSpacing: "-0.02em" }}
              >
                {r.value}
              </p>
              <p className="text-xs uppercase tracking-wider mt-1" style={{ color: "#6f8ca3" }}>
                {r.metric}
              </p>
              {r.note && (
                <p className="text-xs mt-1" style={{ color: "#8aa3b5" }}>
                  {r.note}
                </p>
              )}
            </div>
          ))}
        </div>

        <Block label="The challenge" body={study.challenge} />
        <Block label="The strategy" body={study.strategy} />
        <Block label="The execution" body={study.execution} />

        {study.quote && (
          <blockquote
            className="p-7 rounded-2xl mb-12"
            style={{
              background: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(126,200,227,0.45)",
              boxShadow: "0 16px 40px -20px rgba(47,93,124,0.5)",
            }}
          >
            <p className="font-disp text-xl font-extrabold leading-snug mb-4">
              {study.quote.text}
            </p>
            <footer className="text-sm" style={{ color: "#6f8ca3" }}>
              {study.quote.attribution}, {study.quote.role}
            </footer>
          </blockquote>
        )}

        {study.media && study.media.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {study.media.map((m) =>
              m.kind === "video" ? (
                <video
                  key={m.src}
                  src={m.src}
                  muted
                  loop
                  playsInline
                  preload="none"
                  className="w-full rounded-xl"
                  aria-label={m.alt}
                />
              ) : (
                <div key={m.src} className="relative aspect-[3/2] rounded-xl overflow-hidden">
                  <Image
                    src={m.src}
                    alt={m.alt}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              )
            )}
          </div>
        )}

        <a
          href="mailto:nexelitemedia@gmail.com"
          className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-xl text-sm transition-transform duration-[240ms] hover:-translate-y-0.5"
          style={{
            background: "#2F5D7C",
            color: "#ffffff",
            boxShadow: "0 16px 36px -12px rgba(47,93,124,0.75)",
          }}
        >
          Start something like this <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
        </a>
      </div>
    </main>
  );
}
