type LinkIconProps = { name: string | null; className?: string };

export default function LinkIcon({ name, className = "h-5 w-5" }: LinkIconProps) {
  if (name === "instagram") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
  }
  if (name === "strava") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor"><path d="m11.4 2-6 11h4.1l1.9-3.5 1.9 3.5h4.1L11.4 2Zm6 11-2 3.7-2-3.7h-3l5 9 5-9h-3Z"/></svg>;
  }
  if (name === "heart") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>;
  }
  if (name === "mail") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
  }
  return name ? <span aria-hidden="true" className="text-lg leading-none">{name}</span> : null;
}
