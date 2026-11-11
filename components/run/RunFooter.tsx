import { runContent } from "@/data/run";

export default function RunFooter() {
  return (
    <footer className="run-footer run-tone-dark border-t-[3px] px-5 py-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 text-sm">
        <p className="text-base font-bold">{runContent.footer.motto}</p>
        <p>© {new Date().getFullYear()} {runContent.footer.copyrightName}</p>
        <a
          href={runContent.photos.follow.href}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit font-bold underline decoration-[3px] underline-offset-4"
        >
          {runContent.photos.follow.label}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </footer>
  );
}
