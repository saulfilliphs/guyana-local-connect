import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Phone, MapPin, Search, Bell, Menu, ChevronDown, ArrowUpRight, Home, Heart, UserRound, X, Navigation } from "lucide-react";
import { openStatus, waLink, mapsLink, logClick, businessesQuery, ZONES, type Business } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useMarketplace } from "@/components/marketplace-context";
import botanicalHeader from "@/assets/botanical-header.jpg";

function AuthLink({ cls }: { cls: string }) {
  const [signedIn, setSignedIn] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSignedIn(!!session);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") router.invalidate();
    });
    return () => data.subscription.unsubscribe();
  }, [router]);
  if (!signedIn) return <Link to="/login" className={cls}>Sign in <ArrowUpRight className="h-4 w-4" /></Link>;
  return <><Link to="/admin" className={cls}>Admin</Link><Button variant="glass" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login", replace: true }); }}>Sign out</Button></>;
}

export function Header() {
  const [menu, setMenu] = useState(false);
  const { search, setSearch, zone, setZone, setPanel } = useMarketplace();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const cls = "inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground";
  return <header className="brand-header botanical-header relative z-30 overflow-visible text-primary-foreground">
    <img src={botanicalHeader} width={1536} height={768} alt="" aria-hidden="true" className="botanical-canopy pointer-events-none absolute inset-0 h-full w-full object-cover" />
    <div className="relative mx-auto max-w-[1120px] px-4 pb-4 pt-10 sm:px-6 sm:pt-14">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <Link to="/" onClick={() => setPanel(null)} className="flex min-w-0 items-center gap-3">
          <img src="/favicon.svg" alt="" width={64} height={80} className="brand-logo h-14 w-11 shrink-0 sm:h-16 sm:w-12" />
          <div className="min-w-0"><span className="brand-title block text-xl font-extrabold sm:text-3xl">Guyana <span className="text-accent">Ad</span> Local</span><span className="mt-1 hidden text-[11px] font-semibold text-primary-foreground/90 sm:block">Local Businesses • Real People • Big Opportunities</span></div>
        </Link>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <nav className="hidden items-center gap-1 lg:flex"><Link to="/" className={cls} activeProps={{ className: "text-accent" }}>Explore</Link><Link to="/results" className={cls}>Results</Link><Link to="/pricing" className={cls}>Plans</Link><AuthLink cls={cls} /></nav>
          <Button variant="ghost" size="icon" className="header-icon" aria-label="Notifications" title="Notifications" onClick={() => setPanel("notifications")}><Bell /></Button>
          <Button variant="ghost" size="icon" className="header-icon" aria-label="Menu" title="Menu" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</Button>
        </div>
      </div>
      <p className="mt-2 text-[10px] font-semibold text-primary-foreground/90 sm:hidden">Local Businesses • Real People • Big Opportunities</p>
      {menu && <nav className="photo-glass header-menu absolute right-5 top-20 z-40 flex min-w-48 flex-col rounded-2xl p-2" onClick={() => setMenu(false)}><Link to="/" className={cls}>Feed</Link><Link to="/results" className={cls}>Results</Link><Link to="/pricing" className={cls}>Plans</Link><AuthLink cls={cls} /></nav>}
      <div className="header-search-row mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_230px] sm:gap-5">
        <form className="glass-search reference-search flex min-w-0 items-center gap-3 rounded-full border border-primary-foreground/40 p-1.5 pl-4 text-primary-foreground" onSubmit={(e) => { e.preventDefault(); if (pathname !== "/") navigate({ to: "/" }); }}>
          <Search className="h-6 w-6 shrink-0" /><input aria-label="Search businesses" value={search} onChange={(e) => { setSearch(e.target.value); if (pathname !== "/") navigate({ to: "/" }); }} placeholder="Search for restaurants, shops, services..." className="h-10 w-full min-w-0 bg-transparent text-xs outline-none placeholder:text-primary-foreground/85 sm:text-sm" />
          <Button variant="gold" size="icon" type="submit" className="rounded-full" aria-label="Search"><Search /></Button>
        </form>
        <label className="reference-location flex min-w-0 items-center gap-2 rounded-full sm:border sm:border-primary-foreground/20 sm:bg-primary-foreground/10 sm:px-4 sm:py-2.5"><MapPin className="h-4 w-4 shrink-0 text-accent" /><div className="min-w-0 flex-1"><span className="hidden text-[10px] text-primary-foreground/60 sm:block">Your neighborhood</span><select aria-label="Location" value={zone} onChange={(e) => { setZone(e.target.value); if (pathname !== "/") navigate({ to: "/" }); }} className="w-full appearance-none bg-transparent text-xs font-bold outline-none sm:text-sm">{ZONES.map((z) => <option className="bg-card text-foreground" key={z} value={z}>{z === "All zones" ? "Georgetown" : z}</option>)}</select></div><ChevronDown className="h-4 w-4 shrink-0" /></label>
      </div>
    </div>
  </header>;
}

