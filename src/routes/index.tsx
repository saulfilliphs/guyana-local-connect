import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search, Star, Ticket, X } from "lucide-react";
import { businessesQuery, timeAgo, CATEGORIES, ZONES, type Business } from "@/lib/data";
import { CTAs, OpenBadge } from "@/components/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Guyana Ad Local — Georgetown deals & local businesses" },
      { name: "description", content: "Discover today's offers from restaurants, salons and repair shops in Georgetown, Guyana. Message them on WhatsApp in one tap." },
      { property: "og:title", content: "Guyana Ad Local — Georgetown deals" },
      { property: "og:description", content: "Local offers and businesses in Georgetown, one tap from WhatsApp." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(businessesQuery()),
  errorComponent: ({ error }) => <p className="p-10 text-center text-destructive">Could not load the feed: {error.message}</p>,
  notFoundComponent: () => <p className="p-10 text-center">Not found.</p>,
  component: Feed,
});

function Feed() {
  const { data: BUSINESSES } = useSuspenseQuery(businessesQuery());
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [zone, setZone] = useState<string>("All zones");
  const [story, setStory] = useState<Business | null>(null);

  const list = useMemo(() => BUSINESSES.filter((b) =>
    (cat === "All" || b.category === cat) &&
    (zone === "All zones" || b.zone === zone) &&
    `${b.name} ${b.promo?.title ?? ""} ${b.description} ${b.services.join(" ")}`.toLowerCase().includes(q.toLowerCase())
  ), [BUSINESSES, q, cat, zone]);

  const stories = BUSINESSES.filter((b) => b.promo);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <div className="sticky top-[60px] z-20 -mx-4 space-y-3 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-xl border bg-card px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search food, repairs, salons…" className="w-full bg-transparent text-sm outline-none" />
          </label>
          <select value={zone} onChange={(e) => setZone(e.target.value)} className="rounded-xl border bg-card px-2 text-sm">
            {ZONES.map((z) => <option key={z}>{z}</option>)}
          </select>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${cat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <section className="my-4">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Today's deals</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {stories.length === 0 && <p className="text-sm text-muted-foreground">No deals today.</p>}
          {stories.map((b) => (
            <button key={b.id} onClick={() => setStory(b)} className="flex w-20 shrink-0 flex-col items-center gap-1">
              <span className="rounded-full bg-gradient-to-tr from-accent to-primary p-[3px]">
                <img src={b.promo?.image ?? b.images[0]} alt="" className="h-16 w-16 rounded-full border-2 border-background object-cover" />
              </span>
              <span className="w-full truncate text-xs font-medium">{b.name}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-6">
        {list.length === 0 && <p className="py-10 text-center text-muted-foreground">No businesses match your search.</p>}
        {list.map((b) => (
          <article key={b.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center gap-3 p-3">
              <img src={b.images[0]} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div className="flex-1">
                <Link to="/business/$id" params={{ id: b.id }} className="font-bold hover:underline">{b.name}</Link>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{b.category} · {b.zone} · {timeAgo(b.createdAt)}</span>
                </div>
              </div>
              {b.isFeatured && <span className="flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-bold"><Star className="h-3 w-3 fill-accent text-accent" />Featured</span>}
            </div>
            <Link to="/business/$id" params={{ id: b.id }}>
              <img src={b.images[0]} alt={b.name} className="aspect-[4/3] w-full object-cover" />
            </Link>
            <div className="space-y-3 p-4">
              <OpenBadge b={b} />
              {b.promo && <p className="text-lg font-bold leading-snug">{b.promo.title}</p>}
              {b.promo?.coupon && (
                <div className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-accent bg-accent/15 px-3 py-1.5 text-sm font-bold">
                  <Ticket className="h-4 w-4" /> Coupon: {b.promo.coupon}
                </div>
              )}
              <p className="text-sm text-muted-foreground">{b.description}</p>
              <CTAs b={b} />
            </div>
          </article>
        ))}
      </div>

      {story && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4" onClick={() => setStory(null)}>
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-card" onClick={(e) => e.stopPropagation()}>
            <img src={story.promo?.image ?? story.images[0]} alt="" className="aspect-[9/12] w-full object-cover" />
            <button onClick={() => setStory(null)} aria-label="Close" className="absolute right-3 top-3 rounded-full bg-card/80 p-1.5"><X className="h-5 w-5" /></button>
            <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-primary to-transparent p-4 pt-16 text-primary-foreground">
              <p className="text-sm font-semibold text-accent">{story.name}</p>
              <p className="text-xl font-extrabold">{story.promo?.title}</p>
              {story.promo?.coupon && <p className="text-sm font-bold">Coupon: {story.promo.coupon}</p>}
              <CTAs b={story} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
