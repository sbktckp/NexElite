import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { CASE_STUDIES } from "@/lib/work";

/**
 * The proof beat. Teasers here, depth on /work/[slug].
 *
 * Renders nothing at all while CASE_STUDIES is empty. An empty section is
 * worse than no section, and filler undermines the one thing this beat is
 * supposed to do.
 */
export function WorkTeasers() {
  if (CASE_STUDIES.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
      {CASE_STUDIES.map((study) => (
        <Link
          key={study.slug}
          href={`/work/${study.slug}`}
          prefetch
          className="motion-tile group rounded-2xl overflow-hidden transition-transform duration-[240ms] hover:-translate-y-1"
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(126,200,227,0.45)",
            boxShadow: "0 16px 40px -20px rgba(47,93,124,0.5)",
          }}
        >
          <div className="relative aspect-[3/2] overflow-hidden">
            <Image
              src={study.cover}
              alt={study.coverAlt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-[480ms] group-hover:scale-[1.03]"
              style={{ viewTransitionName: `work-${study.slug}` }}
            />
          </div>
          <div className="p-5">
            <p
              className="font-tech text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
              style={{ color: "#7EC8E3" }}
            >
              {study.channel}
            </p>
            <h3
              className="font-disp text-xl font-extrabold mb-2 flex items-center gap-1.5"
              style={{ color: "#2F5D7C" }}
            >
              {study.client}
              <ArrowUpRight className="w-4 h-4 flex-shrink-0 opacity-0 -translate-x-1 transition-all duration-[240ms] group-hover:opacity-100 group-hover:translate-x-0" />
            </h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#4d6577" }}>
              {study.summary}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {study.results.slice(0, 2).map((r) => (
                <div key={r.metric}>
                  <p className="font-disp text-lg font-extrabold" style={{ color: "#2F5D7C" }}>
                    {r.value}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider" style={{ color: "#6f8ca3" }}>
                    {r.metric}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
