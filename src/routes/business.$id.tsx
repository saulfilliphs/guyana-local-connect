import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Star, Ticket } from "lucide-react";
import { businessQuery, georgetownNow, logClick, DAYS, fmt } from "@/lib/data";
import { CTAs, OpenBadge, SaveButton } from "@/components/site";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/business/$id")({
  loader: async ({ params, context }) => {
    const b = await context.queryClient.ensureQueryData(businessQuery(params.id));
    if (!b) throw notFound();
    return { b };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Business not found" }, { name: "robots", content: "noindex" }] };
    const { b } = loaderData;
    const t = `${b.name} — ${b.category} in ${b.zone}, Georgetown`;
    const d = b.promo?.title ?? b.description;
    const image = b.images[0];
    const imageMeta = image?.startsWith("https://") ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : [];
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, ...imageMeta] };
  },
  errorComponent: ({ error }) => <p className="p-10 text-center text-destructive">Could not load this business: {(error as Error).message}</p>,
  notFoundComponent: () => <p className="p-10 text-center">Business not found. <Link to="/" className="underline">Back to feed</Link></p>,
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(businessQuery(id));
  const b = data;
  const [img, setImg] = useState(0);
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => setToday(georgetownNow().day), []);
  useEffect(() => { if (b) logClick(b, "view"); }, [b?.dbId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!b) return <p className="p-10 text-center">Business not found.</p>;

  return (
    <div className="fade-in mx-auto max-w-4xl px-5 py-8 pb-16">
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Feed</Link>
      <div className="relative"><img src={b.images[img]} alt={b.name} className="aspect-[16/10] w-full rounded-[26px] object-cover shadow-elevated" /><div className="absolute right-4 top-4"><SaveButton b={b} /></div></div>
      {b.images.length > 1 && (
        <div className="mt-2 flex gap-2">
          {b.images.map((src, i) => (
            <Button variant="ghost" aria-label={`View photo ${i + 1}`} key={i} onClick={() => setImg(i)} className={`h-auto overflow-hidden rounded-lg border-2 p-0 ${i === img ? "border-accent" : "border-transparent"}`}>
              <img src={src} alt="" className="h-16 w-20 object-cover" />
            </Button>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-2">
        <h1 className="font-display text-3xl font-extrabold">{b.name}</h1>
        <p className="text-sm text-muted-foreground">{b.category} · {b.address}</p>
        <div className="flex items-center gap-4"><OpenBadge b={b} />
          {b.isFeatured && <span className="flex items-center gap-1 text-sm font-semibold"><Star className="h-4 w-4 fill-accent text-accent" />Featured</span>}
        </div>
      </div>

      {b.promo && (
        <div className="my-5 rounded-2xl bg-accent/20 p-4">
          <p className="font-bold">{b.promo.title}</p>
          {b.promo.description && <p className="mt-1 text-sm">{b.promo.description}</p>}
          {b.promo.coupon && <p className="mt-2 inline-flex items-center gap-1 text-sm"><Ticket className="h-4 w-4" /> Use coupon <b>{b.promo.coupon}</b></p>}
        </div>
      )}
      <div className={b.promo ? "" : "my-5"}><CTAs b={b} /></div>

      {b.description && <p className="mt-6 text-muted-foreground">{b.description}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="border-t py-5">
          <h2 className="mb-3 font-bold">Services</h2>
          {b.services.length ? (
            <ul className="space-y-2">{b.services.map((s) => <li key={s} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-whatsapp" />{s}</li>)}</ul>
          ) : <p className="text-sm text-muted-foreground">Ask on WhatsApp for details.</p>}
        </section>
        <section className="border-t py-5">
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
    </div>
  );
}
