"use client";

import { useId, useRef } from "react";

type Props = {
  name: string;
  label?: string;
  defaultValue?: string;
  className: string;
  rows?: number;
};

type Format = "link" | "bullet" | "underline" | "strike";

export default function DescriptionEditor({
  name,
  label = "Description",
  defaultValue = "",
  className,
  rows = 6,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const descriptionId = useId();

  function applyFormat(format: Format) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end);
    let replacement = selected;
    let selectionStart = start;
    let selectionEnd = end;

    if (format === "link") {
      const labelText = selected || "link text";
      replacement = `[${labelText}](https://example.com)`;
      selectionStart = start + replacement.indexOf("https://");
      selectionEnd = selectionStart + "https://example.com".length;
    } else if (format === "underline") {
      replacement = `++${selected || "underlined text"}++`;
      selectionStart = start + 2;
      selectionEnd = start + replacement.length - 2;
    } else if (format === "strike") {
      replacement = `~~${selected || "strikethrough text"}~~`;
      selectionStart = start + 2;
      selectionEnd = start + replacement.length - 2;
    } else {
      const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1;
      const lineEndIndex = textarea.value.indexOf("\n", end);
      const lineEnd = lineEndIndex === -1 ? textarea.value.length : lineEndIndex;
      const lines = textarea.value.slice(lineStart, lineEnd).split("\n");
      replacement = lines.map((line) => line.startsWith("- ") ? line : `- ${line}`).join("\n");
      textarea.setRangeText(replacement, lineStart, lineEnd, "end");
      textarea.focus();
      return;
    }

    textarea.setRangeText(replacement, start, end, "end");
    textarea.focus();
    textarea.setSelectionRange(selectionStart, selectionEnd);
  }

  return (
    <div className="text-sm sm:col-span-2">
      <label htmlFor={descriptionId}>{label}</label>
      <div className="mt-1 overflow-hidden rounded-xl border border-white/15 bg-white/5 focus-within:border-[#ff8065]">
        <div className="flex flex-wrap gap-1 border-b border-white/10 p-2" aria-label="Description formatting">
          <button type="button" onClick={() => applyFormat("link")} className="min-h-9 rounded-lg px-3 font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#ff8065]" aria-label="Add link">Link</button>
          <button type="button" onClick={() => applyFormat("bullet")} className="min-h-9 rounded-lg px-3 font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#ff8065]" aria-label="Add bullet list">• List</button>
          <button type="button" onClick={() => applyFormat("underline")} className="min-h-9 rounded-lg px-3 font-semibold underline hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#ff8065]" aria-label="Underline text">Underline</button>
          <button type="button" onClick={() => applyFormat("strike")} className="min-h-9 rounded-lg px-3 font-semibold line-through hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#ff8065]" aria-label="Strikethrough text">Strike</button>
        </div>
        <textarea
          ref={textareaRef}
          id={descriptionId}
          name={name}
          defaultValue={defaultValue}
          required
          maxLength={5000}
          rows={rows}
          className={`${className} mt-0 rounded-none border-0 bg-transparent focus:border-transparent`}
        />
      </div>
      <p className="mt-1 text-xs leading-5 text-white/45">Select text, then choose a formatting option. Raw HTML is shown as text.</p>
    </div>
  );
}
