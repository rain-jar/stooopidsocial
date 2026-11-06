import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0B0B0B]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          Les Stooopids
        </Link>

        <nav aria-label="Primary navigation" className="flex text-sm text-white/70">
          <Link href="/links" className="hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            Linktree
          </Link>
        </nav>
      </div>
    </header>
  );
}
