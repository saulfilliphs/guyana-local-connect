import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Star, Ticket, X, ArrowRight, Utensils, Smartphone, Sparkles, ShoppingBag, Wrench, BedDouble, LayoutGrid, Ellipsis, Flame, MapPin, SlidersHorizontal } from "lucide-react";
import { businessesQuery, timeAgo, openStatus, type Business } from "@/lib/data";
import { CTAs, OpenBadge, SaveButton } from "@/components/site";
import { Button } from "@/components/ui/button";
import { useMarketplace } from "@/components/marketplace-context";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Guyana Ad Local — Discover Georgetown" },
    { name: "description", content: "Discover local restaurants, shops and services in Georgetown. Explore today's offers and connect directly with Guyanese businesses." },
    { property: "og:title", content: "Guyana Ad Local — Discover Georgetown" },
    { property: "og:description", content: "Local Businesses. Real People. Big Opportunities. Discover offers across Georgetown." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(businessesQuery()),
  errorComponent: ({ error }) => <p className="p-10 text-center text-destructive">Could not load the feed: {(error as Error).message}</p>,
  notFoundComponent: () => <p className="p-10 text-center">Not found.</p>,
  component: Feed,
});

const categories = [
  { label: "All", value: "All", icon: LayoutGrid }, { label: "Restaurants", value: "Restaurants", icon: Utensils },
  { label: "Phone Repair", value: "Phone Repair", icon: Smartphone }, { label: "Beauty & Health", value: "Beauty Salons", icon: Sparkles },
  { label: "Shops", value: "Markets & Groceries", icon: ShoppingBag }, { label: "Services", value: "Other", icon: Wrench },
  { label: "Hotels", value: "Hotels", icon: BedDouble }, { label: "More", value: "More", icon: Ellipsis },
];
const discovery = [
  { label: "Restaurants", value: "Restaurants", image: "/seed/food.jpg", icon: Utensils, description: "A taste of Georgetown" },
  { label: "Phone Repair", value: "Phone Repair", image: "/seed/phone.jpg", icon: Smartphone, description: "Back up and running" },
  { label: "Beauty & Health", value: "Beauty Salons", image: "/seed/salon.jpg", icon: Sparkles, description: "Feel your very best" },
  { label: "Shops", value: "Markets & Groceries", image: "/seed/market.jpg", icon: ShoppingBag, description: "Your everyday favorites" },
];
function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><h2 className="flex min-w-0 items-center gap-2 text-lg font-extrabold sm:text-xl">{title.startsWith("🔥") ? <Flame className="h-5 w-5 shrink-0 text-accent" /> : title.startsWith("⭐") ? <Star className="h-5 w-5 shrink-0 fill-accent text-accent" /> : null}{title.replace(/^[🔥⭐]\s*/u, "")}</h2>{action && <Button variant="link" onClick={onAction} className="h-9 px-0 text-xs">{action}<ArrowRight /></Button>}</div>;
}
function NearbyCard({ b }: { b: Business }) {
  return <article className="premium-card nearby-card relative w-[250px] shrink-0 overflow-hidden sm:w-[268px]">
    <Link to="/business/$id" params={{ id: b.id }}><img src={b.images[0]} alt={b.name} className="h-40 w-full object-cover" /></Link>
    <div className="absolute right-3 top-3"><SaveButton b={b} /></div>
    {b.isFeatured && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-[10px] font-bold text-accent-foreground"><Star className="h-3 w-3 fill-current" />Featured</span>}
    <div className="p-4"><div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><p className="truncate text-[11px] text-muted-foreground" title={`${b.category} · ${b.zone}`}>{b.category} · {b.zone}</p><OpenBadge b={b} compact /></div><Link to="/business/$id" params={{ id: b.id }} className="block truncate text-base font-extrabold" title={b.name}>{b.name}</Link><p className="mt-2 line-clamp-2 min-h-9 text-xs leading-relaxed text-muted-foreground">{b.promo?.title ?? b.description}</p><Link to="/business/$id" params={{ id: b.id }} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary">{b.promo ? "View offer" : "View business"}<ArrowRight className="h-3.5 w-3.5" /></Link></div>
  </article>;
}

function Feed() {
  const { data: businesses } = useSuspenseQuery(businessesQuery());
  const { search, setSearch, zone, setZone } = useMarketplace();
  const [cat, setCat] = useState("All");
  const [story, setStory] = useState<Business | null>(null);
  const [openOnly, setOpenOnly] = useState(false);
  const [more, setMore] = useState(false);
  // Open-state changes are driven by the existing local-time utility, never stored as business data.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const interval = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(interval); }, []);
  useEffect(() => { if (!story) return; const close = (event: KeyboardEvent) => { if (event.key === "Escape") setStory(null); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [story]);
  const list = useMemo(() => businesses.filter((b) => {
    return (cat === "All" || b.category === cat) && (zone === "All zones" || b.zone === zone) && (!openOnly || now !== null && openStatus(b.hours, now).open) && `${b.name} ${b.promo?.title ?? ""} ${b.description} ${b.services.join(" ")}`.toLowerCase().includes(search.toLowerCase());
  }), [businesses, cat, zone, search, openOnly, now]);
  const featured = list.find((b) => b.isFeatured) ?? list[0];
  const stories = businesses.filter((b) => b.promo);
  const selectCategory = (value: string) => { if (value === "More") setMore(!more); else { setCat(value); setMore(false); } };
  const showAll = () => { setCat("All"); setSearch(""); setZone("All zones"); setOpenOnly(false); document.getElementById("business-feed")?.scrollIntoView({ behavior: "smooth" }); };

  return <main className="page-shell reference-feed fade-in">
    <div className="reference-categories" ><div className="scroll-row flex gap-3 pb-2 pt-1 sm:gap-5" aria-label="Business categories">{categories.map((c) => <Button key={c.label} onClick={() => selectCategory(c.value)} variant="ghost" aria-pressed={cat === c.value} className={`reference-category shrink-0 flex-col gap-2 p-0 text-xs ${cat === c.value ? "is-selected text-accent" : "text-primary-foreground"}`}><span className="category-control category-icon"><c.icon /></span><span>{c.label}</span></Button>)}</div></div>
    {more && <div className="my-2 flex flex-wrap gap-2">{[...new Set(businesses.map((b) => b.category))].map((value) => <Button key={value} variant="outline" onClick={() => selectCategory(value)}>{value}</Button>)}</div>}
    <section className="reference-stories mb-5 mt-4"><div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-xs font-extrabold">Today's stories</h2><Button variant={openOnly ? "secondary" : "ghost"} onClick={() => setOpenOnly(!openOnly)} aria-pressed={openOnly} title="Filter open businesses" aria-label="Filter open businesses" className="h-11 rounded-full px-3 text-xs"><SlidersHorizontal />Open now</Button></div><div className="scroll-row flex gap-5 sm:gap-7">{!stories.length && <p className="text-sm text-muted-foreground">No deals today.</p>}{stories.map((b) => <Button variant="ghost" key={b.id} aria-label={`${b.name} story`} onClick={() => setStory(b)} className="story-control h-auto w-[88px] shrink-0 flex-col gap-2 p-0 hover:bg-transparent hover:text-primary"><span className="story-ring relative rounded-full border-2 border-accent p-1 shadow-soft"><img src={b.promo?.image ?? b.images[0]} alt={b.name} className="h-[76px] w-[76px] rounded-full object-cover" /><OpenBadge b={b} dot /></span><span className="w-full truncate text-xs font-bold">{b.name}</span></Button>)}</div></section>
    <h1 className="sr-only">Discover Georgetown</h1>
    {featured && <article className="reference-featured relative mb-6 overflow-hidden rounded-[22px] shadow-elevated">
      <img src={featured.images[0]} alt={featured.name} className="featured-photo h-[430px] w-full object-cover sm:h-[410px]" /><div className="photo-shade pointer-events-none absolute inset-0" />
      <div className="absolute right-5 top-5"><SaveButton b={featured} /></div>
      <div className="absolute left-5 top-5 flex gap-2">{featured.isFeatured && <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[11px] font-extrabold text-accent-foreground"><Star className="h-3 w-3 fill-current" />Featured</span>}{featured.promo && <span className="photo-glass rounded-full px-3 py-1.5 text-[11px] font-bold text-primary-foreground">Special Offer</span>}</div>
      <div className="featured-panel photo-glass absolute inset-x-2 bottom-2 grid gap-3 rounded-[20px] p-4 text-primary-foreground sm:inset-x-5 sm:bottom-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-5"><div className="min-w-0"><h2 className="line-clamp-2 text-2xl font-extrabold leading-tight sm:text-3xl">{featured.name}</h2><p className="mt-1 truncate text-xs font-medium text-primary-foreground/90">{featured.category} • {featured.zone} • {timeAgo(featured.createdAt)}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span className="featured-open rounded-full px-2 py-1"><OpenBadge b={featured} compact /></span><span className="inline-flex items-center gap-1 text-primary-foreground/90"><MapPin className="h-3 w-3 text-accent" />{featured.zone}, Georgetown</span></div>{featured.promo && <p className="featured-copy mt-2 line-clamp-2 text-sm font-semibold leading-snug text-primary-foreground">{featured.promo.title}</p>}</div><Button asChild variant="gold" size="lg" className="featured-cta w-full rounded-full sm:w-auto"><Link to="/business/$id" params={{ id: featured.id }}>{featured.promo ? "View Offer" : "View Business"}<ArrowRight /></Link></Button></div>
    </article>}
    {!list.length && <div className="py-12 text-center"><p className="text-muted-foreground">No businesses match your search.</p><Button variant="link" onClick={showAll}>Clear filters<ArrowRight /></Button></div>}
    {list.length > 0 && <section className="mb-7"><SectionHeading title="🔥 Popular Near You" action="See All" onAction={showAll} /><div className="scroll-row -mx-1 flex gap-4 px-1 pb-4 pt-1">{list.map((b) => <NearbyCard key={b.id} b={b} />)}</div></section>}
    <section className="mb-7"><SectionHeading title="Find your next local favorite" /><div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{discovery.map((c) => <article key={c.value} className="premium-card overflow-hidden"><img src={businesses.find((b) => b.category === c.value)?.images[0] ?? c.image} alt={c.label} className="h-28 w-full object-cover sm:h-36" /><div className="relative p-3 sm:p-4"><span className="absolute -top-5 left-3 grid h-9 w-9 place-items-center rounded-xl border-4 border-card bg-secondary text-primary"><c.icon className="h-4 w-4" /></span><h3 className="mt-3 text-xs font-extrabold sm:text-sm">{c.label}</h3><p className="mb-3 mt-1 text-[10px] text-muted-foreground sm:text-xs">{c.description}</p><Button variant="secondary" size="icon" aria-label={`Explore ${c.label}`} onClick={() => { setCat(c.value); document.getElementById("business-feed")?.scrollIntoView({ behavior: "smooth" }); }} className="ml-auto h-8 w-8 rounded-full"><ArrowRight /></Button></div></article>)}</div></section>
    <section className="mb-7"><SectionHeading title="⭐ Top Rated Businesses" /><p className="mb-4 text-xs text-muted-foreground">No customer ratings yet.</p><div className="grid gap-3 sm:grid-cols-2">{list.slice(0, 4).map((b) => <article key={b.id} className="premium-card flex min-w-0 items-center gap-3 p-3"><img src={b.images[0]} alt={b.name} className="h-16 w-16 shrink-0 rounded-2xl object-cover" /><div className="min-w-0 flex-1"><Link to="/business/$id" params={{ id: b.id }} className="block truncate text-xs font-extrabold sm:text-sm">{b.name}</Link><span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><Star className="h-3 w-3 text-accent" />Not rated · No reviews yet</span><span className="mt-1 block text-[10px] text-muted-foreground">{b.zone}</span></div><Button asChild variant="secondary" size="icon" className="h-8 w-8 rounded-full"><Link to="/business/$id" params={{ id: b.id }} aria-label={`View ${b.name}`}><ArrowRight /></Link></Button></article>)}</div></section>
    <section id="business-feed" className="scroll-mt-5"><SectionHeading title={cat === "All" ? "The local feed" : categories.find((c) => c.value === cat)?.label ?? cat} /><div className="grid gap-5 md:grid-cols-2">{list.map((b) => <article key={b.id} className="premium-card overflow-hidden"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-4"><div className="flex min-w-0 items-center gap-3"><img src={b.images[0]} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" /><div className="min-w-0"><Link to="/business/$id" params={{ id: b.id }} className="block truncate text-sm font-extrabold">{b.name}</Link><p className="mt-1 truncate text-[10px] text-muted-foreground">{b.category} · {b.zone} · {timeAgo(b.createdAt)}</p></div></div><SaveButton b={b} /></div><Link to="/business/$id" params={{ id: b.id }}><img src={b.images[0]} alt={b.name} className="aspect-[16/10] w-full object-cover" /></Link><div className="space-y-3 p-4 sm:p-5"><div className="flex items-center justify-between"><OpenBadge b={b} />{b.isFeatured && <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-1 text-[10px] font-bold text-accent-foreground"><Star className="h-3 w-3 fill-accent text-accent" />Featured</span>}</div>{b.promo && <p className="text-base font-extrabold leading-snug">{b.promo.title}</p>}{b.promo?.coupon && <div className="inline-flex items-center gap-2 rounded-lg border border-dashed border-accent bg-accent/10 px-3 py-2 text-xs font-bold"><Ticket className="h-4 w-4 text-primary" />Coupon: {b.promo.coupon}</div>}<p className="text-xs leading-relaxed text-muted-foreground">{b.description}</p><CTAs b={b} /></div></article>)}</div></section>
    <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-[11px] text-muted-foreground"><span className="font-bold text-primary">Guyana Ad Local</span><span>Made for our neighborhoods. Built around our people.</span><Link to="/pricing" className="font-semibold text-primary">Advertise your business →</Link></footer>
    {story && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4 backdrop-blur-sm" onClick={() => setStory(null)}><div role="dialog" aria-modal="true" aria-label={`${story.name} offer`} className="relative max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-[26px] bg-card shadow-elevated" onClick={(e) => e.stopPropagation()}><img src={story.promo?.image ?? story.images[0]} alt={story.name} className="aspect-square w-full object-cover" /><Button onClick={() => setStory(null)} aria-label="Close offer" variant="outline" size="icon" className="absolute right-3 top-3 rounded-full bg-card/95"><X /></Button><div className="space-y-3 p-5"><p className="text-xs font-bold text-primary">{story.name}</p><p className="text-xl font-extrabold">{story.promo?.title}</p>{story.promo?.coupon && <p className="text-sm font-bold">Coupon: {story.promo.coupon}</p>}<CTAs b={story} /></div></div></div>}
  </main>;
}
