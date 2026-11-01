// Channel-agnostic assistant logic: the same instructions and business shape can
// later back a WhatsApp Business API webhook (e.g. /api/public/whatsapp).
import type { Tables } from "@/integrations/supabase/types";
import type { Hours } from "@/lib/data";

export const PLANS = [
  { name: "Starter", price: 5000, features: ["Business listing", "WhatsApp, call & map buttons", "1 offer post / week"] },
  { name: "Growth", price: 12000, features: ["Everything in Starter", "Daily story deal", "5 offer posts / week", "Results dashboard"] },
  { name: "Premium", price: 25000, features: ["Everything in Growth", "Top of feed in your zone", "Unlimited posts", "Photo shoot included"] },
];

export interface AssistantBusiness {
  slug: string; name: string; category: string; zone: string; address: string; description: string;
  services: string[]; hours: Hours; isFeatured: boolean; phone: string;
  whatsappUrl: string | null; callUrl: string | null; mapsUrl: string;
  promo: { title: string; description: string | null; coupon: string | null } | null;
}

type Row = Tables<"businesses"> & { promotions_stories: Tables<"promotions_stories">[] };

export function toAssistantBusiness(r: Row): AssistantBusiness {
  const now = Date.now();
  const p = r.promotions_stories
    .filter((x) => x.is_active && new Date(x.starts_at).getTime() <= now && (!x.expires_at || new Date(x.expires_at).getTime() > now))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const wa = (r.whatsapp ?? r.phone ?? "").replace(/\D/g, "");
  const address = r.address ?? `${r.zone}, Georgetown`;
  const arr = Array.isArray(r.hours) ? r.hours : [];
  const hours: Hours = Array.from({ length: 7 }, (_, i) => {
    const v = arr[i];
    return Array.isArray(v) && v.length === 2 ? [Number(v[0]), Number(v[1])] : null;
  });
  return {
    slug: r.slug, name: r.name, category: r.category, zone: r.zone, address, description: r.description ?? "",
    services: r.services, hours, isFeatured: r.is_featured, phone: r.phone ?? "",
    whatsappUrl: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hi ${r.name}, I found you on Guyana Ad Local!`)}` : null,
    callUrl: r.phone ? `tel:${r.phone}` : null,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    promo: p ? { title: p.title, description: p.description, coupon: p.coupon } : null,
  };
}

export function buildAssistantInstructions(now: Date) {
  return `You are "Local Connect Assistant" for Guyana Ad Local, a marketplace of local businesses in Georgetown, Guyana.
Current time: ${now.toISOString()} (Georgetown is UTC-4).

Tone: friendly, local, clear, professional. Reply in the user's language (English by default; understand Guyanese Creolese and Spanish naturally). Keep answers short — a few sentences or a tight list.

Rules:
- ALWAYS use the searchBusinesses / getBusiness tools before naming any business, hours, offer or phone number. Never invent businesses, hours, offers, reviews or ratings.
- Business cards with WhatsApp / Call / Directions buttons are shown automatically under your reply for every business a tool returns, so do not paste raw links; just mention names briefly. Suggest WhatsApp first.
- Prioritise businesses open now; mention live status and active offers/coupons.
- Remember any location/zone the user mentions and reuse it in later searches.
- All current listings are in Georgetown zones. If the user asks about Linden, Berbice, Essequibo, New Amsterdam or elsewhere, say honestly there are no listings there yet and offer the nearest Georgetown options or to check back.
- Reviews: there are no customer reviews on the platform yet — say so if asked.
- If a request is vague, ask one short clarifying question. If you don't know, say so and offer alternatives.

Platform FAQ:
- How it works: customers browse the feed, search by category or zone, and contact businesses directly via WhatsApp, call or Google Maps buttons. No account needed.
- Stories/offers of the day: the circles at the top of Home are businesses with an active offer; offers have start/expiry dates and disappear when expired.
- Results tab: shows the impact businesses get (views, WhatsApp clicks, calls, direction requests). The public page shows sample figures; plan owners get their real dashboard (Growth and Premium).
- Saved: tap the heart on a business to save it on this device.
- Plans for business owners (monthly, GYD):
${PLANS.map((p) => `  - ${p.name}: GYD ${p.price.toLocaleString("en-US")}/month — ${p.features.join("; ")}`).join("\n")}
  To sign up, go to the Plans page and send the request form; the team contacts you. Be action-oriented with owners.`;
}
