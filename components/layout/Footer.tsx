export default function Footer() {
  return (
    <footer className="mt-1 border-t border-white/10">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8 text-sm text-white/50">
            <p className="mb-6 text-center text-lg text-white/90">
                Be good. Be kind. Be Stooopid
            </p>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Montreal Social Hub</span>
{/*
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">About</a>
            <a href="#" className="hover:text-white">Contact</a>
            <a href="#" className="hover:text-white">Privacy</a>
          </div>
*/}
        </div>
      </div>
    </footer>
  );
}
