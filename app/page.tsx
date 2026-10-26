import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import EventGrid, { EventGridSkeleton } from "@/components/events/EventGrid";
import { getEvents } from "@/lib/google-events";

export const revalidate = 300;

export default async function Home() {
  const events = await getEvents();
  return (
    <>
      <Header />

      <main className="pt-10">
        <section className="mx-auto w-full max-w-[1400px] px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Sto🙄opid Calendar
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-xl md:text-lg text-white/70">
          All the times when we are being stooopid!
        </p>
      </section>

      <section className="mx-auto mt-10 w-full max-w-[1400px] px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              Upcoming stooopidities
            </h2>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Add My Event
          </button>
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


