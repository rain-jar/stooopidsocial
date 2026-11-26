/**
 * Local Montréal times and the outfit input for a chosen run start. Pure:
 * `now` is always passed in. Local times are Montréal's, whatever the phone's zone.
 */
import { hourAt, MONTREAL, sunFor, type Forecast } from './forecast';
import { RUN_DURATION_MIN, type Light, type OutfitInput, type Recent } from './outfit';

const dateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: MONTREAL.timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** YYYY-MM-DD in Montréal. */
export function localDate(at: number): string {
  return dateFmt.format(at);
}

/** Daylight during a run starting at `at`. */
export function lightAt(f: Forecast, at: number): Light {
  const sun = sunFor(f, at);
  if (!sun) return hourAt(f, at)?.isDay === false ? 'dark' : 'day';
  if (at < sun.sunrise || at >= sun.sunset) return 'dark';
  if (at + RUN_DURATION_MIN * 60_000 > sun.sunset) return 'dusk';
  return 'day';
}

/** Hours of the previous 24 the forecast must have before `recent` is trusted. */
const RECENT_MIN_HOURS = 18;

/** Rain, snow and thaw in the 24 h before `at`, or null if the forecast doesn't reach back that far. */
export function recentFor(f: Forecast, at: number): Recent | null {
  const past = f.hours.filter((h) => h.at < at && h.at >= at - 24 * 3_600_000);
  if (past.length < RECENT_MIN_HOURS) return null;
  return {
    wetMm: past.reduce((sum, h) => sum + (h.rainMm ?? 0) + (h.showersMm ?? 0), 0),
    snowCm: past.reduce((sum, h) => sum + (h.snowCm ?? 0), 0),
    wasAboveZero: past.some((h) => h.tempC > 0),
  };
}

/** Everything whatToWear needs for a run at `at`, or null if the forecast doesn't cover it. */
export function outfitInputFor(f: Forecast, at: number): OutfitInput | null {
  const h = hourAt(f, at);
  if (!h) return null;
  return {
    tempC: h.tempC,
    feelsC: h.feelsC,
    dewPointC: h.dewPointC ?? null,
    precipProb: h.precipProb,
    rainMm: h.rainMm === null && h.showersMm === null ? null : (h.rainMm ?? 0) + (h.showersMm ?? 0),
    snowCm: h.snowCm,
    precipMm: h.precipMm,
    snowDepthM: h.snowDepthM,
    code: h.code,
    windKmh: h.windKmh,
    gustKmh: h.gustKmh,
    light: lightAt(f, at),
    recent: recentFor(f, at),
  };
}
