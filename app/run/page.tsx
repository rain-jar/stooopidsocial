import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function RunPage() {
  return (
    <>
      <Header />

      <main className="pt-16">
        <section className="mx-auto w-full max-w-[1400px] px-6 text-center">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
            Run
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-lg md:text-xl text-white/70">
            Weekly runs, training blocks, and community miles.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}