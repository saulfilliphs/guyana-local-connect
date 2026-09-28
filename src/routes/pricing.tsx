import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Plans in GYD — Advertise on Guyana Ad Local" },
      { name: "description", content: "Affordable monthly advertising plans in Guyanese dollars for Georgetown businesses. Request your plan today." },
      { property: "og:title", content: "Advertising plans in GYD — Guyana Ad Local" },
      { property: "og:description", content: "Get your Georgetown business in front of local customers from GYD 5,000/month." },
    ],
  }),
  component: Pricing,
});

const plans = [
  { name: "Starter", price: 5000, features: ["Business listing", "WhatsApp, call & map buttons", "1 offer post / week"] },
  { name: "Growth", price: 12000, popular: true, features: ["Everything in Starter", "Daily story deal", "5 offer posts / week", "Results dashboard"] },
  { name: "Premium", price: 25000, features: ["Everything in Growth", "Top of feed in your zone", "Unlimited posts", "Photo shoot included"] },
];

function Pricing() {
  const [plan, setPlan] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-16">
      <div className="text-center">
        <h1 className="font-display text-4xl font-extrabold">Grow your business in Georgetown</h1>
        <p className="mt-2 text-muted-foreground">Simple monthly plans in Guyanese dollars. No contracts.</p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`relative flex flex-col rounded-2xl border-2 bg-card p-6 ${p.popular ? "border-accent shadow-lg" : "border-border"}`}>
            {p.popular && <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-accent-foreground">Most popular</span>}
            <h2 className="text-xl font-bold">{p.name}</h2>
            <p className="mt-2"><span className="text-4xl font-extrabold">GYD {p.price.toLocaleString()}</span><span className="text-muted-foreground"> /month</span></p>
            <ul className="my-5 flex-1 space-y-2">{p.features.map((f) => <li key={f} className="flex gap-2 text-sm"><Check className="h-4 w-4 shrink-0 text-whatsapp" />{f}</li>)}</ul>
            <button onClick={() => { setPlan(p.name); setSent(false); }}
              className={`rounded-xl py-3 font-bold ${p.popular ? "bg-primary text-primary-foreground" : "border-2 border-primary text-primary"} hover:opacity-90`}>
              Request {p.name}
            </button>
          </div>
        ))}
      </div>

      {plan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4" onClick={() => setPlan(null)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
            {sent ? (
              <div className="text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-whatsapp" />
                <h3 className="mt-3 text-xl font-bold">Request received!</h3>
                <p className="mt-1 text-sm text-muted-foreground">Our team will contact you on WhatsApp within 24 hours to activate your {plan} plan.</p>
                <button onClick={() => setPlan(null)} className="mt-5 w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground">Done</button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-3">
                <h3 className="text-xl font-bold">Reserve the {plan} plan</h3>
                {["Business name", "Your name", "WhatsApp number"].map((l) => (
                  <input key={l} required placeholder={l} className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm" />
                ))}
                <select className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm">
                  <option>Restaurant</option><option>Phone repair</option><option>Beauty salon</option><option>Market / grocery</option><option>Other</option>
                </select>
                <button className="w-full rounded-xl bg-whatsapp py-3 font-bold text-whatsapp-foreground">Send request</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
