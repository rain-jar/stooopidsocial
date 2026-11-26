"use client";

import Image from "next/image";
import Script from "next/script";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import DescriptionEditor from "./DescriptionEditor";
import EventDateField from "./EventDateField";
import EventTimeField from "./EventTimeField";
import RecurrenceFields from "./RecurrenceFields";

const MAX_INPUT_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_OUTPUT_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2_400;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      theme: "dark";
      action: "event_submission";
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type Props = {
  enabled: boolean;
  turnstileSiteKey?: string;
};

type PrepareResponse = {
  error?: string;
  submissionToken?: string;
  upload?: { path: string; token: string };
};

const inputClass =
  "mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-base text-white outline-none transition placeholder:text-white/35 focus:border-[#ff8065]";

async function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

async function normalizeImage(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }
  if (file.size <= 0 || file.size > MAX_INPUT_IMAGE_BYTES) {
    throw new Error("Choose an image smaller than 15 MB.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image could not be opened. Choose another JPEG, PNG, or WebP image.");
  }
  try {
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("This browser could not process the image.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let blob = await canvasBlob(canvas, 0.86);
    if (blob && blob.size > MAX_OUTPUT_IMAGE_BYTES) blob = await canvasBlob(canvas, 0.68);
    if (!blob || blob.size <= 0 || blob.size > MAX_OUTPUT_IMAGE_BYTES) {
      throw new Error("The processed image is still too large. Choose a smaller image.");
    }
    return new File([blob], "event.webp", { type: "image/webp" });
  } finally {
    bitmap.close();
  }
}

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export default function EventSubmissionDialog({ enabled, turnstileSiteKey }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const imagePreviewRef = useRef("");

  const available = enabled && Boolean(turnstileSiteKey || process.env.NODE_ENV !== "production");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) {
      dialog.close();
      window.setTimeout(() => triggerRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => () => {
    if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
  }, []);

  useEffect(() => {
    if (
      !open ||
      !turnstileSiteKey ||
      !turnstileReady ||
      !window.turnstile ||
      !turnstileContainerRef.current ||
      widgetIdRef.current
    ) {
      return;
    }
    widgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: turnstileSiteKey,
      callback: setTurnstileToken,
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
      theme: "dark",
      action: "event_submission",
    });
  }, [open, turnstileReady, turnstileSiteKey]);

  function resetChallenge() {
    setTurnstileToken("");
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }

  function closeDialog() {
    if (pending) return;
    setOpen(false);
  }

  function selectImage(file: File | null) {
    if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
    const preview = file ? URL.createObjectURL(file) : "";
    imagePreviewRef.current = preview;
    setImage(file);
    setImagePreview(preview);
  }

  async function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!available) return;
    setPending(true);
    setMessage("");
    setSuccess(false);

    try {
      const formData = new FormData(event.currentTarget);
      const processedImage = image ? await normalizeImage(image) : null;
      const prepareResponse = await fetch("/api/event-submissions/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstileToken,
          website: stringValue(formData, "website"),
          hasImage: Boolean(processedImage),
          imageType: processedImage?.type,
          imageSize: processedImage?.size,
        }),
      });
      const prepared = (await prepareResponse.json()) as PrepareResponse;
      if (!prepareResponse.ok || !prepared.submissionToken) {
        throw new Error(prepared.error || "Unable to prepare the submission.");
      }

      if (processedImage && prepared.upload) {
        const { error } = await getBrowserSupabaseClient()
          .storage
          .from("event-images")
          .uploadToSignedUrl(
            prepared.upload.path,
            prepared.upload.token,
            processedImage,
            { contentType: "image/webp", upsert: false },
          );
        if (error) throw new Error("The image upload failed. Please try again.");
      } else if (processedImage) {
        throw new Error("The image upload could not be prepared.");
      }

      const finalizeResponse = await fetch("/api/event-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionToken: prepared.submissionToken,
          event: {
            name: stringValue(formData, "name"),
            description: stringValue(formData, "description"),
            startDate: stringValue(formData, "startDate"),
            startTime: stringValue(formData, "startTime"),
            endDate: stringValue(formData, "endDate"),
            endTime: stringValue(formData, "endTime"),
            recurring: formData.get("recurring") === "on",
            recurrenceFrequency: stringValue(formData, "recurrenceFrequency"),
            recurrenceWeekdays: formData.getAll("recurrenceWeekdays"),
            recurrenceEndType: stringValue(formData, "recurrenceEndType"),
            recurrenceEndDate: stringValue(formData, "recurrenceEndDate"),
            recurrenceCount: stringValue(formData, "recurrenceCount"),
            venue: stringValue(formData, "venue"),
            address: stringValue(formData, "address"),
            rsvpUrl: stringValue(formData, "rsvpUrl"),
            imageAlt: stringValue(formData, "imageAlt"),
            organizerName: stringValue(formData, "organizerName"),
            organizerType: stringValue(formData, "organizerType"),
          },
        }),
      });
      const finalized = (await finalizeResponse.json()) as { error?: string; ok?: boolean };
      if (!finalizeResponse.ok || !finalized.ok) {
        throw new Error(finalized.error || "Unable to submit the event.");
      }

      formRef.current?.reset();
      setFormVersion((version) => version + 1);
      selectImage(null);
      setSuccess(true);
      setMessage("Event submitted for review. It is not live yet.");
      resetChallenge();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit the event.");
      resetChallenge();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {turnstileSiteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setTurnstileReady(true)}
        />
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setMessage("");
          setSuccess(false);
          setOpen(true);
        }}
        className="board-add shrink-0 rounded-sm px-4 py-3 text-[.9375rem] font-bold"
      >
        Add Your Event
      </button>

      <dialog
        ref={dialogRef}
        className="event-dialog board-dialog"
        aria-label="Submit an event"
        onCancel={(cancelEvent) => {
          cancelEvent.preventDefault();
          closeDialog();
        }}
      >
        <div className="event-modal-panel relative bg-[#11120f] text-white">
          <button
            type="button"
            onClick={closeDialog}
            disabled={pending}
            aria-label="Close event submission"
            className="sticky left-full top-3 z-20 mr-3 grid size-11 place-items-center rounded-full border border-white/15 bg-black/70 text-xl text-white backdrop-blur hover:bg-black/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8065]"
          >
            ×
          </button>

          <form ref={formRef} onSubmit={submitEvent} className="board-dialog-copy -mt-7 space-y-5 p-5 pb-8 md:p-8">
            <div className="pr-12">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#ff8065]">
                Community submission
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Add your event</h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Submit the details below. Every event is reviewed before it appears publicly.
              </p>
            </div>

            {!available ? (
              <p role="alert" className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-amber-100">
                Event submissions are temporarily unavailable.
              </p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm sm:col-span-2">
                    Event name
                    <input name="name" required maxLength={160} className={inputClass} />
                  </label>
                  <EventDateField name="startDate" label="Start date" required className={inputClass} />
                  <EventTimeField key={`start-${formVersion}`} name="startTime" label="Start time" required className={inputClass} />
                  <EventDateField name="endDate" label="End date" optional minFrom="startDate" className={inputClass} />
                  <EventTimeField key={`end-${formVersion}`} name="endTime" label="End time" optional className={inputClass} />
                  <RecurrenceFields key={`recurrence-${formVersion}`} className={inputClass} />
                  <label className="text-sm sm:col-span-2">
                    Venue
                    <input name="venue" required maxLength={240} className={inputClass} />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    Address <span className="text-white/50">(optional)</span>
                    <input name="address" maxLength={400} className={inputClass} />
                  </label>
                  <div className="grid gap-3 sm:col-span-2">
                    <label className="text-sm">
                      Your name <span className="text-white/50">(optional)</span>
                      <input
                        name="organizerName"
                        maxLength={40}
                        autoComplete="nickname"
                        placeholder="First name or nickname"
                        className={inputClass}
                      />
                    </label>
                    <fieldset>
                      <legend className="sr-only">Organizing or sharing</legend>
                      <div className="flex flex-wrap gap-3">
                        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/15 px-3 text-sm">
                          <input type="radio" name="organizerType" value="member" defaultChecked className="size-4 accent-[#ff8065]" />
                          Organizing
                        </label>
                        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/15 px-3 text-sm">
                          <input type="radio" name="organizerType" value="shared" className="size-4 accent-[#ff8065]" />
                          Sharing
                        </label>
                      </div>
                    </fieldset>
                  </div>
                  <DescriptionEditor key={`description-${formVersion}`} name="description" className={inputClass} />
                  <label className="text-sm sm:col-span-2">
                    RSVP link <span className="text-white/50">(optional)</span>
                    <input name="rsvpUrl" type="url" maxLength={2048} className={inputClass} />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    Event image <span className="text-white/50">(optional; JPEG, PNG, or WebP)</span>
                    <input
                      name="image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:font-semibold file:text-black`}
                      onChange={(changeEvent) => selectImage(changeEvent.target.files?.[0] ?? null)}
                    />
                  </label>
                  {image ? (
                    <div className="grid gap-4 sm:col-span-2 sm:grid-cols-[12rem_1fr] sm:items-center">
                      {imagePreview ? (
                        <Image
                          src={imagePreview}
                          alt="Selected event image preview"
                          width={384}
                          height={240}
                          unoptimized
                          className="aspect-[8/5] w-full rounded-xl border border-white/10 object-cover"
                        />
                      ) : null}
                      <label className="text-sm">
                        Image description
                        <input
                          name="imageAlt"
                          required
                          maxLength={300}
                          placeholder="Describe the meaningful content of the image"
                          className={inputClass}
                        />
                      </label>
                    </div>
                  ) : null}
                </div>

                <label className="absolute -left-[9999px]" aria-hidden="true">
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>

                {turnstileSiteKey ? <div ref={turnstileContainerRef} /> : null}

                <p className="text-xs leading-5 text-white/50">
                  If approved, the event details and image become public and may be saved or shared by visitors.
                </p>

                <button
                  type="submit"
                  disabled={pending || Boolean(turnstileSiteKey && !turnstileToken)}
                  className="min-h-12 w-full rounded-xl bg-white px-5 font-semibold text-neutral-950 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8065]"
                >
                  {pending ? "Submitting…" : "Submit for review"}
                </button>
              </>
            )}

            <p
              role={success ? "status" : "alert"}
              aria-live="polite"
              className={`min-h-6 text-center text-sm ${success ? "text-emerald-200" : "text-red-200"}`}
            >
              {message}
            </p>
          </form>
        </div>
      </dialog>
    </>
  );
}
