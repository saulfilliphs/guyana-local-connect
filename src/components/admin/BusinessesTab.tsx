import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { BUCKET, CATEGORIES, DAYS, STORAGE_PREFIX, ZONES, resolveImages, type Hours } from "@/lib/data";
import { Field, inputCls, btn, btnGhost } from "./ui";

type Row = Tables<"businesses">;
const emptyHours: Hours = [null, [8, 18], [8, 18], [8, 18], [8, 18], [8, 18], [9, 16]];
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export function useAdminBusinesses() {
  return useQuery({
    queryKey: ["admin-businesses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("businesses").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function BusinessesTab() {
  const { data = [], isLoading } = useAdminBusinesses();
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const qc = useQueryClient();

  async function remove(r: Row) {
    if (!confirm(`Delete ${r.name}? Its promotions and stats will also be removed.`)) return;
    await supabase.from("promotions_stories").delete().eq("business_id", r.id);
    await supabase.from("click_events").delete().eq("business_id", r.id);
    const { error } = await supabase.from("businesses").delete().eq("id", r.id);
    if (error) alert(error.message);
    qc.invalidateQueries();
  }

  if (editing) return <BusinessForm initial={editing} onDone={() => { setEditing(null); qc.invalidateQueries(); }} />;

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Businesses ({data.length})</h2>
        <button className={btn} onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New business</button>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      <ul className="divide-y rounded-2xl border bg-card">
        {data.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="flex-1">
              <p className="font-bold">{r.name} {r.is_featured && <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs">Featured</span>}</p>
              <p className="text-xs text-muted-foreground">{r.category} · {r.zone} · {r.whatsapp}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === "active" ? "bg-whatsapp/15 text-whatsapp" : "bg-muted text-muted-foreground"}`}>{r.status}</span>
            <button className={btnGhost} onClick={() => setEditing(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
            <button className={btnGhost} onClick={() => remove(r)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BusinessForm({ initial, onDone }: { initial: Partial<Row>; onDone: () => void }) {
  const [f, setF] = useState({
    name: initial.name ?? "", slug: initial.slug ?? "", category: initial.category ?? "Restaurants", zone: initial.zone ?? "Kitty",
    address: initial.address ?? "", phone: initial.phone ?? "", whatsapp: initial.whatsapp ?? "", description: initial.description ?? "",
    services: (initial.services ?? []).join(", "), status: initial.status ?? "active", is_featured: initial.is_featured ?? false,
  });
  const [hours, setHours] = useState<Hours>(Array.isArray(initial.hours) && initial.hours.length === 7 ? (initial.hours as Hours) : emptyHours);
  const [images, setImages] = useState<string[]>(initial.images ?? []);
  const previews = useQuery({ queryKey: ["previews", images], queryFn: () => resolveImages(images) });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { setErr("Images only, max 5MB each."); continue; }
      const path = `${slugify(f.name || "business")}/${crypto.randomUUID()}.${file.name.split(".").pop() ?? "jpg"}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) setErr(error.message); else setImages((p) => [...p, STORAGE_PREFIX + path]);
    }
    setBusy(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || !f.whatsapp.trim()) { setErr("Name and WhatsApp number are required."); return; }
    setBusy(true); setErr(null);
    const payload = {
      name: f.name.trim().slice(0, 120), slug: slugify(f.slug || f.name), category: f.category, zone: f.zone,
      address: f.address.trim() || null, phone: f.phone.trim() || null, whatsapp: f.whatsapp.replace(/\D/g, ""),
      description: f.description.trim().slice(0, 2000) || null,
      services: f.services.split(",").map((s) => s.trim()).filter(Boolean),
      hours, status: f.status as Row["status"], is_featured: f.is_featured, images, logo_url: images[0] ?? null,
    };
    const { error } = initial.id
      ? await supabase.from("businesses").update(payload).eq("id", initial.id)
      : await supabase.from("businesses").insert(payload);
    setBusy(false);
    if (error) setErr(error.message.includes("slug") ? "That web address is already used — change the name or address slug." : error.message);
    else onDone();
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{initial.id ? "Edit business" : "New business"}</h2>
        <button type="button" className={btnGhost} onClick={onDone}><X className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Name"><input className={inputCls} value={f.name} maxLength={120} onChange={(e) => set("name", e.target.value)} required /></Field>
        <Field label="Page address (optional)"><input className={inputCls} value={f.slug} placeholder={slugify(f.name)} onChange={(e) => set("slug", e.target.value)} /></Field>
        <Field label="Category"><select className={inputCls} value={f.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.slice(1).map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Zone"><select className={inputCls} value={f.zone} onChange={(e) => set("zone", e.target.value)}>{ZONES.slice(1).map((z) => <option key={z}>{z}</option>)}</select></Field>
        <Field label="WhatsApp number"><input className={inputCls} value={f.whatsapp} placeholder="592..." onChange={(e) => set("whatsapp", e.target.value)} required /></Field>
        <Field label="Phone"><input className={inputCls} value={f.phone} placeholder="+592..." onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Address" className="md:col-span-2"><input className={inputCls} value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label="Description" className="md:col-span-2"><textarea className={inputCls} rows={3} value={f.description} maxLength={2000} onChange={(e) => set("description", e.target.value)} /></Field>
        <Field label="Services (comma separated)" className="md:col-span-2"><input className={inputCls} value={f.services} onChange={(e) => set("services", e.target.value)} /></Field>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={f.status === "active"} onChange={(e) => set("status", e.target.checked ? "active" : "paused")} /> Active (visible in feed)
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={f.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Featured
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Weekly hours (Georgetown time)</p>
        <div className="grid gap-1">
          {hours.map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-10">{DAYS[i]}</span>
              <label className="flex items-center gap-1"><input type="checkbox" checked={!h} onChange={(e) => setHours((p) => p.map((x, j) => j === i ? (e.target.checked ? null : [8, 18]) : x))} /> Closed</label>
              {h && (<>
                <input type="number" min={0} max={23} className="w-16 rounded border bg-background px-2 py-1" value={h[0]} onChange={(e) => setHours((p) => p.map((x, j) => j === i ? [Number(e.target.value), h[1]] : x))} />
                <span>to</span>
                <input type="number" min={1} max={24} className="w-16 rounded border bg-background px-2 py-1" value={h[1]} onChange={(e) => setHours((p) => p.map((x, j) => j === i ? [h[0], Number(e.target.value)] : x))} />
              </>)}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Photos (first one is the main photo)</p>
        <div className="flex flex-wrap gap-2">
          {images.map((ref, i) => (
            <div key={ref + i} className="relative">
              <img src={previews.data?.get(ref) ?? ""} alt="" className="h-20 w-24 rounded-lg bg-muted object-cover" />
              <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground" aria-label="Remove"><X className="h-3 w-3" /></button>
            </div>
          ))}
          <label className="flex h-20 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-xs text-muted-foreground">
            <Upload className="h-4 w-4" /> Upload
            <input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
          </label>
        </div>
      </div>

      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2">
        <button disabled={busy} className={btn}>{busy ? "Saving…" : "Save business"}</button>
        <button type="button" className={btnGhost} onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}
