import Link from "next/link";
import { runContent } from "@/data/run";

type HeaderNavItem = {
  label: string;
  href: string | null;
  hidden?: boolean;
};

const navItemClassName = "inline-flex min-h-11 items-center rounded-md px-1";

const NAV_ITEMS: HeaderNavItem[] = [
  ...runContent.header.links,
  // No page yet: render as a non-navigating placeholder so it cannot 404.
  { label: "Ice Skate", href: null },
];

export default function RunHeader() {
  return (
    <header className="run-header sticky top-0 z-40 border-b-[3px]">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
        <Link href={runContent.header.homeHref} className="text-base font-bold tracking-tight">
          {runContent.header.homeLabel}
        </Link>
        <nav aria-label="Run crew" className="flex items-center gap-4 text-sm font-bold">
          {NAV_ITEMS.filter((item) => !item.hidden).map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                aria-current={item.href === "/run" ? "page" : undefined}
                className={navItemClassName}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                aria-disabled="true"
                title="Coming soon"
                className={navItemClassName}
              >
                {item.label}
              </span>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
