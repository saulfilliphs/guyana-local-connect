import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, MapPin, MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminBusinesses } from "./BusinessesTab";

type Ev = { business_id: string; event_type: "whatsapp" | "call" | "map" | "view"; created_at: string };
const TYPES = [
  { k: "view", label: "Views", icon: Eye, cls: "bg-primary" },
  { k: "whatsapp", label: "WhatsApp", icon: MessageCircle, cls: "bg-whatsapp" },
  { k: "call", label: "Calls", icon: Phone, cls: "bg-accent" },
  { k: "map", label: "Directions", icon: MapPin, cls: "bg-muted-foreground" },
] as const;

export function MetricsTab() {
  const [days, setDays] = useState(30);
  const biz = useAdminBusinesses().data ?? [];
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-clicks", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const all: Ev[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from("click_events").select("business_id,event_type,created_at").gte("created_at", since).range(from, from + 999);
        if (error) throw error;
        all.push(...data);
        if (data.length < 1000) break;
      }
      return all;
    },
  });

  const totals = Object.fromEntries(TYPES.map((t) => [t.k, events.filter((e) => e.event_type === t.k).length]));
  const rows = biz.map((b) => {
    const ev = events.filter((e) => e.business_id === b.id);
    const c = Object.fromEntries(TYPES.map((t) => [t.k, ev.filter((e) => e.event_type === t.k).length])) as Record<string, number>;
    return { b, c, total: ev.length };
  }).sort((a, z) => z.total - a.total);
  const max = Math.max(1, ...rows.map((r) => r.total));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Metrics</h2>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-xl border bg-card px-3 py-1.5 text-sm">
          <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={3650}>All time</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {TYPES.map((t) => (
          <div key={t.k} className="rounded-2xl border bg-card p-4">
            <t.icon className="h-5 w-5 text-primary" />
            <p className="mt-2 text-3xl font-extrabold">{isLoading ? "…" : totals[t.k]}</p>
            <p className="text-xs text-muted-foreground">{t.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border bg-card p-4">
        <div className="mb-3 flex flex-wrap gap-3 text-xs">
          {TYPES.map((t) => <span key={t.k} className="flex items-center gap-1"><span className={`h-3 w-3 rounded ${t.cls}`} />{t.label}</span>)}
        </div>
        <ul className="space-y-3">
          {rows.map(({ b, c, total }) => (
            <li key={b.id}>
              <div className="flex justify-between text-sm"><b>{b.name}</b><span className="text-muted-foreground">{c["view"]} views · {c["whatsapp"]} WhatsApp · {c["call"]} calls · {c["map"]} maps</span></div>
              <div className="mt-1 flex h-3 overflow-hidden rounded-full bg-muted" style={{ width: `${Math.max(4, (total / max) * 100)}%` }}>
                {TYPES.map((t) => total > 0 && <div key={t.k} className={t.cls} style={{ width: `${(c[t.k]! / total) * 100}%` }} />)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
