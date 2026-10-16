import {
  Armchair,
  GlassWater,
  Lightbulb,
  Martini,
  Music,
  Sofa,
  Sparkles,
  Table,
  Tent,
  Wine,
  type LucideIcon,
} from "lucide-react";

export type Item = {
  id: string;
  name: string;
  price: number;
  stock: number;
  icon: LucideIcon;
};

export type Category = {
  name: string;
  items: Item[];
};

export type Package = {
  name: string;
  guests: number;
  items: Record<string, number>;
};

// Edit prices, stock and items here. Everything on the page updates from this list.
export const CATALOG: Category[] = [
  {
    name: "Tables",
    items: [
      { id: "trestle", name: "Trestle table 1.8m", price: 12, stock: 60, icon: Table },
      { id: "round", name: "Round banquet table", price: 18, stock: 30, icon: Table },
      { id: "cocktail", name: "Cocktail bar table", price: 25, stock: 20, icon: Martini },
    ],
  },
  {
    name: "Chairs",
    items: [
      { id: "americana", name: "White Americana chair", price: 6, stock: 300, icon: Armchair },
      { id: "crossback", name: "Cross-back timber chair", price: 9, stock: 120, icon: Armchair },
      { id: "stool", name: "Bar stool", price: 8, stock: 60, icon: Sofa },
    ],
  },
  {
    name: "Lighting",
    items: [
      { id: "festoon", name: "Festoon lights (10m)", price: 35, stock: 25, icon: Lightbulb },
      { id: "canopy", name: "Fairy light canopy", price: 120, stock: 4, icon: Sparkles },
      { id: "uplight", name: "LED uplight", price: 20, stock: 30, icon: Lightbulb },
    ],
  },
  {
    name: "Glassware",
    items: [
      { id: "flutes", name: "Champagne flutes (rack of 25)", price: 22, stock: 20, icon: Wine },
      { id: "wine", name: "Wine glasses (rack of 25)", price: 20, stock: 24, icon: Wine },
      { id: "bucket", name: "Drink bucket", price: 10, stock: 30, icon: GlassWater },
    ],
  },
  {
    name: "Big items",
    items: [
      { id: "marquee", name: "Marquee 6 x 6m", price: 450, stock: 3, icon: Tent },
      { id: "dancefloor", name: "Dance floor 4 x 4m", price: 380, stock: 2, icon: Music },
      { id: "bar", name: "Bar counter", price: 95, stock: 6, icon: Martini },
    ],
  },
];

export const PACKAGES: Package[] = [
  {
    name: "Backyard party",
    guests: 30,
    items: { trestle: 4, americana: 30, festoon: 3, bucket: 3, wine: 2 },
  },
  {
    name: "Garden wedding",
    guests: 80,
    items: { round: 10, crossback: 80, canopy: 1, flutes: 4, wine: 4, marquee: 1, dancefloor: 1 },
  },
  {
    name: "Cocktail evening",
    guests: 50,
    items: { cocktail: 8, stool: 16, uplight: 6, flutes: 2, bar: 1 },
  },
];

export const DELIVERY_FEE = 90;
export const SETUP_FEE = 120;
export const DEPOSIT_RATE = 0.3;

export const ITEMS: Record<string, Item> = Object.fromEntries(
  CATALOG.flatMap((c) => c.items.map((i) => [i.id, i])),
);

// Simulated availability: a stable "already booked" amount per item and date.
// In a real build this would come from a database or the business's hire software.
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export function availableOn(date: string, id: string): number {
  if (!date) return 0;
  const item = ITEMS[id];
  const day = new Date(`${date}T00:00:00`).getDay();
  const weekend = day === 0 || day === 5 || day === 6;
  const busy = hash(date + id) * (weekend ? 1.05 : 0.6);
  const booked = Math.min(item.stock, Math.floor(item.stock * busy));
  return item.stock - booked;
}

export const money = (n: number) => {
  const cents = Number.isInteger(n) ? 0 : 2;
  return "$" + n.toLocaleString("en-AU", { minimumFractionDigits: cents, maximumFractionDigits: 2 });
};

export const formatDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
