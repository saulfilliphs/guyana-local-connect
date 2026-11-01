import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Phone, MapPin, Send, X, Store, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssistantBusiness } from "@/lib/assistant";

const KEY = "gal-assistant-chat";
type LiveBiz = AssistantBusiness & { status: string; openNow: boolean };

function BizCard({ b }: { b: LiveBiz }) {
  return <div className="rounded-2xl border bg-card p-3 shadow-soft">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0"><Link to="/business/$id" params={{ id: b.slug }} className="block truncate font-bold">{b.name}</Link><p className="truncate text-xs text-muted-foreground">{b.category} · {b.zone}</p></div>
      <span className={`shrink-0 text-[11px] font-semibold ${b.openNow ? "text-emerald" : "text-muted-foreground"}`}>{b.openNow ? "Open now" : "Closed"}</span>
    </div>
    {b.promo && <p className="mt-2 rounded-lg bg-accent/20 px-2 py-1 text-xs font-semibold">🎁 {b.promo.title}{b.promo.coupon ? ` · ${b.promo.coupon}` : ""}</p>}
    <div className="mt-2 grid grid-cols-3 gap-1.5">
      {b.whatsappUrl && <Button asChild size="sm" className="bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"><a href={b.whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle />WhatsApp</a></Button>}
      {b.callUrl && <Button asChild size="sm" variant="outline"><a href={b.callUrl}><Phone />Call</a></Button>}
      <Button asChild size="sm" variant="outline"><a href={b.mapsUrl} target="_blank" rel="noreferrer"><MapPin />Directions</a></Button>
    </div>
  </div>;
}

function Parts({ m }: { m: UIMessage }) {
  return <>{m.parts.map((p, i) => {
    if (p.type === "text") return m.role === "user"
      ? <p key={i} className="whitespace-pre-wrap">{p.text}</p>
      : <div key={i} className="prose prose-sm max-w-none text-foreground [&_p]:my-1 [&_ul]:my-1"><ReactMarkdown>{p.text}</ReactMarkdown></div>;
    if ((p.type === "tool-searchBusinesses" || p.type === "tool-getBusiness") && "state" in p && p.state === "output-available") {
      const out = p.output as { businesses?: LiveBiz[]; business?: LiveBiz | null };
      const list = out.businesses ?? (out.business ? [out.business] : []);
      return list.length ? <div key={i} className="my-2 grid gap-2">{list.map((b) => <BizCard key={b.slug} b={b} />)}</div> : null;
    }
    return null;
  })}</>;
}

export function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, setMessages, status, stop, error } = useChat({ transport: new DefaultChatTransport({ api: "/api/chat" }) });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => { try { const s = sessionStorage.getItem(KEY); if (s) setMessages(JSON.parse(s)); } catch { /* ignore */ } }, [setMessages]);
  useEffect(() => { if (status === "ready") try { sessionStorage.setItem(KEY, JSON.stringify(messages)); } catch { /* ignore */ } }, [messages, status]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages, status]);
  useEffect(() => { if (open && !busy) inputRef.current?.focus(); }, [open, busy]);

  const send = (text: string) => { const t = text.trim(); if (!t || busy) return; setInput(""); void sendMessage({ text: t }); };
  const suggestions = ["What's open now near Stabroek?", "Today's restaurant offers", "How does the Premium plan work?"];

  return <>
    {!open && <button type="button" aria-label="Open Local Connect Assistant" onClick={() => setOpen(true)} className="assistant-fab fixed bottom-24 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated ring-2 ring-whatsapp transition active:scale-95 sm:bottom-28 sm:right-6"><MessageCircle className="h-6 w-6" /><span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-primary bg-whatsapp" /></button>}
    {open && <section role="dialog" aria-label="Local Connect Assistant" className="fixed inset-x-2 bottom-2 top-16 z-50 flex flex-col overflow-hidden rounded-[24px] border bg-background shadow-elevated sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[620px] sm:max-h-[85dvh] sm:w-[400px]">
      <header className="brand-header flex items-center gap-3 px-4 py-3 text-primary-foreground">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"><Store className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1"><p className="truncate font-extrabold">Local Connect Assistant</p><p className="text-[11px] text-primary-foreground/80">Find & contact local businesses</p></div>
        {messages.length > 0 && <button type="button" onClick={() => { setMessages([]); sessionStorage.removeItem(KEY); }} className="text-[11px] font-semibold text-primary-foreground/80 hover:text-accent">New chat</button>}
        <Button variant="ghost" size="icon" aria-label="Close" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setOpen(false)}><X /></Button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {!messages.length && <div className="space-y-3"><p className="rounded-2xl bg-card p-3 shadow-soft">Hi! 👋 I can help you find businesses open now, today's offers, and how to reach them. What are you looking for?</p><div className="flex flex-wrap gap-2">{suggestions.map((s) => <button type="button" key={s} onClick={() => send(s)} className="rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary">{s}</button>)}</div></div>}
        {messages.map((m) => <div key={m.id} className={m.role === "user" ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-primary-foreground" : "max-w-full"}><Parts m={m} /></div>)}
        {status === "submitted" && <p className="flex gap-1 text-muted-foreground" aria-label="Assistant is typing"><span className="animate-bounce">•</span><span className="animate-bounce [animation-delay:150ms]">•</span><span className="animate-bounce [animation-delay:300ms]">•</span></p>}
        {error && <p className="rounded-xl bg-destructive/10 p-2 text-xs text-destructive">Sorry, the assistant couldn't answer right now. Please try again.</p>}
        <div ref={endRef} />
      </div>
      <form className="flex items-end gap-2 border-t bg-card p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <textarea ref={inputRef} rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} placeholder="Ask about businesses, offers, plans…" aria-label="Message" className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
        {busy ? <Button type="button" size="icon" variant="outline" aria-label="Stop" className="h-11 w-11 shrink-0 rounded-full" onClick={() => stop()}><Square /></Button>
          : <Button type="submit" size="icon" aria-label="Send" disabled={!input.trim()} className="h-11 w-11 shrink-0 rounded-full bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90"><Send /></Button>}
      </form>
    </section>}
  </>;
}
