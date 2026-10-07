import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Panel = "map" | "saved" | "notifications" | null;
type MarketplaceState = {
  search: string; setSearch: (value: string) => void;
  zone: string; setZone: (value: string) => void;
  saved: string[]; toggleSaved: (id: string) => void;
  panel: Panel; setPanel: (value: Panel) => void;
};
const MarketplaceContext = createContext<MarketplaceState | null>(null);

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("All zones");
  const [saved, setSaved] = useState<string[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
  useEffect(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem("gal-saved") ?? "[]");
      if (Array.isArray(value)) setSaved(value.filter((id): id is string => typeof id === "string"));
    } catch { /* An unavailable browser store should not block discovery. */ }
  }, []);
  const toggleSaved = (id: string) => setSaved((previous) => {
    const next = previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id];
    try { localStorage.setItem("gal-saved", JSON.stringify(next)); } catch { /* Session-only fallback. */ }
    return next;
  });
  return <MarketplaceContext.Provider value={{ search, setSearch, zone, setZone, saved, toggleSaved, panel, setPanel }}>{children}</MarketplaceContext.Provider>;
}

export function useMarketplace() {
  const state = useContext(MarketplaceContext);
  if (!state) throw new Error("Marketplace controls require MarketplaceProvider");
  return state;
}