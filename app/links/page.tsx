import type { Metadata } from "next";
import Image from "next/image";
import LinkIcon from "@/components/links/LinkIcon";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getPublicLinkCategories } from "@/lib/links/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stooopid Run Crew | Links",
  description: "Home of the Stooopid Crew. Sundays at 10 AM at Café Tranquille.",
};

export default async function LinksPage() {
  let categories;
  try {
    categories = await getPublicLinkCategories();
  } catch {
    categories = null;
  }

  return (
    <>
      <Header />
      <main className="min-h-dvh bg-[#1B3F72] px-5 py-10 text-[#EF9F27] sm:py-14">
      <div className="mx-auto flex w-full max-w-[580px] flex-col items-center">
        <Image src="/links/stooopid-crew.jpeg" alt="Stooopid Run Crew" width={104} height={104} priority className="h-24 w-24 rounded-full border-2 border-[#EF9F27]/35 object-cover shadow-lg sm:h-[104px] sm:w-[104px]" />
        <h1 className="mt-5 text-center text-2xl font-bold tracking-tight">Stooopid Run Crew</h1>
        <div className="mt-3 space-y-1 text-center text-[15px] font-medium leading-6">
          <p>Home of the Stooopid Crew.</p>
          <p>Sundays - 10 AM @ Café Tranquille.</p>
          <p>Be good. Be kind. Be stooopid.</p>
        </div>

        <nav aria-label="Stooopid Run Crew social profiles" className="mt-5 flex items-center gap-5">
          <a href="https://instagram.com/stooopidcrew" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full p-2 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#EF9F27]">
            <LinkIcon name="instagram" className="h-6 w-6" />
          </a>
          <a href="mailto:lesstooopids@gmail.com" aria-label="Email Stooopid Run Crew" className="rounded-full p-2 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#EF9F27]">
            <LinkIcon name="mail" className="h-6 w-6" />
          </a>
        </nav>

        {categories === null ? (
          <div role="status" className="mt-10 w-full rounded-2xl border border-white/20 bg-white/10 px-5 py-6 text-center text-white">
            Links are temporarily unavailable. Please try again shortly.
          </div>
        ) : categories.length === 0 ? (
          <p className="mt-10 text-center text-sm text-[#EF9F27]/80">New links are coming soon.</p>
        ) : (
          <div className="mt-7 w-full space-y-8">
            {categories.map((category) => category.links.length > 0 && (
              <section key={category.id} aria-labelledby={`category-${category.id}`}>
                <h2 id={`category-${category.id}`} className="mb-3 text-center text-base font-bold">{category.name}</h2>
                <div className="space-y-3">
                  {category.links.map((link) => (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="group grid min-h-14 grid-cols-[28px_1fr_28px] items-center gap-3 rounded-2xl bg-white px-4 py-3 text-center font-semibold text-[#111827] shadow-sm outline-none transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-4 focus-visible:ring-[#EF9F27]/80">
                      <span className="flex justify-center text-[#1B3F72]"><LinkIcon name={link.icon} /></span>
                      <span className="break-words leading-5">{link.title}</span>
                      <span aria-hidden="true" className="text-lg text-[#1B3F72]/50 transition group-hover:translate-x-0.5">↗</span>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      </main>
      <Footer />
    </>
  );
}
