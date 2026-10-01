import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const CATEGORIES = ["All", "Restaurants", "Phone Repair", "Beauty Salons", "Markets & Groceries", "Other"] as const;
export const ZONES = ["All zones", "Stabroek", "Kitty", "Bourda", "Alberttown", "Campbellville", "Sheriff St", "Lamaha Gardens", "Queenstown", "Lacytown"] as const;
export const BUCKET = "business-photos";
/** Stored image values starting with this prefix live in the photo storage bucket. */
export const STORAGE_PREFIX = "storage:";

// [open, close] in 24h hours per weekday Sun..Sat; null = closed
export type Hours = ([number, number] | null)[];

export interface Promo { id: string; title: string; description: string | null; coupon: string | null; image: string | null }

export interface Business {
  id: string; // slug, used in URLs
  dbId: string;
  name: string;
  category: string;
  zone: string;
  address: string;
  phone: string;
  whatsapp: string;
  images: string[];
  description: string;
  services: string[];
  hours: Hours;
  isFeatured: boolean;
  promo: Promo | null;
  createdAt: string;
}

/** Turns stored image refs into displayable URLs (signed URLs for the private bucket). */
export async function resolveImages(refs: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const paths = [...new Set(refs.filter((r) => r?.startsWith(STORAGE_PREFIX)).map((r) => r.slice(STORAGE_PREFIX.length)))];
  refs.forEach((r) => r && !r.startsWith(STORAGE_PREFIX) && map.set(r, r));
  if (paths.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 24 * 7);
    data?.forEach((d) => d.path && d.signedUrl && map.set(STORAGE_PREFIX + d.path, d.signedUrl));
  }
  return map;
}

type PromoRow = Tables<"promotions_stories">;
type BizRow = Tables<"businesses"> & { promotions_stories: PromoRow[] };

function normalizeHours(h: unknown): Hours {
  const arr = Array.isArray(h) ? h : [];
  return Array.from({ length: 7 }, (_, i) => {
    const v = arr[i];
    return Array.isArray(v) && v.length === 2 ? [Number(v[0]), Number(v[1])] : null;
  });
}

async function fetchBusinesses(slug?: string): Promise<Business[]> {
  let q = supabase.from("businesses").select("*, promotions_stories(*)").eq("status", "active");
  if (slug) q = q.eq("slug", slug);
  const { data, error } = await q.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as BizRow[];
  const now = Date.now();
  const activePromo = (r: BizRow) =>
    r.promotions_stories
      .filter((p) => p.is_active && new Date(p.starts_at).getTime() <= now && (!p.expires_at || new Date(p.expires_at).getTime() > now))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const refs = rows.flatMap((r) => [...r.images, r.logo_url ?? "", activePromo(r)?.image_url ?? ""]);
  const urls = await resolveImages(refs);
  const u = (r: string | null | undefined) => (r ? urls.get(r) ?? null : null);
  return rows.map((r) => {
    const p = activePromo(r);
    const images = r.images.map((i) => u(i)).filter(Boolean) as string[];
    if (!images.length && u(r.logo_url)) images.push(u(r.logo_url)!);
    return {
      id: r.slug, dbId: r.id, name: r.name, category: r.category, zone: r.zone,
      address: r.address ?? `${r.zone}, Georgetown`, phone: r.phone ?? "", whatsapp: (r.whatsapp ?? r.phone ?? "").replace(/\D/g, ""),
      images: images.length ? images : ["/seed/market.jpg"], description: r.description ?? "", services: r.services,
      hours: normalizeHours(r.hours), isFeatured: r.is_featured, createdAt: r.created_at,
      promo: p ? { id: p.id, title: p.title, description: p.description, coupon: p.coupon, image: u(p.image_url) } : null,
    };
  });
}

export const businessesQuery = () => queryOptions({ queryKey: ["businesses"], queryFn: () => fetchBusinesses() });
export const businessQuery = (slug: string) =>
  queryOptions({ queryKey: ["business", slug], queryFn: async () => (await fetchBusinesses(slug))[0] ?? null });

export type ClickType = "whatsapp" | "call" | "map" | "view";
export function logClick(b: Business, type: ClickType) {
  void supabase.from("click_events").insert({ business_id: b.dbId, event_type: type }).then(() => {});
}

export function timeAgo(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
}

/** Georgetown is UTC-4 year-round (no DST). */
export function georgetownNow(d = new Date()) {
  const gy = new Date(d.getTime() - 4 * 3600 * 1000);
  return { day: gy.getUTCDay(), hour: gy.getUTCHours() + gy.getUTCMinutes() / 60 };
}

export function openStatus(hours: Hours, d = new Date()) {
  const { day, hour } = georgetownNow(d);
  const t = hours[day];
  if (t && hour >= t[0] && hour < t[1]) return { open: true, label: `Open · closes ${fmt(t[1])}` };
  return { open: false, label: t && hour < t[0] ? `Closed · opens ${fmt(t[0])}` : "Closed now" };
}

export const fmt = (h: number) => `${((h + 11) % 12) + 1}${h % 24 < 12 ? "am" : "pm"}`;
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const waLink = (b: Business) =>
  `https://wa.me/${b.whatsapp}?text=${encodeURIComponent(`Hi ${b.name}, I saw your offer on Guyana Ad Local!`)}`;
export const mapsLink = (b: Business) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`;
