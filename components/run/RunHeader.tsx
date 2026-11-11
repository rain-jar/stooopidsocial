import Link from "next/link";
import { runContent } from "@/data/run";

export default function RunHeader() {
  return (
    <header className="run-header sticky top-0 z-40 border-b-[3px]">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
        <Link href={runContent.header.homeHref} className="text-base font-bold tracking-tight">
          {runContent.header.homeLabel}
        </Link>
        <nav aria-label="Run crew" className="flex items-center gap-4 text-sm font-bold">
          {runContent.header.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.href === "/run" ? "page" : undefined}
              className="rounded-md px-1 py-1"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
