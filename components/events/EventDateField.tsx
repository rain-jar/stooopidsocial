"use client";

import { useEffect, useId, useRef, type InputHTMLAttributes } from "react";

function syncMinimum(input: HTMLInputElement, minFrom?: string, fallbackMin?: string | number) {
  if (!minFrom) return;
  const source = input.form?.elements.namedItem(minFrom);
  input.min = source instanceof HTMLInputElement && source.value
    ? source.value
    : typeof fallbackMin === "string" ? fallbackMin : "";
}

type DateInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  className: string;
  minFrom?: string;
  wrapperClassName?: string;
};

export function EventDateInput({
  className,
  minFrom,
  wrapperClassName = "",
  min,
  onClick,
  onFocus,
  ...props
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input || !minFrom) return;
    const source = input.form?.elements.namedItem(minFrom);
    if (!(source instanceof HTMLInputElement)) return;
    const update = () => syncMinimum(input, minFrom, min);
    update();
    source.addEventListener("input", update);
    return () => source.removeEventListener("input", update);
  }, [min, minFrom]);

  return (
    <span className={`block min-w-0 ${wrapperClassName}`}>
      <input
        {...props}
        ref={inputRef}
        type="date"
        min={min}
        onFocus={(event) => {
          syncMinimum(event.currentTarget, minFrom, min);
          onFocus?.(event);
        }}
        onClick={(event) => {
          syncMinimum(event.currentTarget, minFrom, min);
          onClick?.(event);
          if (event.defaultPrevented) return;
          try {
            event.currentTarget.showPicker?.();
          } catch {
            // The focused native date input remains available for typing or its normal picker.
          }
        }}
        className={`${className} event-date-input`}
      />
    </span>
  );
}

type DateFieldProps = DateInputProps & {
  label: string;
  optional?: boolean;
  containerClassName?: string;
};

export default function EventDateField({
  label,
  optional = false,
  containerClassName = "text-sm",
  id,
  ...props
}: DateFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label htmlFor={inputId} className={containerClassName}>
      {label} {optional ? <span className="text-white/50">(optional)</span> : null}
      <EventDateInput {...props} id={inputId} />
    </label>
  );
}
