import type { ReactNode } from "react";

export const inputCls = "min-h-11 w-full rounded-xl border bg-card px-3 py-2 text-sm focus:ring-2 focus:ring-ring/20";
export const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-60";
export const btnGhost = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-semibold shadow-soft transition-all active:scale-[0.98] hover:bg-secondary";

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
