export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-4">
            <span className="text-lg font-semibold tracking-tight">
            Montreal Social Hub
            </span>

            <nav className="flex gap-6 text-lg text-white/90">
            <a href="#" className="hover:text-white">About</a>
            <a href="#" className="hover:text-white">Run</a>
            <a href="#" className="hover:text-white">Skate</a>
            <a href="#" className="hover:text-white">Hike</a>
            <a href="#" className="hover:text-white">Dance</a>
            </nav>
        </div>
    </header>
  );
}
