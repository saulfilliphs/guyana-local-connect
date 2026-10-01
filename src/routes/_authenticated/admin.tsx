import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

function Admin() {
  const counts = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const [b, p, r, c] = await Promise.all([
        supabase.from("businesses").select("id", { count: "exact", head: true }),
        supabase.from("promotions_stories").select("id", { count: "exact", head: true }),
        supabase.from("plan_requests").select("id", { count: "exact", head: true }),
        supabase.from("click_events").select("id", { count: "exact", head: true }),
      ]);
      return { businesses: b.count ?? 0, promotions: p.count ?? 0, requests: r.count ?? 0, clicks: c.count ?? 0 };
    },
  });
  const requests = useQuery({
    queryKey: ["admin-requests"],
    queryFn: async () => (await supabase.from("plan_requests").select("*").order("created_at", { ascending: false }).limit(20)).data ?? [],
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <h1 className="font-display text-3xl font-extrabold">Admin panel</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.entries(counts.data ?? {}).map(([k, v]) => (
          <div key={k} className="rounded-2xl border bg-card p-4">
            <p className="text-sm capitalize text-muted-foreground">{k}</p>
            <p className="text-2xl font-extrabold">{v}</p>
          </div>
        ))}
      </div>
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="mb-3 font-bold">Latest plan requests</h2>
        {requests.data?.length ? (
          <ul className="divide-y text-sm">
            {requests.data.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span><b>{r.business_name}</b> · {r.contact_name} · {r.phone}</span>
                <span className="font-semibold uppercase text-primary">{r.plan}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">No requests yet.</p>}
      </section>
    </div>
  );
}