export function OpenBadge({ b, compact = false, dot = false }: { b: Business; compact?: boolean; dot?: boolean }) {
  const [s, setS] = useState<{ open: boolean; label: string } | null>(null);
  useEffect(() => { const u = () => setS(openStatus(b.hours)); u(); const i = setInterval(u, 60000); return () => clearInterval(i); }, [b]);
  if (dot) return s?.open ? <span aria-label="Open now" title="Open now" className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald" /> : null;
  if (!s) return <span className="text-xs text-muted-foreground">Checking hours…</span>;
  return <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${s.open ? "text-emerald" : "text-muted-foreground"}`}><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.open ? "bg-emerald" : "bg-muted-foreground"}`} />{compact ? s.open ? "Open now" : "Closed now" : s.label}</span>;
}

export function SaveButton({ b }: { b: Business }) {
  const { saved, toggleSaved } = useMarketplace();
  const selected = saved.includes(b.id);
  return <Button variant="outline" size="icon" aria-label={`${selected ? "Unsave" : "Save"} ${b.name}`} aria-pressed={selected} title={selected ? "Remove from saved" : "Save business"} onClick={() => toggleSaved(b.id)} className={`h-9 w-9 rounded-full border-card/40 bg-card/95 shadow-soft ${selected ? "favorite-on text-primary" : "text-foreground"}`}><Heart className={selected ? "fill-primary" : ""} /></Button>;
}

export function CTAs({ b }: { b: Business }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_44px_44px] gap-2">
    <Button asChild className="h-12 min-w-0 bg-whatsapp px-2 text-xs text-whatsapp-foreground hover:bg-whatsapp/90 sm:text-sm"><a href={waLink(b)} target="_blank" rel="noreferrer" onClick={() => logClick(b, "whatsapp")}><MessageCircle /> Message on WhatsApp</a></Button>
    <Button asChild variant="outline" size="icon" className="h-12 text-primary"><a href={`tel:${b.phone}`} onClick={() => logClick(b, "call")} aria-label="Call" title="Call"><Phone /></a></Button>
    <Button asChild variant="outline" size="icon" className="h-12 text-primary"><a href={mapsLink(b)} target="_blank" rel="noreferrer" onClick={() => logClick(b, "map")} aria-label="Directions" title="Directions"><MapPin /></a></Button>
  </div>;
}

