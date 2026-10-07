import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, MessageCircle, Phone, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { businessesQuery } from "@/lib/data";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Results — Guyana Ad Local for business owners" },
      { name: "description", content: "See how many people viewed your listing, messaged you on WhatsApp and called your business." },
      { property: "og:title", content: "Results — Guyana Ad Local" },
      { property: "og:description", content: "Track views, WhatsApp clicks and calls for your Georgetown business." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Results,
});

const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function series(seed: number) {
  return week.map((_, i) => Math.round(80 + ((seed * 37 + i * 53) % 90) + i * 12));
}

function Results() {
  const BUSINESSES = useQuery(businessesQuery()).data ?? [];
  const [picked, setId] = useState<string | null>(null);
  const id = picked ?? BUSINESSES[0]?.id ?? "";
  const seed = BUSINESSES.findIndex((b) => b.id === id) + 1;
  const views = series(seed);
  const total = views.reduce((a, b) => a + b, 0);
  const max = Math.max(...views);
  const stats = [
    { label: "Profile views", value: total, icon: Eye, cls: "text-primary" },
    { label: "WhatsApp clicks", value: Math.round(total * 0.18), icon: MessageCircle, cls: "text-whatsapp" },
    { label: "Calls", value: Math.round(total * 0.06), icon: Phone, cls: "text-primary" },
    { label: "Directions", value: Math.round(total * 0.09), icon: MapPin, cls: "text-primary" },
  ];

  return (
    <div className="page-shell fade-in">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-extrabold">Results</h1>
          <p className="text-sm text-muted-foreground">Last 7 days · sample data</p>
        </div>
        <select aria-label="Select business" value={id} onChange={(e) => setId(e.target.value)} className="min-w-0 rounded-xl border bg-card px-3 py-3 text-sm">
          {BUSINESSES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="premium-card p-5">
            <s.icon className={`h-5 w-5 ${s.cls}`} />
            <p className="mt-2 text-3xl font-extrabold">{s.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 border-y py-6">
        <h2 className="mb-4 font-bold">Daily views</h2>
        <div className="flex h-56 items-end gap-2 sm:gap-4">
          {views.map((v, i) => (
            <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <span className="text-xs font-semibold">{v}</span>
              <div className="w-full rounded-t-lg bg-gradient-to-t from-primary to-accent" style={{ height: `${(v / max) * 100}%` }} />
              <span className="text-xs text-muted-foreground">{week[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-accent/20 p-4 text-sm">
        <b>{Math.round(total * 0.18)}</b> people reached out on WhatsApp this week — that's about <b>{Math.round((total * 0.18) / 7)}</b> potential customers per day.
      </p>
    </div>
  );
}
