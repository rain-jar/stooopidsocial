import { notFound } from "next/navigation";
import ManagedEventList from "@/components/events/ManagedEventList";
import { ADMIN_EVENT_PREVIEW_NOW, adminEventFixtures } from "@/lib/events/admin-event-fixtures";

export const dynamic = "force-dynamic";
export const robots = { index: false, follow: false };

export default function ManageEventsPreviewPage() {
  if (process.env.EVENT_ADMIN_PREVIEW !== "true") notFound();

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Les Stooopids</p>
        <h1 className="mt-1 text-3xl font-bold">Manage events</h1>
        <p className="mt-2 text-sm text-white/50">Preview with fixture data. Not a live admin page.</p>
        <ManagedEventList events={adminEventFixtures} csrf="preview" now={ADMIN_EVENT_PREVIEW_NOW} />
      </div>
    </main>
  );
}
