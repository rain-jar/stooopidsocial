import Link from "next/link";

type NavItem = {
  label: string;
  href: string | null;
  hidden?: boolean;
};

const navItemClassName =
  "inline-flex min-h-11 items-center hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

const NAV_ITEMS: NavItem[] = [
  { label: "Run", href: "/run" },
  // No page yet: render as a non-navigating placeholder so it cannot 404.
  { label: "Ice Skate", href: null },
  // Hidden for now. Restore by removing `hidden: true`. The /links page is unchanged.
  { label: "Linktree", href: "/links", hidden: true },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0B0B0B]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          Les Stooopids
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-5 text-sm text-white/70">
          {NAV_ITEMS.filter((item) => !item.hidden).map((item) =>
            item.href ? (
              <Link key={item.label} href={item.href} className={navItemClassName}>
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
