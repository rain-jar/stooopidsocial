import Image from "next/image";
import DescriptionEditor from "@/components/events/DescriptionEditor";
import EventDateField from "@/components/events/EventDateField";
import EventTimeField from "@/components/events/EventTimeField";
import RecurrenceFields from "@/components/events/RecurrenceFields";
import type { EventRow } from "@/lib/events/repository";
import { groupManagedEvents, type EventSchedule } from "@/lib/events/admin-schedule";
import { suggestedEventSlug } from "@/lib/events/validation";

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

function barDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function statusClass(status?: EventRow["moderation_status"]) {
  if (status === "approved") return "bg-emerald-400/15 text-emerald-200";
  if (status === "rejected") return "bg-red-400/15 text-red-200";
  return "bg-amber-300/15 text-amber-100";
}

type ManagedEventListProps = {
  events: EventRow[];
  csrf: string;
  now?: Date;
};

export default function ManagedEventList({ events, csrf, now = new Date() }: ManagedEventListProps) {
  const groups = groupManagedEvents(events, now);

  return (
    <div className="mt-8 grid gap-8">
      {groups.pending.length ? (
        <section aria-labelledby="pending-heading">
          <h2 id="pending-heading" className="text-sm font-bold uppercase tracking-[0.16em] text-amber-100">
            Pending review
            <span className="ml-2 font-semibold tracking-normal text-white/50">{groups.pending.length}</span>
          </h2>
          <div className="mt-3 grid gap-3">
            {groups.pending.map((item) => (
              <EventBar key={item.event.id} item={item} csrf={csrf} />
            ))}
          </div>
        </section>
      ) : null}

      {groups.upcoming.length ? (
        <section aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-200">
            Upcoming
            <span className="ml-2 font-semibold tracking-normal text-white/50">{groups.upcoming.length}</span>
          </h2>
          <div className="mt-3 grid gap-3">
            {groups.upcoming.map((item) => (
              <EventBar key={item.event.id} item={item} csrf={csrf} />
            ))}
          </div>
        </section>
      ) : null}

      {groups.archived.length ? (
        <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <summary className="cursor-pointer list-none text-sm font-bold uppercase tracking-[0.16em] text-white/70 [&::-webkit-details-marker]:hidden">
            Archived
            <span className="ml-2 font-semibold tracking-normal text-white/45">{groups.archived.length}</span>
          </summary>
          <div className="mt-3 grid gap-3">
            {groups.archived.map((item) => (
              <EventBar key={item.event.id} item={item} csrf={csrf} />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function EventBar({
  item,
  csrf,
}: {
  item: { event: EventRow; schedule: EventSchedule };
  csrf: string;
}) {
  const event = item.event;
  const start = localParts(event.starts_at);
  const end = localParts(event.ends_at);
  const slug = event.slug || suggestedEventSlug(event.name, event.starts_at);
  const organizer = event.organizer_name?.trim();
  const canDelete = item.schedule.isArchived;

  return (
    <details className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]" data-event-id={event.id} data-section={item.schedule.isArchived ? "archived" : event.moderation_status === "pending" ? "pending" : "upcoming"}>
      <summary className="cursor-pointer list-none px-4 py-3 text-left hover:bg-white/[0.04] [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-3">
          <time className="w-[6.5rem] shrink-0 text-xs font-medium tabular-nums text-white/60" dateTime={item.schedule.displayStartsAt}>
            {barDate(item.schedule.displayStartsAt)}
          </time>
          <span className="min-w-0 flex-1 truncate font-semibold">{event.name}</span>
          <span className="hidden min-w-0 shrink-0 items-center gap-1.5 sm:flex">
            {item.schedule.repeats ? <span className="text-[0.65rem] font-medium uppercase tracking-wide text-white/40">Repeats</span> : null}
            {event.event_status ? (
              <span className="rounded-full bg-white/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white/70">
                {event.event_status}
              </span>
            ) : null}
            <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide ${statusClass(event.moderation_status)}`}>
              {event.moderation_status}
            </span>
            {organizer ? (
              <span className="max-w-[6.5rem] truncate text-xs text-white/55" title={organizer}>
                {organizer}
              </span>
            ) : null}
          </span>
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-[6.5rem] sm:hidden">
          {item.schedule.repeats ? <span className="text-[0.65rem] font-medium uppercase tracking-wide text-white/40">Repeats</span> : null}
          {event.event_status ? (
            <span className="rounded-full bg-white/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white/70">
              {event.event_status}
            </span>
          ) : null}
          <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide ${statusClass(event.moderation_status)}`}>
            {event.moderation_status}
          </span>
          {organizer ? (
            <span className="max-w-[6.5rem] truncate text-xs text-white/55" title={organizer}>
              {organizer}
            </span>
          ) : null}
        </span>
      </summary>

      {event.image_path ? (
        <div className="relative mx-4 mb-3 aspect-[16/9] overflow-hidden rounded-xl bg-black/30 sm:aspect-[21/9]">
          <Image
            src={`/api/admin/event-images/${event.id}`}
            alt={event.image_alt || "Submitted event image"}
            fill
            className="object-cover"
            sizes="(max-width: 767px) 100vw, 1024px"
          />
        </div>
      ) : null}

      <form action="/links/manage/events/actions" method="post" className="grid gap-5 p-5 pt-2">
        <input type="hidden" name="csrf" value={csrf} />
        <input type="hidden" name="id" value={event.id} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-xs text-white/45">
            Submitted {new Date(event.submitted_at || event.updated_at).toLocaleString("en-CA", { timeZone: "America/Toronto" })}
          </p>
          <label className="text-sm">Public slug<input name="slug" defaultValue={slug} required maxLength={120} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={`${inputClass} min-w-64`} /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">Event name<input name="name" defaultValue={event.name} required maxLength={160} className={inputClass} /></label>
          <div className="grid gap-3 sm:col-span-2">
            <label className="text-sm">Your name <span className="text-white/50">(optional; first name, nickname, or crew name)</span><input name="organizerName" defaultValue={event.organizer_name || ""} maxLength={40} placeholder="First name or nickname" className={inputClass} /></label>
            <fieldset>
              <legend className="sr-only">Organizing or sharing</legend>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex min-h-11 items-center gap-2 text-sm"><input type="radio" name="organizerType" value="member" defaultChecked={event.organizer_type !== "shared"} className="size-4 accent-orange-400" /> Organizing</label>
                <label className="inline-flex min-h-11 items-center gap-2 text-sm"><input type="radio" name="organizerType" value="shared" defaultChecked={event.organizer_type === "shared"} className="size-4 accent-orange-400" /> Sharing</label>
              </div>
            </fieldset>
          </div>
          <EventDateField name="startDate" label="Start date" defaultValue={start.date} required className={inputClass} />
          <EventTimeField name="startTime" label="Start time" defaultValue={start.time} required className={inputClass} />
          <EventDateField name="endDate" label="End date" defaultValue={end.date} optional minFrom="startDate" className={inputClass} />
          <EventTimeField name="endTime" label="End time" defaultValue={end.time} optional className={inputClass} />
          <RecurrenceFields
            className={inputClass}
            defaultFrequency={event.recurrence_frequency}
            defaultWeekdays={event.recurrence_weekdays}
            defaultEndDate={event.recurrence_end_date}
            defaultCount={event.recurrence_count}
          />
          <label className="text-sm sm:col-span-2">Venue<input name="venue" defaultValue={event.venue} required maxLength={240} className={inputClass} /></label>
          <label className="text-sm sm:col-span-2">Address<input name="address" defaultValue={event.address || ""} maxLength={400} className={inputClass} /></label>
          <DescriptionEditor name="description" defaultValue={event.description} rows={5} className={inputClass} />
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
        {canDelete ? (
          <form action="/links/manage/events/actions" method="post" className="ml-auto flex items-center gap-2" data-delete-form="">
            <input type="hidden" name="csrf" value={csrf} />
            <input type="hidden" name="id" value={event.id} />
            <input type="hidden" name="action" value="delete" />
            <label className="text-xs"><input type="checkbox" name="confirm" required className="mr-1" />Permanently delete</label>
            <button className={`${buttonClass} border-red-400/30 text-red-200`}>Delete</button>
          </form>
        ) : null}
      </div>
    </details>
  );
}
