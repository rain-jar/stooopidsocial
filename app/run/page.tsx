import type { Metadata } from "next";
import Image from "next/image";
import Rolodex from "@/components/run/Rolodex";
import RunDuck from "@/components/run/RunDuck";
import RunFooter from "@/components/run/RunFooter";
import RunHeader from "@/components/run/RunHeader";
import RunLink from "@/components/run/RunLink";
import { runContent } from "@/data/run";

export const metadata: Metadata = {
  title: runContent.meta.title,
  description: runContent.meta.description,
};

export default function RunPage() {
  const { hero, sunday, faqs, pacing, photos, duck } = runContent;

  return (
    <div className="run-content relative">
      <RunHeader />
      <main>
        <div className="run-tone-light">
        <section className="run-section run-section-hero" data-run-section="0" aria-labelledby="run-hero-title">
          <div className="run-hero-copy pt-8 pb-2">
            <h1 id="run-hero-title" className="text-4xl font-bold tracking-tight">
              {hero.title}
            </h1>
            <p className="mt-3 text-lg font-bold">{hero.lede}</p>
            <p className="mt-3">{hero.note}</p>
          </div>
          <div className="run-hero-stage" data-duck-stage>
            <Image
              src={duck.frames.start.src}
              alt={duck.alt.start}
              width={duck.frames.start.width}
              height={duck.frames.start.height}
              preload
              unoptimized
              className="run-duck-static-start"
            />
            <Image
              src={duck.frames.rest.src}
              alt={duck.alt.rest}
              width={duck.frames.rest.width}
              height={duck.frames.rest.height}
              unoptimized
              className="run-duck-static-rest"
            />
            <p className="run-scroll-cue">{hero.scrollCue}</p>
          </div>
        </section>

        <section className="run-section py-8" data-run-section="1" id={sunday.id} aria-labelledby="run-sunday-title">
          <div className="run-copy">
            <p className="text-sm font-bold tracking-wide">{sunday.kicker}</p>
            <h2 id="run-sunday-title" className="mt-2 text-3xl font-bold tracking-tight">
              {sunday.title}
            </h2>
            <ul className="mt-4 space-y-2">
              {sunday.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <p className="mt-4">{sunday.note}</p>
            <div className="run-cta mt-6">
              <RunLink href={sunday.cta.href} external>
                {sunday.cta.label}
              </RunLink>
            </div>
          </div>
        </section>

        <section className="run-section py-8" data-run-section="2" id={faqs.id} aria-labelledby="run-faq-title">
          <div className="run-copy">
            <h2 id="run-faq-title" className="text-3xl font-bold tracking-tight">
              {faqs.title}
            </h2>
            <p className="mt-3">{faqs.intro}</p>
            <ul className="run-stack mt-5">
              {faqs.items.map((item) => (
                <li key={item.question}>
                  <details className="run-card run-faq">
                    <summary>
                      <span>{item.question}</span>
                      <span className="run-faq-icon" aria-hidden="true" />
                    </summary>
                    <p>{item.answer}</p>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </section>
        </div>

        <div className="run-tone-dark">
        <section className="run-section py-8" data-run-section="3" id={pacing.id} aria-labelledby="run-pacing-title">
          <div className="run-copy">
            <h2 id="run-pacing-title" className="text-3xl font-bold tracking-tight">
              {pacing.title}
            </h2>
            <p className="mt-3">{pacing.body}</p>
            <div className="run-cta mt-6">
              <RunLink href={pacing.cta.href} external>
                {pacing.cta.label}
              </RunLink>
            </div>
          </div>
        </section>

        <section className="run-section py-8" data-run-section="4" id={photos.id} aria-labelledby="run-photos-title">
          <div className="run-copy">
            <h2 id="run-photos-title" className="text-3xl font-bold tracking-tight">
              {photos.title}
            </h2>
            <p className="mt-3">{photos.intro}</p>
            <div className="mt-5">
              <Rolodex />
            </div>
          </div>
        </section>
        </div>
      </main>
      <RunFooter />
      <RunDuck />
    </div>
  );
}
