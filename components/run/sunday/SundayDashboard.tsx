"use client";

import { useEffect, useState, type ReactNode } from "react";
import advisoriesFile from "@/data/sunday-advisories.json";
import { sundayRouteNames } from "@/data/run";
import { lastCheckedText, NoticeList } from "@/components/run/sunday/NoticeList";
import { OutfitView, WeatherDetails } from "@/components/run/sunday/OutfitView";
import { SundayLocation } from "@/components/run/sunday/SundayLocation";
import { activeNotices, collectNotices, type NoticeFile } from "@/lib/sunday/notices";
import { ROUTE_NOTICES } from "@/lib/sunday/routeAdvisories";
import { EVENT, nextRun, type RunTimes } from "@/lib/sunday/event";
import { clockTime, dayLabel, runTimeLabel } from "@/lib/sunday/format";
import { hourAt, sunFor, FORECAST_DAYS, freshForecastReaches } from "@/lib/sunday/forecast";
import { whatToWear } from "@/lib/sunday/outfit";
import { localDate, outfitInputFor } from "@/lib/sunday/runTime";
import { useForecast } from "@/lib/sunday/useForecast";

const advisories = advisoriesFile as NoticeFile;

/** A saved forecast older than this gets an "may be out of date" warning. */
const OLD_FORECAST_MS = 6 * 3_600_000;

const weekdayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", weekday: "long" });

const forecastReachesFrom = (run: RunTimes) => weekdayFmt.format(run.startAt - (FORECAST_DAYS - 1) * 86_400_000);

function outfitLaterText(run: RunTimes, now: number): string {
  return freshForecastReaches(run.startAt, now)
    ? `${EVENT.weekday}’s outfit isn’t in the saved forecast yet. REFRESH to get it.`
    : `${EVENT.weekday}’s outfit shows up ${forecastReachesFrom(run)}.`;
}

/**
 * Stooopid Sunday dashboard body for the Run page popup.
 * Logic and look follow ShereenElaidi/anyoneCanPace-beta@376558b, as a
 * separate implementation. The Insta story section and app footer are omitted.
 */
export default function SundayDashboard() {
  const { forecast, state, refresh } = useForecast();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const run = nextRun(now);
  const runInput = forecast ? outfitInputFor(forecast, run.startAt) : null;
  const runOutfit = runInput ? whatToWear(runInput) : null;
  const runHour = forecast ? hourAt(forecast, run.startAt) : null;

  const notices = activeNotices(collectNotices(advisories.notices, ROUTE_NOTICES), null, localDate(now));
  const updatedAt = forecast?.fetchedAt ?? null;
  const statusNeedsAttention =
    !updatedAt || state === "offline" || state === "failed" || now - (updatedAt ?? 0) > OLD_FORECAST_MS;
  const status = <StatusLine updatedAt={updatedAt} state={state} now={now} onRefresh={() => void refresh()} />;

  const checkOutside = (
    <div className="dash-card dash-card--empty" role="status">
      <p className="dash-card__big">Check outside</p>
      <p>
        {forecast
          ? "The saved forecast doesn’t cover the coming hours. Connect to the internet to update it."
          : `No forecast yet${state === "offline" ? " and you’re offline" : ""}. Look at the sky and feel the air before you dress.`}
      </p>
    </div>
  );

  let runSlot: ReactNode;
  if (runOutfit && runHour) {
    runSlot = (
      <OutfitView
        label={`What to wear on ${EVENT.weekday}`}
        outfit={runOutfit}
        hour={runHour}
      />
    );
  } else if (!forecast && state === "loading") {
    runSlot = <p className="loading">Getting the forecast…</p>;
  } else if (!forecast) {
    runSlot = checkOutside;
  } else {
    runSlot = <p className="dash-run__later">{outfitLaterText(run, now)}</p>;
  }

  const monthDayFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="run-sunday">
      {statusNeedsAttention && status}

      {notices.length > 0 && (
        <section className="dash-advisories" aria-labelledby="notices-title">
          <h2 id="notices-title" className="dash__h2">
            Route advisories
          </h2>
          <NoticeList notices={notices} lastChecked={advisories.lastChecked} routeNames={sundayRouteNames} empty="" />
        </section>
      )}

      <section className="dash-run dash-run--main" aria-label={EVENT.name}>
        <p className="dash-run__when">
          <span id="run-details-label" className="dash-run__date">Next Stooopid {EVENT.weekday}:</span>
          <span className="dash-run__meet-time">
            {monthDayFmt.format(run.startAt)}, {clockTime(run.meetAt).replace(":00", "").replace(/ /g, "\u00a0")}
          </span>
        </p>
        {runSlot}
      </section>

      <SundayLocation />

      {runOutfit && runHour && (
        <WeatherDetails
          detailsTitle={`Weather for ${lowerDay(runTimeLabel(runHour.at, now))}`}
          outfit={runOutfit}
          hour={runHour}
          sun={forecast && sunFor(forecast, run.startAt)}
        />
      )}

      {notices.length === 0 && (
        <p className="dash-clear">
          <span aria-hidden="true">✓ </span>No route advisories.{" "}
          <span className="dash-clear__checked">{lastCheckedText(advisories.lastChecked)}</span>
        </p>
      )}

      {!statusNeedsAttention && status}

      <p className="credits">
        Weather data by <a href="https://open-meteo.com/">Open-Meteo.com</a> (CC BY 4.0) from Environment and Climate
        Change Canada’s GEM model, for central Montréal. Your phone asks Open-Meteo directly, so they see an ordinary
        web request (such as your IP address), but never your GPS location.
      </p>
    </div>
  );
}

function StatusLine(props: {
  updatedAt: number | null;
  state: ReturnType<typeof useForecast>["state"];
  now: number;
  onRefresh: () => void;
}) {
  const { updatedAt, state, now } = props;
  let text: string;
  if (state === "loading") text = updatedAt ? `Updating… (last ${when(updatedAt, now)})` : "Getting the forecast…";
  else if (!updatedAt) text = state === "offline" ? "Offline: no forecast saved yet." : state === "failed" ? "Couldn’t get the forecast." : "";
  else if (state === "offline") text = sentence(`Offline: showing the forecast from ${when(updatedAt, now)}`);
  else if (state === "failed") text = sentence(`Couldn’t update: showing the forecast from ${when(updatedAt, now)}`);
  else text = sentence(`Updated ${when(updatedAt, now)}`);
  const old = updatedAt !== null && now - updatedAt > OLD_FORECAST_MS;

  return (
    <div className={`dash-status${old || state === "offline" || state === "failed" ? " dash-status--stale" : ""}`}>
      <p aria-live="polite">
        {text}
        {old && state !== "loading" ? " It may be out of date." : ""}
      </p>
      <button type="button" className="btn btn--secondary btn--small" onClick={props.onRefresh} disabled={state === "loading"}>
        REFRESH
      </button>
    </div>
  );
}

const lowerDay = (label: string) => label.replace(/^(Today|Tomorrow)/, (d) => d.toLowerCase());

function when(at: number, now: number): string {
  const day = dayLabel(at, now);
  if (day === "Today") return clockTime(at);
  return `${day === "Yesterday" || day === "Tomorrow" ? day.toLowerCase() : day} ${clockTime(at)}`;
}

const sentence = (s: string) => (s.endsWith(".") ? s : `${s}.`);

