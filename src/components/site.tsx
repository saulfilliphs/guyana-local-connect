import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Phone, MapPin } from "lucide-react";
import { openStatus, waLink, mapsLink, logClick, type Business } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";

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
  if (!signedIn) return <Link to="/login" className={cls}>Sign in</Link>;
  return (
    <>
      <Link to="/admin" className={cls}>Admin</Link>
      <button className={cls} onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login", replace: true }); }}>Sign out</button>
    </>
  );
}

export function Header() {
  const cls = "px-3 py-1.5 rounded-full text-sm font-semibold text-primary-foreground/80 hover:text-primary-foreground";
  const active = { className: "bg-accent !text-accent-foreground" };
  return (
    <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="font-display text-xl font-extrabold tracking-tight">
          Guyana<span className="text-accent"> Ad </span>Local
        </Link>
        <nav className="flex flex-wrap gap-1">
          <Link to="/" className={cls} activeProps={active} activeOptions={{ exact: true }}>Feed</Link>
          <Link to="/results" className={cls} activeProps={active}>Results</Link>
          <Link to="/pricing" className={cls} activeProps={active}>Plans</Link>
          <AuthLink cls={cls} />
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
      <a href={waLink(b)} target="_blank" rel="noreferrer" onClick={() => logClick(b, "whatsapp")}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 py-3 font-bold text-whatsapp-foreground hover:opacity-90">
        <MessageCircle className="h-5 w-5" /> Message on WhatsApp
      </a>
      <a href={`tel:${b.phone}`} onClick={() => logClick(b, "call")} aria-label="Call" className="flex items-center justify-center rounded-xl border-2 border-primary px-4 text-primary hover:bg-primary hover:text-primary-foreground">
        <Phone className="h-5 w-5" />
      </a>
      <a href={mapsLink(b)} target="_blank" rel="noreferrer" onClick={() => logClick(b, "map")} aria-label="Directions" className="flex items-center justify-center rounded-xl border-2 border-primary px-4 text-primary hover:bg-primary hover:text-primary-foreground">
        <MapPin className="h-5 w-5" />
      </a>
    </div>
  );
}
