import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import ManagedEventList from "@/components/events/ManagedEventList";
import { getManagedEvents } from "@/lib/events/repository";
import { csrfToken, getAdminSession } from "@/lib/links/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Manage events | Les Stooopids",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ error?: string; success?: string }>;

const buttonClass =
  "min-h-10 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-orange-400";

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
            <ManagedEventList events={events} csrf={csrf} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
