import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pause, Pencil, Play, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { BUCKET, STORAGE_PREFIX } from "@/lib/data";
import { useAdminBusinesses } from "./BusinessesTab";
import { Field, inputCls, btn, btnGhost } from "./ui";

type Row = Tables<"promotions_stories">;
const toLocal = (iso: string | null | undefined) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

export function PromotionsTab() {
  const qc = useQueryClient();
  const biz = useAdminBusinesses().data ?? [];
  const { data = [] } = useQuery({
    queryKey: ["admin-promos"],
    queryFn: async () => (await supabase.from("promotions_stories").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const name = (id: string) => biz.find((b) => b.id === id)?.name ?? "—";
  const refresh = () => qc.invalidateQueries();

  async function toggle(r: Row) { await supabase.from("promotions_stories").update({ is_active: !r.is_active }).eq("id", r.id); refresh(); }
  async function remove(r: Row) { if (confirm(`Delete "${r.title}"?`)) { await supabase.from("promotions_stories").delete().eq("id", r.id); refresh(); } }

  if (editing) return <PromoForm initial={editing} businesses={biz} onDone={() => { setEditing(null); refresh(); }} />;

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Promotions & stories ({data.length})</h2>
        <button className={btn} disabled={!biz.length} onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New promotion</button>
      </div>
      <ul className="divide-y rounded-2xl border bg-card">
        {data.length === 0 && <li className="p-4 text-sm text-muted-foreground">No promotions yet.</li>}
        {data.map((r) => {
          const expired = r.expires_at && new Date(r.expires_at) < new Date();
          return (
            <li key={r.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="flex-1">
                <p className="font-bold">{r.title}</p>
                <p className="text-xs text-muted-foreground">{name(r.business_id)} · {r.coupon ? `Coupon ${r.coupon} · ` : ""}{r.expires_at ? `Expires ${toLocal(r.expires_at)}` : "No expiry"}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${expired ? "bg-destructive/15 text-destructive" : r.is_active ? "bg-whatsapp/15 text-whatsapp" : "bg-muted text-muted-foreground"}`}>
                {expired ? "expired" : r.is_active ? "live" : "paused"}
              </span>
              <button className={btnGhost} onClick={() => toggle(r)} aria-label={r.is_active ? "Pause" : "Resume"}>{r.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
              <button className={btnGhost} onClick={() => setEditing(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
              <button className={btnGhost} onClick={() => remove(r)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PromoForm({ initial, businesses, onDone }: { initial: Partial<Row>; businesses: { id: string; name: string }[]; onDone: () => void }) {
  const [f, setF] = useState({
    business_id: initial.business_id ?? businesses[0]?.id ?? "", title: initial.title ?? "", description: initial.description ?? "",
    coupon: initial.coupon ?? "", image_url: initial.image_url ?? "", is_active: initial.is_active ?? true,
    starts_at: toLocal(initial.starts_at ?? new Date().toISOString()), expires_at: toLocal(initial.expires_at),
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  async function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { setErr("Images only, max 5MB."); return; }
    setBusy(true);
    const path = `promos/${crypto.randomUUID()}.${file.name.split(".").pop() ?? "jpg"}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    setBusy(false);
    if (error) setErr(error.message); else set("image_url", STORAGE_PREFIX + path);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim() || !f.business_id) { setErr("Business and title are required."); return; }
    if (f.expires_at && f.expires_at < f.starts_at) { setErr("Expiry date must be after the start date."); return; }
    setBusy(true); setErr(null);
    const payload = {
      business_id: f.business_id, title: f.title.trim().slice(0, 160), description: f.description.trim() || null,
      coupon: f.coupon.trim().toUpperCase() || null, image_url: f.image_url || null, is_active: f.is_active,
      starts_at: new Date(f.starts_at + "T00:00:00-04:00").toISOString(),
      expires_at: f.expires_at ? new Date(f.expires_at + "T23:59:59-04:00").toISOString() : null,
    };
    const { error } = initial.id
      ? await supabase.from("promotions_stories").update(payload).eq("id", initial.id)
      : await supabase.from("promotions_stories").insert(payload);
    setBusy(false);
    if (error) setErr(error.message); else onDone();
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{initial.id ? "Edit promotion" : "New promotion"}</h2>
        <button type="button" className={btnGhost} onClick={onDone}><X className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Business"><select className={inputCls} value={f.business_id} onChange={(e) => set("business_id", e.target.value)}>{businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
        <Field label="Coupon code (optional)"><input className={inputCls} value={f.coupon} maxLength={30} onChange={(e) => set("coupon", e.target.value)} /></Field>
        <Field label="Offer title" className="md:col-span-2"><input className={inputCls} value={f.title} maxLength={160} onChange={(e) => set("title", e.target.value)} required /></Field>
        <Field label="Details" className="md:col-span-2"><textarea className={inputCls} rows={2} value={f.description} maxLength={1000} onChange={(e) => set("description", e.target.value)} /></Field>
        <Field label="Starts"><input type="date" className={inputCls} value={f.starts_at} onChange={(e) => set("starts_at", e.target.value)} required /></Field>
        <Field label="Expires (optional)"><input type="date" className={inputCls} value={f.expires_at} onChange={(e) => set("expires_at", e.target.value)} /></Field>
        <Field label="Story image (optional — business photo used otherwise)" className="md:col-span-2">
          <input type="file" accept="image/*" className="text-sm" onChange={(e) => upload(e.target.files?.[0])} />
          {f.image_url && <span className="ml-2 text-xs text-whatsapp">Image attached <button type="button" className="underline" onClick={() => set("image_url", "")}>remove</button></span>}
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Live (uncheck to pause)</label>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2">
        <button disabled={busy} className={btn}>{busy ? "Saving…" : "Save promotion"}</button>
        <button type="button" className={btnGhost} onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}
