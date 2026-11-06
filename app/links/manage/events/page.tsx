import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getManagedEvents } from "@/lib/events/repository";
import { suggestedEventSlug } from "@/lib/events/validation";
import { csrfToken, getAdminSession } from "@/lib/links/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Manage events | Les Stooopids",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ error?: string; success?: string }>;

const inputClass =
  "mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-orange-400";
const buttonClass =
  "min-h-10 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-orange-400";

function localParts(value?: string | null) {
  if (!value) return { date: "", time: "" };
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(value))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

export default async function ManageEventsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getAdminSession();
  if (!session) redirect("/links/manage");
  const params = await searchParams;
  const csrf = csrfToken(session);
  let events;
  try {
    events = await getManagedEvents();
  } catch {
    events = null;
  }

  return (
    <>
      <Header />
      <main className="min-h-dvh bg-slate-950 px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Les Stooopids</p>
              <h1 className="mt-1 text-3xl font-bold">Manage events</h1>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/65">
                <Link href="/links/manage" className="underline hover:text-white">Manage links</Link>
                <Link href="/" target="_blank" className="underline hover:text-white">View calendar ↗</Link>
              </div>
            </div>
            <form action="/links/manage/logout" method="post">
              <input type="hidden" name="csrf" value={csrf} />
              <button className={buttonClass}>Log out</button>
            </form>
          </header>

          {params.success ? (
            <p role="status" className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">
              Event updated.
            </p>
          ) : null}
          {params.error ? (
            <p role="alert" className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
              That change could not be saved. Check the fields and try again.
            </p>
          ) : null}

          {!events ? (
            <p className="mt-8 rounded-xl border border-red-400/30 bg-red-400/10 p-4">
              Event management data is temporarily unavailable.
            </p>
          ) : events.length === 0 ? (
            <p className="mt-8 rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/65">
              No event records yet.
            </p>
          ) : (
            <div className="mt-8 space-y-6">
              {events.map((event) => {
                const start = localParts(event.starts_at);
                const end = localParts(event.ends_at);
                const slug = event.slug || suggestedEventSlug(event.name, event.starts_at);
                return (
                  <article key={event.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                    {event.image_path ? (
                      <div className="relative aspect-[16/7] bg-black/30">
                        <Image
                          src={`/api/admin/event-images/${event.id}`}
                          alt={event.image_alt || "Submitted event image"}
                          fill
                          unoptimized
                          sizes="(max-width: 1024px) 100vw, 900px"
                          className="object-contain"
                        />
                      </div>
                    ) : null}
                    <form action="/links/manage/events/actions" method="post" className="space-y-5 p-5">
                      <input type="hidden" name="csrf" value={csrf} />
                      <input type="hidden" name="id" value={event.id} />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${event.moderation_status === "approved" ? "bg-emerald-400/15 text-emerald-200" : event.moderation_status === "rejected" ? "bg-red-400/15 text-red-200" : "bg-amber-300/15 text-amber-100"}`}>
                            {event.moderation_status}
                          </span>
                          <p className="mt-2 text-xs text-white/45">Submitted {new Date(event.submitted_at || event.updated_at).toLocaleString("en-CA", { timeZone: "America/Toronto" })}</p>
                        </div>
                        <label className="text-sm">
                          Public slug
                          <input name="slug" defaultValue={slug} required maxLength={120} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={`${inputClass} min-w-64`} />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm sm:col-span-2">Event name<input name="name" defaultValue={event.name} required maxLength={160} className={inputClass} /></label>
                        <label className="text-sm">Start date<input name="startDate" type="date" defaultValue={start.date} required className={inputClass} /></label>
                        <label className="text-sm">Start time (Eastern)<input name="startTime" type="time" defaultValue={start.time} required className={inputClass} /></label>
                        <label className="text-sm">End date<input name="endDate" type="date" defaultValue={end.date} className={inputClass} /></label>
                        <label className="text-sm">End time<input name="endTime" type="time" defaultValue={end.time} className={inputClass} /></label>
                        <label className="text-sm sm:col-span-2">Venue<input name="venue" defaultValue={event.venue} required maxLength={240} className={inputClass} /></label>
                        <label className="text-sm sm:col-span-2">Address<input name="address" defaultValue={event.address || ""} maxLength={400} className={inputClass} /></label>
                        <label className="text-sm sm:col-span-2">Description<textarea name="description" defaultValue={event.description} required maxLength={5000} rows={5} className={inputClass} /></label>
                        <label className="text-sm sm:col-span-2">RSVP link<input name="rsvpUrl" type="url" defaultValue={event.rsvp_url || ""} maxLength={2048} className={inputClass} /></label>
                        {event.image_path ? <label className="text-sm sm:col-span-2">Image description<input name="imageAlt" defaultValue={event.image_alt || ""} required maxLength={300} className={inputClass} /></label> : null}
                        <label className="text-sm">Event status<select name="eventStatus" defaultValue={event.event_status || ""} className={inputClass}><option value="">Scheduled</option><option value="postponed">Postponed</option><option value="cancelled">Cancelled</option></select></label>
                        <label className="text-sm">Image position<input name="imagePosition" defaultValue={event.image_position} maxLength={40} className={inputClass} /></label>
                      </div>

                      <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
                        <button name="action" value="update" className={buttonClass}>Save changes</button>
                        {event.moderation_status !== "approved" ? (
                          <button name="action" value="approve" className={`${buttonClass} bg-emerald-400 text-slate-950 hover:bg-emerald-300`}>Approve and publish</button>
                        ) : null}
                      </div>
                    </form>

                    <div className="flex flex-wrap gap-3 border-t border-white/10 p-5">
                      {event.moderation_status !== "rejected" ? (
                        <form action="/links/manage/events/actions" method="post" className="flex items-center gap-2">
                          <input type="hidden" name="csrf" value={csrf} />
                          <input type="hidden" name="id" value={event.id} />
                          <input type="hidden" name="action" value="reject" />
                          <label className="text-xs"><input type="checkbox" name="confirm" required className="mr-1" />Remove image and reject</label>
                          <button className={`${buttonClass} border-amber-300/30 text-amber-100`}>Reject</button>
                        </form>
                      ) : null}
                      <form action="/links/manage/events/actions" method="post" className="ml-auto flex items-center gap-2">
                        <input type="hidden" name="csrf" value={csrf} />
                        <input type="hidden" name="id" value={event.id} />
                        <input type="hidden" name="action" value="delete" />
                        <label className="text-xs"><input type="checkbox" name="confirm" required className="mr-1" />Permanently delete</label>
                        <button className={`${buttonClass} border-red-400/30 text-red-200`}>Delete</button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
