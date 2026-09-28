import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Phone, MapPin } from "lucide-react";
import { openStatus, waLink, mapsLink, type Business } from "@/lib/data";

export function Header() {
  const cls = "px-3 py-1.5 rounded-full text-sm font-semibold text-primary-foreground/80 hover:text-primary-foreground";
  const active = { className: "bg-accent !text-accent-foreground" };
  return (
    <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="font-display text-xl font-extrabold tracking-tight">
          Guyana<span className="text-accent"> Ad </span>Local
        </Link>
        <nav className="flex gap-1">
          <Link to="/" className={cls} activeProps={active} activeOptions={{ exact: true }}>Feed</Link>
          <Link to="/results" className={cls} activeProps={active}>Results</Link>
          <Link to="/pricing" className={cls} activeProps={active}>Plans</Link>
        </nav>
      </div>
    </header>
  );
}

export function OpenBadge({ b }: { b: Business }) {
  const [s, setS] = useState<{ open: boolean; label: string } | null>(null);
  useEffect(() => {
    const u = () => setS(openStatus(b.hours));
    u();
    const i = setInterval(u, 60000);
    return () => clearInterval(i);
  }, [b]);
  if (!s) return <span className="text-xs text-muted-foreground">…</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${s.open ? "text-whatsapp" : "text-destructive"}`}>
      <span className={`h-2 w-2 rounded-full ${s.open ? "bg-whatsapp" : "bg-destructive"}`} />
      {s.label}
    </span>
  );
}

export function CTAs({ b }: { b: Business }) {
  return (
    <div className="flex gap-2">
      <a href={waLink(b)} target="_blank" rel="noreferrer"
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 py-3 font-bold text-whatsapp-foreground hover:opacity-90">
        <MessageCircle className="h-5 w-5" /> Message on WhatsApp
      </a>
      <a href={`tel:${b.phone}`} aria-label="Call" className="flex items-center justify-center rounded-xl border-2 border-primary px-4 text-primary hover:bg-primary hover:text-primary-foreground">
        <Phone className="h-5 w-5" />
      </a>
      <a href={mapsLink(b)} target="_blank" rel="noreferrer" aria-label="Directions" className="flex items-center justify-center rounded-xl border-2 border-primary px-4 text-primary hover:bg-primary hover:text-primary-foreground">
        <MapPin className="h-5 w-5" />
      </a>
    </div>
  );
}
