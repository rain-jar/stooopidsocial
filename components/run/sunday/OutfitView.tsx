import type { ReactNode } from "react";
import { weatherText, type DaySun, type HourWeather } from "@/lib/sunday/forecast";
import type { Outfit } from "@/lib/sunday/outfit";
import { extrasText } from "@/lib/sunday/outfitText";
import { clockTime, degrees } from "@/lib/sunday/format";
import { DressedDuck } from "./DressedDuck";

/** Fold-out list of weather numbers for a chosen hour. */
export function WeatherDetails(props: {
  detailsTitle: string;
  outfit: Outfit;
  hour: HourWeather;
  sun: DaySun | null;
  status?: ReactNode;
  credit?: ReactNode;
}) {
  const { detailsTitle, outfit, hour, sun, status, credit } = props;
  return (
    <details className="dash-details">
      <summary>Weather details</summary>
      <h3 className="dash-details__h3">{detailsTitle}</h3>
      <ul className="weather__facts">
        <li>
          {weatherText(hour.code)}, air {degrees(hour.tempC)}, feels like {degrees(hour.feelsC)}
        </li>
        <li>
          {hour.precipProb !== null ? `${Math.round(hour.precipProb)} % chance of rain or snow` : "Chance of rain unknown"}
          {hour.precipMm ? ` (${hour.precipMm.toFixed(1)} mm)` : ""}
        </li>
        <li>
          {hour.windKmh !== null
            ? `Wind ${Math.round(hour.windKmh)} km/h${hour.gustKmh !== null ? `, gusts ${Math.round(hour.gustKmh)} km/h` : ""}`
            : "Wind unknown"}
        </li>
        {outfit.windChillC !== null && <li>Wind chill {degrees(outfit.windChillC)}</li>}
        {outfit.humidex !== null && outfit.humidex >= 25 && <li>Humidex {Math.round(outfit.humidex)}</li>}
        {sun && (
          <li>
            Sunrise {clockTime(sun.sunrise)} · sunset {clockTime(sun.sunset)}
          </li>
        )}
      </ul>
      <p className="dash-details__small">
        Clothes follow the air temperature; wind, rain and snow adjust them. Made for an easy 45–60 min run.
      </p>
      {status}
      {credit}
    </details>
  );
}

/**
 * The dressed duck with its feels-like sticker, the outfit in words, and one line of weather.
 * The weather numbers live in a separate WeatherDetails fold-out.
 */
export function OutfitView(props: {
  label: string;
  outfit: Outfit;
  hour: HourWeather;
}) {
  const { label, outfit, hour } = props;
  return (
    <section className="dash-outfit" aria-label={label}>
      <div className="duck-slot">
        <DressedDuck items={outfit.drawn} weather={outfit.effect} />
        <p className="duck-feels">
          <span>Feels like</span> <strong>{degrees(hour.feelsC)}</strong>
        </p>
      </div>
      <p className="wear__headline">{outfit.headline}</p>
      {extrasText(outfit) && <p className="wear__also">Also: {extrasText(outfit)}</p>}
      <p className="wear__weather">
        Air <strong>{degrees(hour.tempC)}</strong> · {weatherLine(hour)}
      </p>
      {outfit.optional.length > 0 && (
        <ul className="wear__optional">
          {outfit.optional.map((o) => (
            <li key={o.id}>{o.text}</li>
          ))}
        </ul>
      )}
      {outfit.advisories.length > 0 && (
        <ul className="wear__advice">
          {outfit.advisories.map((a) => (
            <li key={a.text} className={`wear__advice--${a.level}`}>
              {a.level === "warning" && <strong>Warning: </strong>}
              {a.text}
            </li>
          ))}
        </ul>
      )}
      {outfit.bring.length > 0 && (
        <>
          <h3 className="dash-details__h3">Bring</h3>
          <ul className="wear__notes">
            {outfit.bring.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** "Cloudy · 20 % rain · wind 15 km/h" */
function weatherLine(hour: HourWeather): string {
  const parts = [weatherText(hour.code)];
  if (hour.precipProb !== null) parts.push(`${Math.round(hour.precipProb)}\u00a0% ${hour.tempC <= 2 ? "rain or snow" : "rain"}`);
  if (hour.windKmh !== null) parts.push(`wind ${Math.round(hour.windKmh)}\u00a0km/h`);
  return parts.join(" · ");
}
