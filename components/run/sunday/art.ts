/**
 * Which images to stack, back to front, for an outfit.
 * Art files are a copy of ShereenElaidi/anyoneCanPace-beta@376558b
 * src/assets/duck-outfit, served from /run/sunday/duck-outfit.
 */
import type { ItemId } from "@/lib/sunday/outfit";
import { duckLayers } from "./pieces";

const BASE = "/run/sunday/duck-outfit";

const PIECES: Partial<Record<ItemId, string>> = {
  "tights": `${BASE}/tights.webp`,
  "shorts": `${BASE}/shorts.webp`,
  "thermal-layers": `${BASE}/thermal-layers.webp`,
  "tee": `${BASE}/tee.webp`,
  "long-sleeve": `${BASE}/long-sleeve.webp`,
  "light-jacket": `${BASE}/light-jacket.webp`,
  "windbreaker": `${BASE}/windbreaker.webp`,
  "windproof-shell": `${BASE}/windproof-shell.webp`,
  "raincoat": `${BASE}/raincoat.webp`,
  "reflective-vest": `${BASE}/reflective-vest.webp`,
  "neck-warmer": `${BASE}/neck-warmer.webp`,
  "light-gloves": `${BASE}/light-gloves.webp`,
  "mittens": `${BASE}/mittens.webp`,
  "headband": `${BASE}/headband.webp`,
  "toque": `${BASE}/toque.webp`,
  "headlamp": `${BASE}/headlamp.webp`,
};

export interface DuckImage {
  id: ItemId | "base";
  url: string;
}

export function duckImages(drawn: readonly ItemId[]): DuckImage[] {
  return [
    { id: "base", url: `${BASE}/duck-base.webp` },
    ...duckLayers(drawn).flatMap((id) => (PIECES[id] ? [{ id, url: PIECES[id] }] : [])),
  ];
}
