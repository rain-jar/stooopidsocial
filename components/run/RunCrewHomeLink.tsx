"use client";

import Link from "next/link";
import { useEffect } from "react";
import { runCrewHomeCtaLabel } from "@/data/run";

function hideCrewPopover(popoverId: string) {
  const popup = document.getElementById(popoverId);
  if (!popup?.matches(":popover-open")) return;
  popup.hidePopover();
}

export default function RunCrewHomeLink({ popoverId }: { popoverId: string }) {
  useEffect(() => () => hideCrewPopover(popoverId), [popoverId]);

  const close = () => hideCrewPopover(popoverId);

  return (
    <Link href="/" className="run-press run-notes-home" onClick={close} onNavigate={close}>
      {runCrewHomeCtaLabel}
    </Link>
  );
}
