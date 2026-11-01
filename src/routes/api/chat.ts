import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { openStatus, ZONES, DAYS, fmt, type Hours } from "@/lib/data";
import { buildAssistantInstructions, toAssistantBusiness, type AssistantBusiness } from "@/lib/assistant";

/** Loads only public data (active businesses + live promos) — RLS enforces the same rules. */
async function loadBusinesses(): Promise<AssistantBusiness[]> {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const db = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
      h.set("apikey", key);
      return fetch(input, { ...init, headers: h });
    } },
  });
  const { data, error } = await db.from("businesses").select("*, promotions_stories(*)").eq("status", "active");
  if (error) throw error;
  return (data ?? []).map((r) => toAssistantBusiness(r as never));
}

const describeHours = (h: Hours) => DAYS.map((d, i) => `${d}: ${h[i] ? `${fmt(h[i]![0])}–${fmt(h[i]![1])}` : "closed"}`).join(", ");

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "Assistant is not configured." }, { status: 500 });
        const { messages } = (await request.json()) as { messages: UIMessage[] };
        if (!Array.isArray(messages)) return Response.json({ error: "Invalid request" }, { status: 400 });

        let cache: AssistantBusiness[] | null = null;
        const all = async () => (cache ??= await loadBusinesses());
        const live = (b: AssistantBusiness) => ({ ...b, status: openStatus(b.hours).label, openNow: openStatus(b.hours).open, weeklyHours: describeHours(b.hours) });

        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });

        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          system: buildAssistantInstructions(new Date()),
          messages: await convertToModelMessages(messages),
          abortSignal: request.signal,
          stopWhen: stepCountIs(5),
          providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
          tools: {
            searchBusinesses: tool({
              description: `Search real businesses listed on the app. Known zones (all in Georgetown): ${ZONES.slice(1).join(", ")}. Returns live open status, offers and contact info.`,
              inputSchema: z.object({
                query: z.string().nullable().describe("Free text: category, service, name or offer keyword"),
                zone: z.string().nullable().describe("Zone/neighbourhood if user mentioned one"),
                openNowOnly: z.boolean().nullable(),
                withOffersOnly: z.boolean().nullable(),
              }),
              execute: async ({ query, zone, openNowOnly, withOffersOnly }) => {
                const words = (query ?? "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);
                let list = (await all()).map(live);
                if (words.length) list = list.filter((b) => {
                  const hay = [b.name, b.category, b.description, b.zone, ...b.services, b.promo?.title ?? ""].join(" ").toLowerCase();
                  return words.some((w) => hay.includes(w) || hay.includes(w.replace(/s$/, "")));
                });
                const zoneMatch = zone ? list.filter((b) => b.zone.toLowerCase().includes(zone.toLowerCase()) || b.address.toLowerCase().includes(zone.toLowerCase())) : list;
                if (openNowOnly) list = list.filter((b) => b.openNow);
                if (withOffersOnly) list = list.filter((b) => b.promo);
                const inZone = zone ? list.filter((b) => zoneMatch.includes(b)) : list;
                const ranked = (inZone.length ? inZone : list).sort((a, b) => Number(b.openNow) - Number(a.openNow) || Number(!!b.promo) - Number(!!a.promo) || Number(b.isFeatured) - Number(a.isFeatured));
                return { zoneMatched: zone ? inZone.length > 0 : null, businesses: ranked.slice(0, 5) };
              },
            }),
            getBusiness: tool({
              description: "Get full details (hours, services, offer, contact) of one business by name.",
              inputSchema: z.object({ name: z.string() }),
              execute: async ({ name }) => {
                const n = name.toLowerCase();
                const b = (await all()).find((x) => x.name.toLowerCase().includes(n) || n.includes(x.name.toLowerCase()));
                return b ? { found: true, business: live(b) } : { found: false, business: null };
              },
            }),
          },
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
