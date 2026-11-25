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
        <header className="board-heading">
          <h1 className="board-letters" aria-label="Stooopid">
            {Array.from("Stooopid", (letter, index) => (
              <span className="board-letter board-pinned" aria-hidden="true" key={index}>{letter}</span>
            ))}
          </h1>
          <p className="board-title">Community Calendar</p>
        </header>

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


