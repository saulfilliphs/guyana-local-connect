import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessesTab } from "@/components/admin/BusinessesTab";
import { PromotionsTab } from "@/components/admin/PromotionsTab";
import { RequestsTab } from "@/components/admin/RequestsTab";
import { MetricsTab } from "@/components/admin/MetricsTab";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — Guyana Ad Local" },
      { name: "description", content: "Manage businesses, promotions and plan requests." },
      { property: "og:title", content: "Admin panel — Guyana Ad Local" },
      { property: "og:description", content: "Manage businesses, promotions and plan requests." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async ({ context }) => {
    // UI gate only — data access is enforced by database security rules.
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", context.user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/login", search: { redirect: "/admin", denied: "1" } });
  },
  component: Admin,
});

const TABS = [
  { k: "businesses", label: "Businesses", C: BusinessesTab },
  { k: "promotions", label: "Promotions", C: PromotionsTab },
  { k: "requests", label: "Plan requests", C: RequestsTab },
  { k: "metrics", label: "Metrics", C: MetricsTab },
] as const;

function Admin() {
  const [tab, setTab] = useState<(typeof TABS)[number]["k"]>("businesses");
  const Active = TABS.find((t) => t.k === tab)!.C;
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 pb-16">
      <h1 className="font-display text-3xl font-extrabold">Admin panel</h1>
      <div className="flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-bold ${tab === t.k ? "border-accent text-primary" : "border-transparent text-muted-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <Active />
    </div>
  );
}
