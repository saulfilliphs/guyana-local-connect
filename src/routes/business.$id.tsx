import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Star } from "lucide-react";
import { getBusiness, georgetownNow, DAYS, fmt } from "@/lib/data";
import { CTAs, OpenBadge } from "@/components/site";

export const Route = createFileRoute("/business/$id")({
  loader: ({ params }) => {
    const b = getBusiness(params.id);
    if (!b) throw notFound();
    return { b };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Business not found" }, { name: "robots", content: "noindex" }] };
    const { b } = loaderData;
    const t = `${b.name} — ${b.category} in ${b.zone}, Georgetown`;
    return { meta: [{ title: t }, { name: "description", content: b.offer }, { property: "og:title", content: t }, { property: "og:description", content: b.offer }] };
  },
  notFoundComponent: () => <p className="p-10 text-center">Business not found. <Link to="/" className="underline">Back to feed</Link></p>,
  component: Detail,
});

function Detail() {
  const { b } = Route.useLoaderData();
  const [img, setImg] = useState(0);
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => setToday(georgetownNow().day), []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 pb-16">
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Feed</Link>
      <img src={b.images[img]} alt={b.name} className="aspect-[16/10] w-full rounded-2xl object-cover" />
      <div className="mt-2 flex gap-2">
        {b.images.map((src, i) => (
          <button key={i} onClick={() => setImg(i)} className={`overflow-hidden rounded-lg border-2 ${i === img ? "border-accent" : "border-transparent"}`}>
            <img src={src} alt="" className="h-16 w-20 object-cover" />
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        <h1 className="font-display text-3xl font-extrabold">{b.name}</h1>
        <p className="text-sm text-muted-foreground">{b.category} · {b.address}</p>
        <div className="flex items-center gap-4"><OpenBadge b={b} />
          <span className="flex items-center gap-1 text-sm font-semibold"><Star className="h-4 w-4 fill-accent text-accent" />{b.rating} ({b.reviews.length})</span>
        </div>
      </div>

      <div className="my-5 rounded-2xl bg-accent/20 p-4">
        <p className="font-bold">{b.offer}</p>
        {b.coupon && <p className="mt-1 text-sm">Use coupon <b>{b.coupon}</b></p>}
      </div>
      <CTAs b={b} />

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border bg-card p-4">
          <h2 className="mb-3 font-bold">Services</h2>
          <ul className="space-y-2">{b.services.map((s) => <li key={s} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-whatsapp" />{s}</li>)}</ul>
        </section>
        <section className="rounded-2xl border bg-card p-4">
          <h2 className="mb-3 font-bold">Weekly hours</h2>
          <ul className="space-y-1 text-sm">
            {b.hours.map((h, i) => (
              <li key={i} className={`flex justify-between rounded px-2 py-1 ${today === i ? "bg-primary text-primary-foreground font-semibold" : ""}`}>
                <span>{DAYS[i]}</span><span>{h ? `${fmt(h[0])} – ${fmt(h[1])}` : "Closed"}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 font-bold">Reviews</h2>
        <div className="space-y-3">
          {b.reviews.map((r, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4">
              <div className="flex justify-between"><b className="text-sm">{r.name}</b>
                <span className="flex">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className={`h-4 w-4 ${j < r.stars ? "fill-accent text-accent" : "text-muted"}`} />)}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
