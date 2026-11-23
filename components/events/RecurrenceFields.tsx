"use client";

import { useState } from "react";
import type { RecurrenceFrequency } from "@/lib/events/validation";
import { EventDateInput } from "./EventDateField";

const weekdays = [
  [0, "Sun"], [1, "Mon"], [2, "Tue"], [3, "Wed"],
  [4, "Thu"], [5, "Fri"], [6, "Sat"],
] as const;

type Props = {
  className: string;
  defaultFrequency?: RecurrenceFrequency | null;
  defaultWeekdays?: number[] | null;
  defaultEndDate?: string | null;
  defaultCount?: number | null;
};

export default function RecurrenceFields({
  className,
  defaultFrequency = null,
  defaultWeekdays = null,
  defaultEndDate = null,
  defaultCount = null,
}: Props) {
  const [enabled, setEnabled] = useState(Boolean(defaultFrequency));
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(defaultFrequency || "weekly");
  const [endType, setEndType] = useState<"date" | "count">(defaultEndDate ? "date" : "count");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(defaultWeekdays ?? []);

  return (
    <fieldset className="sm:col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <legend className="px-1 text-sm font-semibold">Recurrence</legend>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
        <input
          name="recurring"
          type="checkbox"
          checked={enabled}
          onChange={(event) => {
            const checked = event.target.checked;
            setEnabled(checked);
            if (checked && selectedWeekdays.length === 0) {
              const startDate = new FormData(event.currentTarget.form ?? undefined).get("startDate");
              const weekday = typeof startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(startDate)
                ? new Date(`${startDate}T00:00:00Z`).getUTCDay()
                : new Date().getDay();
              setSelectedWeekdays([weekday]);
            }
          }}
          className="size-5 accent-[#ff8065]"
        />
        This is a recurring event
      </label>

      {enabled ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Repeats
            <select
              name="recurrenceFrequency"
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as RecurrenceFrequency)}
              className={className}
            >
              <option value="weekly">Every week</option>
              <option value="biweekly">Every two weeks</option>
              <option value="monthly">Every month</option>
            </select>
          </label>

          {frequency !== "monthly" ? (
            <fieldset className="text-sm sm:col-span-2">
              <legend>On these days</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {weekdays.map(([value, label]) => (
                  <label key={value} className="cursor-pointer">
                    <input
                      type="checkbox"
                      name="recurrenceWeekdays"
                      value={value}
                      checked={selectedWeekdays.includes(value)}
                      onChange={(event) => setSelectedWeekdays((current) =>
                        event.target.checked
                          ? [...current, value].sort((a, b) => a - b)
                          : current.filter((day) => day !== value),
                      )}
                      className="peer sr-only"
                    />
                    <span className="grid min-h-10 min-w-12 place-items-center rounded-lg border border-white/15 px-2 peer-checked:border-[#ff8065] peer-checked:bg-[#ff8065] peer-checked:text-neutral-950 peer-focus-visible:outline-2 peer-focus-visible:outline-[#ff8065]">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <fieldset className="text-sm sm:col-span-2">
            <legend>Ends</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="recurrenceEndType" value="count" checked={endType === "count"} onChange={() => setEndType("count")} className="size-4 accent-[#ff8065]" />
                After
                <input
                  name="recurrenceCount"
                  type="number"
                  min={1}
                  max={52}
                  defaultValue={defaultCount || 8}
                  required={endType === "count"}
                  disabled={endType !== "count"}
                  className={`${className} mt-0 w-20`}
                />
                occurrences
              </label>
              <div className="flex items-center gap-2">
                <label className="flex shrink-0 items-center gap-2">
                  <input type="radio" name="recurrenceEndType" value="date" checked={endType === "date"} onChange={() => setEndType("date")} className="size-4 accent-[#ff8065]" />
                  On
                </label>
                <EventDateInput
                  name="recurrenceEndDate"
                  aria-label="Recurrence end date"
                  defaultValue={defaultEndDate || ""}
                  required={endType === "date"}
                  disabled={endType !== "date"}
                  minFrom="startDate"
                  wrapperClassName="flex-1"
                  className={`${className} mt-0 min-w-0`}
                />
              </div>
            </div>
          </fieldset>
          <p className="text-xs leading-5 text-white/45 sm:col-span-2">Maximum 52 occurrences within two years. Monthly events use the selected start-date number.</p>
        </div>
      ) : null}
    </fieldset>
  );
}
