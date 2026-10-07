import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BusinessesTab } from "@/components/admin/BusinessesTab";
import { PromotionsTab } from "@/components/admin/PromotionsTab";
import { RequestsTab } from "@/components/admin/RequestsTab";
import { MetricsTab } from "@/components/admin/MetricsTab";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — Guyana Ad Local" },
      { name: "description", content: "Manage businesses, promotions and plan requests." },
      { property: "og:title", content: "Admin panel — Guyana Ad Local" },
      { property: "og:description", content: "Manage businesses, promotions and plan requests." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
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
  const Active = (TABS.find((t) => t.k === tab) ?? TABS[0]).C;
  return (
    <div className="page-shell fade-in space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Admin panel</h1>
      <div className="scroll-row flex gap-2 border-b pb-3">
        {TABS.map((t) => (
          <Button variant={tab === t.k ? "gold" : "secondary"} key={t.k} onClick={() => setTab(t.k)} className="shrink-0">
            {t.label}
          </Button>
        ))}
      </div>
      <Active />
    </div>
  );
}
