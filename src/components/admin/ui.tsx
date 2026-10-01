import type { ReactNode } from "react";

export const inputCls = "w-full rounded-xl border bg-background px-3 py-2 text-sm";
export const btn = "inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60";
export const btnGhost = "inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-secondary";

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
