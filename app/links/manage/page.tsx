import type { Metadata } from "next";
import { getAdminSession, csrfToken } from "@/lib/links/auth";
import { getAllLinkContent } from "@/lib/links/repository";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Manage links | Les Stooopids", robots: { index: false, follow: false } };

type SearchParams = Promise<{ error?: string; success?: string }>;
const inputClass = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-orange-400";
const buttonClass = "min-h-10 rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-orange-400";

export default async function ManageLinksPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await getAdminSession();
  if (!session) {
    return <main className="min-h-dvh bg-slate-950 px-5 py-16 text-white"><div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-7"><p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Les Stooopids</p><h1 className="mt-2 text-3xl font-bold">Manage links</h1><p className="mt-2 text-white/65">Enter the shared administrator passcode.</p><LoginForm error={params.error === "invalid" ? "The passcode is incorrect." : params.error === "limited" ? "Too many attempts. Try again later." : undefined} /></div></main>;
  }

  let content;
  try { content = await getAllLinkContent(); }
  catch { return <main className="min-h-dvh bg-slate-950 px-5 py-16 text-white"><div className="mx-auto max-w-2xl"><h1 className="text-3xl font-bold">Manage links</h1><p className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4">Management data is temporarily unavailable.</p></div></main>; }
  const csrf = csrfToken(session);

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400">Les Stooopids</p><h1 className="mt-1 text-3xl font-bold">Manage links</h1><a href="/links" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-white/60 underline hover:text-white">View public page ↗</a></div>
          <form action="/links/manage/logout" method="post"><input type="hidden" name="csrf" value={csrf}/><button className={buttonClass}>Log out</button></form>
        </header>
        {params.success && <p role="status" className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">Changes saved.</p>}
        {params.error && <p role="alert" className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">That change could not be saved. Check the fields and try again.</p>}

        <section className="mt-9 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-xl font-bold">Add category</h2>
          <form action="/links/manage/actions" method="post" className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input type="hidden" name="csrf" value={csrf}/><input type="hidden" name="action" value="create-category"/>
            <label className="text-sm">Name<input name="name" required maxLength={80} className={`${inputClass} mt-1`}/></label>
            <label className="text-sm">Slug<input name="slug" required maxLength={80} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={`${inputClass} mt-1`}/></label>
            <button className={`${buttonClass} self-end bg-orange-400 text-slate-950 hover:bg-orange-300`}>Add</button>
          </form>
        </section>

        <div className="mt-8 space-y-6">
          {content.categories.map((category) => {
            const categoryLinks = content.links.filter((link) => link.category_id === category.id);
            return <section key={category.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <form action="/links/manage/actions" method="post" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <input type="hidden" name="csrf" value={csrf}/><input type="hidden" name="action" value="update-category"/><input type="hidden" name="id" value={category.id}/>
                <label className="text-sm">Category name<input name="name" defaultValue={category.name} required maxLength={80} className={`${inputClass} mt-1`}/></label>
                <label className="text-sm">Slug<input name="slug" defaultValue={category.slug} required maxLength={80} className={`${inputClass} mt-1`}/></label>
                <div className="flex items-end gap-2"><label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name="is_visible" defaultChecked={category.is_visible}/> Published</label><button className={buttonClass}>Save</button></div>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["up", "down"] as const).map((direction) => <form key={direction} action="/links/manage/actions" method="post"><input type="hidden" name="csrf" value={csrf}/><input type="hidden" name="action" value="reorder-category"/><input type="hidden" name="id" value={category.id}/><input type="hidden" name="direction" value={direction}/><button className={buttonClass} aria-label={`Move ${category.name} ${direction}`}>{direction === "up" ? "↑ Up" : "↓ Down"}</button></form>)}
                <details className="ml-auto"><summary className="cursor-pointer rounded-lg px-3 py-2 text-sm text-red-300">Delete…</summary><form action="/links/manage/actions" method="post" className="mt-2 flex items-center gap-2"><input type="hidden" name="csrf" value={csrf}/><input type="hidden" name="action" value="delete-category"/><input type="hidden" name="id" value={category.id}/><label className="text-xs"><input type="checkbox" name="confirm" required className="mr-1"/>Also delete its links</label><button className={`${buttonClass} border-red-400/30 text-red-300`}>Confirm</button></form></details>
              </div>

              <div className="mt-6 space-y-3">
                {categoryLinks.map((link) => <div key={link.id} className="rounded-xl border border-white/10 bg-black/15 p-4">
                  <form action="/links/manage/actions" method="post" className="grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="csrf" value={csrf}/><input type="hidden" name="action" value="update-link"/><input type="hidden" name="id" value={link.id}/>
                    <label className="text-sm">Title<input name="title" defaultValue={link.title} required maxLength={180} className={`${inputClass} mt-1`}/></label>
                    <label className="text-sm">URL<input name="url" type="url" defaultValue={link.url} required maxLength={2048} className={`${inputClass} mt-1`}/></label>
                    <label className="text-sm">Icon token or emoji<input name="icon" defaultValue={link.icon ?? ""} maxLength={24} className={`${inputClass} mt-1`}/></label>
                    <label className="text-sm">Category<select name="category_id" defaultValue={link.category_id} className={`${inputClass} mt-1`}>{content.categories.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
                    <div className="flex flex-wrap items-center gap-2 sm:col-span-2"><label className="mr-auto flex items-center gap-2 text-sm"><input type="checkbox" name="is_visible" defaultChecked={link.is_visible}/> Published</label><button className={buttonClass}>Save link</button></div>
                  </form>
                  <div className="mt-2 flex gap-2">{(["up", "down"] as const).map((direction) => <form key={direction} action="/links/manage/actions" method="post"><input type="hidden" name="csrf" value={csrf}/><input type="hidden" name="action" value="reorder-link"/><input type="hidden" name="id" value={link.id}/><input type="hidden" name="direction" value={direction}/><button className={buttonClass} aria-label={`Move ${link.title} ${direction}`}>{direction === "up" ? "↑" : "↓"}</button></form>)}<details className="ml-auto"><summary className="cursor-pointer px-2 py-2 text-sm text-red-300">Delete…</summary><form action="/links/manage/actions" method="post" className="mt-2 flex gap-2"><input type="hidden" name="csrf" value={csrf}/><input type="hidden" name="action" value="delete-link"/><input type="hidden" name="id" value={link.id}/><label className="text-xs"><input type="checkbox" name="confirm" required className="mr-1"/>Confirm</label><button className={`${buttonClass} border-red-400/30 text-red-300`}>Delete</button></form></details></div>
                </div>)}
              </div>

              <details className="mt-5 rounded-xl border border-dashed border-white/15 p-4"><summary className="cursor-pointer font-semibold">Add link to {category.name}</summary><form action="/links/manage/actions" method="post" className="mt-4 grid gap-3 sm:grid-cols-2"><input type="hidden" name="csrf" value={csrf}/><input type="hidden" name="action" value="create-link"/><input type="hidden" name="category_id" value={category.id}/><label className="text-sm">Title<input name="title" required maxLength={180} className={`${inputClass} mt-1`}/></label><label className="text-sm">URL<input name="url" type="url" required maxLength={2048} className={`${inputClass} mt-1`}/></label><label className="text-sm">Icon token or emoji<input name="icon" maxLength={24} className={`${inputClass} mt-1`}/></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_visible" defaultChecked/> Published</label><button className={`${buttonClass} bg-orange-400 text-slate-950 hover:bg-orange-300 sm:col-span-2`}>Add link</button></form></details>
            </section>;
          })}
        </div>
      </div>
    </main>
  );
}
