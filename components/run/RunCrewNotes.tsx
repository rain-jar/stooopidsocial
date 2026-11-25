import { runContent } from "@/data/run";
import { getPublicLinkCategories } from "@/lib/links/repository";
import { validHttpUrl } from "@/lib/links/validation";

const shortcuts = [
  { label: "Instagram", href: runContent.photos.follow.href, color: "honey" },
  { label: "Strava", href: "https://www.strava.com/clubs/2391274", color: "peach" },
  { label: "Pacing app", href: runContent.pacing.cta.href, color: "blue" },
];

function destinationKey(href: string) {
  const { host, pathname, search, hash } = new URL(href);
  return host.replace(/^www\./, "") + pathname.replace(/\/+$/, "") + search + hash;
}

export async function getRunExtraLinks() {
  const categories = await getPublicLinkCategories().catch(() => []);
  const seen = new Set(shortcuts.map((link) => destinationKey(link.href)));

  return categories.flatMap((category) =>
    category.links.flatMap((link) => {
      let href: string;
      try {
        href = validHttpUrl(link.url);
      } catch {
        return [];
      }

      const key = destinationKey(href);
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ id: link.id, label: link.title, href }];
    }),
  );
}

export default function RunCrewNotes({ extraLinks }: {
  extraLinks: Awaited<ReturnType<typeof getRunExtraLinks>>;
}) {
  const notes = (
    <ul className="run-notes-stack">
      {shortcuts.map(({ label, href, color }) => (
        <li key={href} className="run-sticky-note" data-note-color={color}>
          <a href={href} target="_blank" rel="noopener noreferrer" className="run-note-action">
            <span>{label}<span className="sr-only"> (opens in a new tab)</span></span>
            <span aria-hidden="true">↗</span>
          </a>
        </li>
      ))}
      {extraLinks.length > 0 && (
        <li className="run-sticky-note">
          <details className="run-community-note">
            <summary className="run-note-action">
              Community links
              <span className="run-note-fold" aria-hidden="true" />
            </summary>
            <ul>
              {extraLinks.map(({ id, label, href }) => (
                <li key={id}>
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {label}<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </li>
      )}
    </ul>
  );

  return (
    <>
      <button
        type="button"
        popoverTarget="run-notes-menu"
        className="run-press run-press-secondary"
      >
        Crew links <span aria-hidden="true">+</span>
      </button>
      <div
        className="run-notes-popover"
        id="run-notes-menu"
        popover="auto"
        role="group"
        aria-labelledby="run-notes-label"
      >
        <div className="mb-2 flex items-center justify-between gap-3 font-bold">
          <span id="run-notes-label">Crew &amp; community</span>
          <button
            type="button"
            popoverTarget="run-notes-menu"
            popoverTargetAction="hide"
            className="run-notes-close"
            aria-label="Close crew and community links"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        {notes}
      </div>
    </>
  );
}
