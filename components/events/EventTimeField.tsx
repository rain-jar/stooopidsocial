"use client";

import { useState, useSyncExternalStore } from "react";

const DESKTOP_QUERY = "(min-width: 768px)";

function subscribeToDesktop(callback: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function desktopSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

const timeOptions = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;
  const value = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  const labelHour = hour % 12 || 12;
  return {
    value,
    label: `${labelHour}:${minute.toString().padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`,
  };
});

type Props = {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  optional?: boolean;
  className: string;
};

export default function EventTimeField({
  name,
  label,
  defaultValue = "",
  required = false,
  optional = false,
  className,
}: Props) {
  const desktop = useSyncExternalStore(subscribeToDesktop, desktopSnapshot, () => false);
  const [value, setValue] = useState(defaultValue);
  const [custom, setCustom] = useState(Boolean(defaultValue) && !timeOptions.some((option) => option.value === defaultValue));

  return (
    <label className="text-sm">
      {label} <span className="text-white/50">{optional ? "(optional; Eastern)" : "(Eastern)"}</span>
      <input
        name={desktop ? undefined : name}
        type="time"
        value={value}
        required={required && !desktop}
        disabled={desktop}
        onChange={(event) => setValue(event.target.value)}
        className={`${className} md:hidden`}
      />
      <select
        name={desktop && !custom ? name : undefined}
        value={custom ? "__custom" : value}
        required={required && desktop}
        disabled={!desktop || custom}
        onChange={(event) => {
          if (event.target.value === "__custom") {
            setCustom(true);
            return;
          }
          setValue(event.target.value);
        }}
        className={`${className} hidden md:block`}
      >
        <option value="">{required ? "Select a time" : "No time selected"}</option>
        {timeOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
        <option value="__custom">Custom time…</option>
      </select>
      {desktop && custom ? (
        <span className="mt-2 flex items-center gap-2">
          <input
            name={name}
            type="time"
            value={value}
            required={required}
            autoFocus
            onChange={(event) => setValue(event.target.value)}
            className={`${className} mt-0`}
          />
          <button
            type="button"
            onClick={() => {
              setCustom(false);
              if (!timeOptions.some((option) => option.value === value)) setValue("");
            }}
            className="min-h-11 shrink-0 rounded-lg border border-white/15 px-3 text-xs font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#ff8065]"
          >
            15-min list
          </button>
        </span>
      ) : null}
    </label>
  );
}
