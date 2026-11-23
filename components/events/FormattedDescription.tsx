import type { ReactNode } from "react";

const INLINE_PATTERN = /(\[[^\]\n]{1,200}\]\(https?:\/\/[^\s)]+\)|\+\+[^+\n]+\+\+|~~[^~\n]+~~)/gi;

function safeLink(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function inlineContent(value: string, keyPrefix: string) {
  const content: ReactNode[] = [];
  let cursor = 0;
  for (const match of value.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) content.push(value.slice(cursor, index));
    const token = match[0];
    const key = `${keyPrefix}-${index}`;
    if (token.startsWith("++")) {
      content.push(<u key={key}>{token.slice(2, -2)}</u>);
    } else if (token.startsWith("~~")) {
      content.push(<s key={key}>{token.slice(2, -2)}</s>);
    } else {
      const separator = token.lastIndexOf("](");
      const label = token.slice(1, separator);
      const href = safeLink(token.slice(separator + 2, -1));
      content.push(href ? (
        <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-[#ff8065] underline-offset-2 hover:text-white">
          {label}
        </a>
      ) : token);
    }
    cursor = index + token.length;
  }
  if (cursor < value.length) content.push(value.slice(cursor));
  return content;
}

export default function FormattedDescription({ description }: { description: string }) {
  const lines = description.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let bulletItems: string[] = [];

  function flushBullets() {
    if (!bulletItems.length) return;
    const blockIndex = blocks.length;
    blocks.push(
      <ul key={`list-${blockIndex}`} className="list-disc space-y-1 pl-6">
        {bulletItems.map((item, index) => (
          <li key={`${blockIndex}-${index}`}>{inlineContent(item, `list-${blockIndex}-${index}`)}</li>
        ))}
      </ul>,
    );
    bulletItems = [];
  }

  lines.forEach((line, index) => {
    if (line.startsWith("- ")) {
      bulletItems.push(line.slice(2));
      return;
    }
    flushBullets();
    if (line.trim()) {
      blocks.push(<p key={`line-${index}`}>{inlineContent(line, `line-${index}`)}</p>);
    } else if (blocks.length) {
      blocks.push(<div key={`space-${index}`} className="h-2" aria-hidden="true" />);
    }
  });
  flushBullets();

  return <div className="mt-2 space-y-2 leading-7 text-white/72">{blocks}</div>;
}
