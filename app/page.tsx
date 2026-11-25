import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import EventGrid, { EventGridSkeleton } from "@/components/events/EventGrid";
import EventSubmissionDialog from "@/components/events/EventSubmissionDialog";
import { eventSubmissionsEnabled, getEvents } from "@/lib/events/source";

export const revalidate = 300;

export default async function Home() {
  const events = await getEvents();
  const submissionsEnabled = eventSubmissionsEnabled();
  return (
    <>
      <Header />

      <main className="calendar-board">
        <h1 className="board-heading" aria-label="Stooopid Community Calendar">
          <span className="board-letters" aria-hidden="true">
            {Array.from("Stooopid", (letter, index) => (
              <span className="board-letter board-pinned" key={index}>{letter}</span>
            ))}
          </span>
          <span className="board-title" aria-hidden="true">Community Calendar</span>
        </h1>

      <section className="mx-auto mt-8 w-full max-w-[1140px]">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="board-section-title">
              Upcoming stooopidities
            </h2>
          </div>
          <EventSubmissionDialog
            enabled={submissionsEnabled}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          />
        </div>
        <Suspense fallback={<EventGridSkeleton />}>
          <EventGrid events={events} renderedAt={new Date().toISOString()} />
        </Suspense>
      </section>

      </main>

      <Footer />

    </>
  );
}


