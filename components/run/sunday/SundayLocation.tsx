"use client";

import { useState } from "react";
import { mapsLink } from "@/lib/sunday/event";

/** Where we meet: copy the map link, or open it. */
export function SundayLocation() {
  const link = mapsLink();
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  }

  return (
    <section className="dash-story" aria-labelledby="location-title">
      <h2 id="location-title" className="dash__h3">
        Location Deets
      </h2>
      <div className="dash-run__actions">
        <button type="button" className="btn btn--secondary btn--small" onClick={() => void copyLink()}>
          COPY MAP LINK
        </button>
        <a className="btn btn--secondary btn--small" href={link} target="_blank" rel="noopener noreferrer">
          OPEN MAP
        </a>
      </div>
      <p className="dash-story__message" aria-live="polite">
        {copy === "copied" ? "Map link copied. Paste it into a Link sticker." : ""}
      </p>
      {copy === "failed" && (
        <label className="dash-run__manual">
          Couldn’t copy. Press and hold to copy the link:
          <input type="text" readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
        </label>
      )}
    </section>
  );
}