export function BottomNavigation() {
  const { panel, setPanel } = useMarketplace();
  const [navHidden, setNavHidden] = useState(false);
  const path = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    let lastY = window.scrollY;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (idle) clearTimeout(idle);
      if (dy > 0 && y > 60) setNavHidden(true);
      else if (dy < 0) setNavHidden(false);
      idle = setTimeout(() => setNavHidden(false), 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (idle) clearTimeout(idle); };
  }, []);
  const showNav = () => setNavHidden(false);
  return <nav aria-label="Bottom navigation" className={`bottom-dock ${navHidden ? "nav-hidden" : ""} fixed inset-x-2 bottom-2 z-40 mx-auto grid max-w-[620px] grid-cols-5 gap-1 rounded-[24px] border border-primary-foreground/20 p-2 pb-[max(8px,env(safe-area-inset-bottom))] text-primary-foreground`}>
    <Button asChild variant="ghost" onClick={showNav} className={`h-12 min-w-0 flex-col gap-1 rounded-2xl px-0 text-[10px] hover:bg-primary-foreground/10 hover:text-accent ${path === "/" && !panel ? "bg-primary-foreground/10 text-accent" : "text-primary-foreground/70"}`}><Link to="/" onClick={() => setPanel(null)}><Home />Home</Link></Button>
    {([{ key: "map", label: "Map", icon: MapPin }, { key: "saved", label: "Saved", icon: Heart }, { key: "notifications", label: "Notifications", icon: Bell }] as const).map((item) => <Button key={item.key} variant="ghost" onClick={showNav} className={`h-12 min-w-0 flex-col gap-1 rounded-2xl px-0 text-[10px] hover:bg-primary-foreground/10 hover:text-accent ${panel === item.key ? "bg-primary-foreground/10 text-accent" : "text-primary-foreground/70"}`}><item.icon />{item.label}</Button>)}
    <Button asChild variant="ghost" onClick={showNav} className={`h-12 min-w-0 flex-col gap-1 rounded-2xl px-0 text-[10px] hover:bg-primary-foreground/10 hover:text-accent ${path.includes("login") || path.includes("admin") ? "text-accent" : "text-primary-foreground/70"}`}><Link to="/login" onClick={() => setPanel(null)}><UserRound />Profile</Link></Button>
  </nav>;
}

export function MarketplacePanel() {
  const { panel, setPanel, saved } = useMarketplace();
  const { data: businesses = [] } = useQuery({ ...businessesQuery(), enabled: panel !== null });
  if (!panel) return null;
  const list = panel === "saved" ? businesses.filter((b) => saved.includes(b.id)) : panel === "notifications" ? businesses.filter((b) => b.promo) : businesses;
  return <div className="fixed inset-0 z-50 bg-foreground/50 p-4 backdrop-blur-sm" onClick={() => setPanel(null)}><section role="dialog" aria-modal="true" aria-label={panel === "map" ? "Explore Georgetown" : panel === "saved" ? "Saved businesses" : "Today's offers"} className="mx-auto mt-8 max-h-[80dvh] max-w-lg overflow-y-auto rounded-[24px] bg-card p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
    <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><h2 className="text-xl font-extrabold">{panel === "map" ? "Explore Georgetown" : panel === "saved" ? "Saved businesses" : "Today's offers"}</h2><Button variant="ghost" size="icon" aria-label="Close" onClick={() => setPanel(null)}><X /></Button></div>
    {panel === "map" && <Button asChild variant="secondary" className="mb-4 w-full"><a href="https://www.google.com/maps/search/?api=1&query=Georgetown+Guyana" target="_blank" rel="noreferrer"><Navigation />Open Georgetown in Google Maps</a></Button>}
    {!list.length && <p className="py-8 text-center text-muted-foreground">{panel === "saved" ? "No saved businesses yet." : "No offers available right now."}</p>}
    <div className="divide-y">{list.map((b) => <div className="flex items-center gap-3 py-4" key={b.id}><img src={b.images[0]} alt={b.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" /><div className="min-w-0 flex-1"><Link to="/business/$id" params={{ id: b.id }} onClick={() => setPanel(null)} className="font-bold">{b.name}</Link><p className="mt-1 text-xs text-muted-foreground">{panel === "notifications" ? b.promo?.title : `${b.category} · ${b.zone}`}</p></div>{panel === "map" ? <Button asChild variant="outline" size="icon"><a href={mapsLink(b)} target="_blank" rel="noreferrer" aria-label={`Directions to ${b.name}`} onClick={() => logClick(b, "map")}><MapPin /></a></Button> : <SaveButton b={b} />}</div>)}</div>
  </section></div>;
}
