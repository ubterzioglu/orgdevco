import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          OrgDev — the AI-powered organizational and career development
          platform
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">
          Connecting organizations with vetted coaches and consultants
          worldwide, backed by intelligent matching.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded bg-slate-900 px-6 py-3 text-white"
          >
            Get started
          </Link>
          <Link href="/consultants" className="rounded border px-6 py-3">
            Browse consultants
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-16 sm:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold">For Consultants & Coaches</h2>
          <p className="mt-2 text-sm text-slate-600">
            Build your profile, offer one-on-one sessions, and reach
            organizations looking for your expertise.
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold">For Organizations</h2>
          <p className="mt-2 text-sm text-slate-600">
            Post your development needs — from leadership training to
            cultural change — and get matched with the right expertise.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="rounded-lg border-2 border-dashed p-8 text-center">
          <h2 className="text-xl font-semibold">
            Coming soon: your AI Digital Twin
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            A future release will let consultants activate an AI assistant
            that understands their methods and style, available to clients
            around the clock.
          </p>
        </div>
      </section>
    </main>
  );
}
