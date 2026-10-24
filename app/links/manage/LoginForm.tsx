export default function LoginForm({ error }: { error?: string }) {
  return (
    <form action="/links/manage/login" method="post" className="mt-8 space-y-5">
      <div>
        <label htmlFor="passcode" className="mb-2 block text-sm font-medium text-white/80">Shared passcode</label>
        <input id="passcode" name="passcode" type="password" required minLength={12} maxLength={256} autoComplete="current-password" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30" />
      </div>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button type="submit" className="min-h-11 w-full rounded-xl bg-orange-400 px-5 py-3 font-bold text-slate-950 hover:bg-orange-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300">Sign in</button>
    </form>
  );
}
