import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STATUSES = ["pending", "contacted", "completed"] as const;
const PLAN_LABEL: Record<string, string> = { free: "Free", business: "Starter", featured: "Growth", campaign: "Premium" };

export function RequestsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const { data = [] } = useQuery({
    queryKey: ["admin-requests"],
    queryFn: async () => (await supabase.from("plan_requests").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const list = filter === "all" ? data : data.filter((r) => r.status === filter);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("plan_requests").update({ status }).eq("id", id);
    if (error) alert(error.message);
    qc.invalidateQueries({ queryKey: ["admin-requests"] });
    qc.invalidateQueries({ queryKey: ["admin-counts"] });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Plan requests ({data.length})</h2>
        <div className="flex gap-1">
          {["all", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${filter === s ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              {s} {s !== "all" && `(${data.filter((r) => r.status === s).length})`}
            </button>
          ))}
        </div>
      </div>
      <ul className="space-y-2">
        {list.length === 0 && <li className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">No requests here.</li>}
        {list.map((r) => (
          <li key={r.id} className="rounded-2xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold">{r.business_name} <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs">{PLAN_LABEL[r.plan] ?? r.plan}</span></p>
                <p className="text-sm text-muted-foreground">
                  {r.contact_name} · <a className="text-whatsapp underline" href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{r.phone}</a>
                  {r.email && <> · <a className="underline" href={`mailto:${r.email}`}>{r.email}</a></>}
                </p>
                {r.message && <p className="mt-1 whitespace-pre-line text-sm">{r.message}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="rounded-xl border bg-background px-2 py-1.5 text-sm font-semibold capitalize">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
