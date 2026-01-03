import Header from "@/components/layout/Header";

export default function Home() {
  return (
    <>
      <Header />

      <main className="pt-10">
        <section className="mx-auto w-full max-w-[1400px] px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Stooopid Calendar
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-xl md:text-lg text-white/70">
          All the times when we are being stooopid!
        </p>
      </section>

      <section className="mx-auto mt-10 w-full max-w-[1400px] px-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6
  shadow-[inset_0_0_0_2px_rgba(93,220,191,0.55),inset_0_0_48px_rgba(93,220,191,0.35)]
,0_0_40px_-10px_rgba(168,85,247,0.45)]">
          <div className="flex h-[400px] items-center justify-center text-sm text-white/50">
            <div className="h-[400px] w-full overflow-hidden rounded-xl">
              <iframe
                src="https://calendar.google.com/calendar/embed?src=62274281b101e29632d38347c35680c899b395a6f07712ff9d33239c2dcda0da%40group.calendar.google.com&ctz=America%2FToronto"
                className="h-full w-full border-0"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
      </main>
    </>
  );
}


