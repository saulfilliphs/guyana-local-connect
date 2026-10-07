import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Plans in GYD — Advertise on Guyana Ad Local" },
      { name: "description", content: "Affordable monthly advertising plans in Guyanese dollars for Georgetown businesses. Request your plan today." },
      { property: "og:title", content: "Advertising plans in GYD — Guyana Ad Local" },
      { property: "og:description", content: "Get your Georgetown business in front of local customers from GYD 5,000/month." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pricing,
});

const plans = [
  { name: "Starter", tier: "business" as const, price: 5000, features: ["Business listing", "WhatsApp, call & map buttons", "1 offer post / week"] },
  { name: "Growth", tier: "featured" as const, price: 12000, popular: true, features: ["Everything in Starter", "Daily story deal", "5 offer posts / week", "Results dashboard"] },
  { name: "Premium", tier: "campaign" as const, price: 25000, features: ["Everything in Growth", "Top of feed in your zone", "Unlimited posts", "Photo shoot included"] },
];

function Pricing() {
  const [plan, setPlan] = useState<(typeof plans)[number] | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!plan) return;
    const f = new FormData(e.currentTarget);
    const parsed = z.object({
      business_name: z.string().trim().min(1).max(120),
      contact_name: z.string().trim().min(1).max(120),
      phone: z.string().trim().min(5).max(30),
      email: z.string().trim().email().max(255).optional().or(z.literal("")),
      type: z.string().max(50),
      message: z.string().trim().max(1000),
    }).safeParse(Object.fromEntries(f));
    if (!parsed.success) { setErr("Please check the fields and try again."); return; }
    const d = parsed.data;
    setBusy(true); setErr(null);
    const { error } = await supabase.from("plan_requests").insert({
      plan: plan.tier, business_name: d.business_name, contact_name: d.contact_name, phone: d.phone,
      email: d.email || null, message: [`Type: ${d.type}`, d.message].filter(Boolean).join("\n"),
    });
    setBusy(false);
    if (error) setErr("Could not send your request. Please try again."); else setSent(true);
  }

  return (
    <div className="page-shell fade-in py-10">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold">Grow your business in Georgetown</h1>
        <p className="mt-2 text-muted-foreground">Simple monthly plans in Guyanese dollars. No contracts.</p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`premium-card relative flex min-w-0 flex-col border-2 p-6 ${p.popular ? "border-accent" : "border-border"}`}>
            {p.popular && <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-accent-foreground">Most popular</span>}
            <h2 className="text-xl font-bold">{p.name}</h2>
            <p className="mt-4"><span className="block text-3xl font-extrabold">GYD {p.price.toLocaleString()}</span><span className="text-xs text-muted-foreground"> /month</span></p>
            <ul className="my-5 flex-1 space-y-2">{p.features.map((f) => <li key={f} className="flex gap-2 text-sm"><Check className="h-4 w-4 shrink-0 text-whatsapp" />{f}</li>)}</ul>
            <Button variant={p.popular ? "gold" : "outline"} size="lg" onClick={() => { setPlan(p); setSent(false); setErr(null); }}>
              Request {p.name}
            </Button>
          </div>
        ))}
      </div>

      {plan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4" onClick={() => setPlan(null)}>
          <div role="dialog" aria-modal="true" aria-label={`Reserve ${plan.name}`} className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-[24px] bg-card p-6 shadow-elevated" onClick={(e) => e.stopPropagation()}>
            {sent ? (
              <div className="text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-whatsapp" />
                <h3 className="mt-3 text-xl font-bold">Request received!</h3>
                <p className="mt-1 text-sm text-muted-foreground">Our team will contact you on WhatsApp within 24 hours to activate your {plan.name} plan.</p>
                <Button onClick={() => setPlan(null)} className="mt-5 w-full">Done</Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <h3 className="text-xl font-bold">Reserve the {plan.name} plan</h3>
                <input name="business_name" required maxLength={120} placeholder="Business name" className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm" />
                <input name="contact_name" required maxLength={120} placeholder="Your name" className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm" />
                <input name="phone" required maxLength={30} placeholder="WhatsApp number" className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm" />
                <input name="email" type="email" maxLength={255} placeholder="Email (optional)" className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm" />
                <select name="type" className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm">
                  <option>Restaurant</option><option>Phone repair</option><option>Beauty salon</option><option>Market / grocery</option><option>Other</option>
                </select>
                <textarea name="message" maxLength={1000} rows={2} placeholder="Anything we should know? (optional)" className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm" />
                {err && <p className="text-sm text-destructive">{err}</p>}
                <Button disabled={busy} variant="gold" className="w-full">{busy ? "Sending…" : "Send request"}</Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setPlan(null)}>Cancel</Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
