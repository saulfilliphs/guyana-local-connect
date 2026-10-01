import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const search = z.object({ redirect: z.string().optional(), denied: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Sign in — Guyana Ad Local" },
      { name: "description", content: "Sign in or create your Guyana Ad Local account." },
      { property: "og:title", content: "Sign in — Guyana Ad Local" },
      { property: "og:description", content: "Sign in or create your Guyana Ad Local account." },
    ],
  }),
  component: Login,
});

const emailSchema = z.string().trim().email().max(255);
const passSchema = z.string().min(8).max(72);

function Login() {
  const { redirect, denied } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(denied ? "Your account does not have admin access." : null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const em = emailSchema.safeParse(email), pw = passSchema.safeParse(password);
    if (!em.success) return setMsg("Enter a valid email.");
    if (!pw.success) return setMsg("Password must be at least 8 characters.");
    setBusy(true); setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: em.data, password: pw.data });
      setBusy(false);
      if (error) return setMsg(error.message);
      const to = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
      navigate({ to, replace: true });
    } else {
      const { error } = await supabase.auth.signUp({ email: em.data, password: pw.data, options: { emailRedirectTo: window.location.origin } });
      setBusy(false);
      setMsg(error ? error.message : "Check your email to confirm your account.");
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 font-display text-3xl font-extrabold">{mode === "in" ? "Sign in" : "Create account"}</h1>
      <form onSubmit={submit} className="space-y-3">
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border bg-card px-4 py-3" />
        <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border bg-card px-4 py-3" />
        <button disabled={busy} className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-60">
          {busy ? "…" : mode === "in" ? "Sign in" : "Sign up"}
        </button>
      </form>
      {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
      <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }} className="mt-4 text-sm font-semibold text-primary underline">
        {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
      </button>
    </div>
  );
}
