import { runCrewHomeCtaLabel, runCrewLinkGroups, runCrewLinksTitle } from "@/data/run";
import { getPublicLinkCategories } from "@/lib/links/repository";
import { validHttpUrl } from "@/lib/links/validation";
import RunCrewNotesDeepLink from "./RunCrewNotesDeepLink";

const popoverId = "run-notes-menu";

const groupedShortcuts = runCrewLinkGroups.flatMap((group) => group.links);

function destinationKey(href: string) {
  const { host, pathname, search, hash } = new URL(href);
  return host.replace(/^www\./, "") + pathname.replace(/\/+$/, "") + search + hash;
}

export async function getRunExtraLinks() {
  const categories = await getPublicLinkCategories().catch(() => []);
  const seen = new Set(groupedShortcuts.map((link) => destinationKey(link.href)));

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

function ShortcutNote({ label, href, color }: { label: string; href: string; color: string }) {
  return (
    <li className="run-sticky-note" data-note-color={color}>
      <a href={href} target="_blank" rel="noopener noreferrer" className="run-note-action">
        <span>{label}<span className="sr-only"> (opens in a new tab)</span></span>
        <span aria-hidden="true">↗</span>
      </a>
    </li>
  );
}

export default function RunCrewNotes({ extraLinks }: {
  extraLinks: Awaited<ReturnType<typeof getRunExtraLinks>>;
}) {
  const groups = runCrewLinkGroups.filter((group) =>
    group.links.length > 0 || (group.disclosureLabel && extraLinks.length > 0),
  );

  return (
    <>
      <button
        type="button"
        popoverTarget={popoverId}
        className="run-press run-press-secondary"
      >
        Crew links <span aria-hidden="true">+</span>
      </button>
      <div
        className="run-notes-popover"
        id={popoverId}
        popover="auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="run-notes-label"
      >
        <div className="run-notes-head">
          <h2 id="run-notes-label" className="run-notes-title">{runCrewLinksTitle}</h2>
          <button
            type="button"
            popoverTarget={popoverId}
            popoverTargetAction="hide"
            className="run-notes-close"
            aria-label="Close crew and community links"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="run-notes-board">
          {groups.map((group) => {
            const headingId = `run-notes-${group.id}`;
            return (
              <section key={group.id} className="run-notes-group" aria-labelledby={headingId}>
                <h3 id={headingId} className="run-notes-tag">{group.label}</h3>
                <ul className="run-notes-stack">
                  {group.links.map((link) => (
                    <ShortcutNote key={link.href} {...link} />
                  ))}
                  {group.disclosureLabel && extraLinks.length > 0 && (
                    <li className="run-sticky-note">
                      <details className="run-community-note">
                        <summary className="run-note-action">
                          {group.disclosureLabel}
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
              </section>
            );
          })}
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
      <RunCrewNotesDeepLink popoverId={popoverId} />
    </>
  );
}
