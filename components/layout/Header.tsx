"use client";

import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">
          Montreal Social Hub
        </span>

        {/* Desktop menu */}
        <nav className="hidden md:flex gap-6 text-sm text-white/70">
          <a href="#" className="hover:text-white">About</a>
          <a href="#" className="hover:text-white">Run</a>
          <a href="#" className="hover:text-white">Skate</a>
          <a href="#" className="hover:text-white">Hike</a>
          <a href="#" className="hover:text-white">Dance</a>
        </nav>

        {/* Mobile button */}
        <button
          className="md:hidden text-white/80"
          onClick={() => setOpen(!open)}
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-bg/95 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-4 px-6 py-4 text-white/80">
            <a href="#" onClick={() => setOpen(false)}>About</a>
            <a href="#" onClick={() => setOpen(false)}>Run</a>
            <a href="#" onClick={() => setOpen(false)}>Skate</a>
            <a href="#" onClick={() => setOpen(false)}>Hike</a>
            <a href="#" onClick={() => setOpen(false)}>Dance</a>
          </nav>
        </div>
      )}
    </header>
  );
}
