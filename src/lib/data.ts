import food from "@/assets/food.jpg";
import phone from "@/assets/phone.jpg";
import salon from "@/assets/salon.jpg";
import market from "@/assets/market.jpg";

export const CATEGORIES = ["All", "Restaurants", "Phone Repair", "Beauty Salons", "Markets & Groceries"] as const;
export const ZONES = ["All zones", "Stabroek", "Kitty", "Sheriff St", "Campbellville", "Bourda", "Lamaha Gardens"] as const;

// [open, close] in 24h hours per weekday Sun..Sat; null = closed
export type Hours = ([number, number] | null)[];

export interface Business {
  id: string;
  name: string;
  category: (typeof CATEGORIES)[number];
  zone: (typeof ZONES)[number];
  address: string;
  phone: string;
  whatsapp: string;
  images: string[];
  offer: string;
  coupon?: string;
  description: string;
  services: string[];
  hours: Hours;
  rating: number;
  reviews: { name: string; stars: number; text: string }[];
  postedAgo: string;
}

const std: Hours = [null, [8, 18], [8, 18], [8, 18], [8, 18], [8, 20], [9, 16]];

export const BUSINESSES: Business[] = [
  {
    id: "pepperpot-palace",
    name: "Pepperpot Palace",
    category: "Restaurants",
    zone: "Kitty",
    address: "12 Vlissengen Rd, Kitty, Georgetown",
    phone: "+5926001234",
    whatsapp: "5926001234",
    images: [food, market, food],
    offer: "Lunch special: Pepperpot + roti + drink for GYD 1,800",
    coupon: "LUNCH18",
    description: "Authentic Guyanese home cooking since 2009. Cook-up rice, pepperpot, curry and fresh roti daily.",
    services: ["Dine-in", "Takeaway", "Delivery", "Catering"],
    hours: [[10, 16], [9, 21], [9, 21], [9, 21], [9, 21], [9, 23], [9, 23]],
    rating: 4.7,
    reviews: [
      { name: "Anita R.", stars: 5, text: "Best pepperpot in Georgetown, no contest." },
      { name: "Marcus D.", stars: 4, text: "Big portions, quick delivery to Campbellville." },
    ],
    postedAgo: "2h",
  },
  {
    id: "fixit-mobile",
    name: "FixIt Mobile GY",
    category: "Phone Repair",
    zone: "Stabroek",
    address: "Water St, Stabroek, Georgetown",
    phone: "+5926115678",
    whatsapp: "5926115678",
    images: [phone, phone],
    offer: "Screen replacement from GYD 8,000 — done in 1 hour",
    coupon: "SCREEN10",
    description: "iPhone, Samsung and Tecno repairs. Original parts and 90-day warranty.",
    services: ["Screen replacement", "Battery swap", "Water damage", "Unlocking", "Accessories"],
    hours: std,
    rating: 4.5,
    reviews: [
      { name: "Kevin P.", stars: 5, text: "Fixed my Samsung in 40 minutes. Honest price." },
      { name: "Shania L.", stars: 4, text: "Good service, a bit busy at lunch time." },
    ],
    postedAgo: "4h",
  },
  {
    id: "glow-studio",
    name: "Glow Beauty Studio",
    category: "Beauty Salons",
    zone: "Campbellville",
    address: "45 Sheriff St, Campbellville, Georgetown",
    phone: "+5926229012",
    whatsapp: "5926229012",
    images: [salon, salon],
    offer: "20% off braids & silk press this week",
    coupon: "GLOW20",
    description: "Hair, nails and lashes by certified stylists. Walk-ins welcome.",
    services: ["Braids", "Silk press", "Manicure & pedicure", "Lash extensions", "Makeup"],
    hours: [null, null, [9, 19], [9, 19], [9, 19], [9, 20], [8, 18]],
    rating: 4.9,
    reviews: [
      { name: "Tamika S.", stars: 5, text: "My braids lasted 6 weeks. Love this team!" },
      { name: "Priya N.", stars: 5, text: "Clean, friendly and on time." },
    ],
    postedAgo: "6h",
  },
  {
    id: "bourda-fresh",
    name: "Bourda Fresh Market",
    category: "Markets & Groceries",
    zone: "Bourda",
    address: "Robb St, Bourda, Georgetown",
    phone: "+5926333456",
    whatsapp: "5926333456",
    images: [market, market],
    offer: "Fresh juice 2-for-1 every morning until 10am",
    description: "Local fruits, vegetables, fresh juices and spices straight from the farms of Essequibo and Berbice.",
    services: ["Fresh produce", "Juices", "Spices", "Home delivery"],
    hours: [[6, 12], [6, 18], [6, 18], [6, 18], [6, 18], [6, 18], [5, 18]],
    rating: 4.6,
    reviews: [{ name: "Joel B.", stars: 5, text: "Cheapest mangoes and sorrel in town." }],
    postedAgo: "1d",
  },
];

export const getBusiness = (id: string) => BUSINESSES.find((b) => b.id === id);

/** Georgetown is UTC-4 year-round (no DST). */
export function georgetownNow(d = new Date()) {
  const gy = new Date(d.getTime() - 4 * 3600 * 1000);
  return { day: gy.getUTCDay(), hour: gy.getUTCHours() + gy.getUTCMinutes() / 60 };
}

export function openStatus(hours: Hours, d = new Date()) {
  const { day, hour } = georgetownNow(d);
  const t = hours[day];
  if (t && hour >= t[0] && hour < t[1]) return { open: true, label: `Open · closes ${fmt(t[1])}` };
  return { open: false, label: t && hour < t[0] ? `Closed · opens ${fmt(t[0])}` : "Closed now" };
}

export const fmt = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`;
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const waLink = (b: Business) =>
  `https://wa.me/${b.whatsapp}?text=${encodeURIComponent(`Hi ${b.name}, I saw your offer on Guyana Ad Local!`)}`;
export const mapsLink = (b: Business) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`;
