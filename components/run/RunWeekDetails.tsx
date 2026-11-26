"use client";

import SundayDashboard from "@/components/run/sunday/SundayDashboard";
import { runContent, runCrewHomeCtaLabel } from "@/data/run";
import "@/components/run/sunday/sunday.css";

const popoverId = "run-details-menu";

/**
 * "This week's details" — a paper popup with the Stooopid Sunday dashboard
 * (look and logic ported from anyoneCanPace-beta). Close with the X, Escape,
 * the backdrop, or Run Crew Home, the same pattern as Crew links.
 */
export default function RunWeekDetails() {
  return (
    <>
      <button type="button" className="run-press" popoverTarget={popoverId}>
        {runContent.sunday.cta.label}
      </button>
      <div
        id={popoverId}
        popover="auto"
        className="run-notes-popover run-details-popover"
        role="dialog"
        aria-modal="true"
        aria-labelledby="run-details-label"
      >
        <div className="run-notes-head">
          <h2 id="run-details-label" className="run-details-title">
            Stooopid Sunday
          </h2>
          <button
            type="button"
            className="run-notes-close"
            popoverTarget={popoverId}
            popoverTargetAction="hide"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="run-details-board">
          <SundayDashboard />
        </div>
        <footer className="run-notes-footer">
          <hr className="run-notes-rule" />
          <button
            type="button"
            popoverTarget={popoverId}
            popoverTargetAction="hide"
            className="run-press run-notes-home"
          >
            {runCrewHomeCtaLabel}
          </button>
        </footer>
      </div>
    </>
  );
}
