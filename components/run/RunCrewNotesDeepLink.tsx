"use client";

import { useEffect } from "react";

const queryKey = "crew-links";

export default function RunCrewNotesDeepLink({ popoverId }: { popoverId: string }) {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get(queryKey) !== "1") return;

    const popup = document.getElementById(popoverId);
    if (!popup || typeof popup.showPopover !== "function") return;

    function clearLink(event: ToggleEvent) {
      if (event.newState !== "closed") return;

      const url = new URL(window.location.href);
      if (url.searchParams.get(queryKey) !== "1") return;

      url.searchParams.delete(queryKey);
      window.history.replaceState(null, "", url);
    }

    popup.addEventListener("toggle", clearLink);
    if (!popup.matches(":popover-open")) {
      popup.showPopover();
      popup.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    }

    return () => popup.removeEventListener("toggle", clearLink);
  }, [popoverId]);

  return null;
}
