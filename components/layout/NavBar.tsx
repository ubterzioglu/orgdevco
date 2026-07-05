import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold">
          OrgDev
        </Link>
        <div className="flex gap-6 text-sm">
          <Link href="/consultants">Consultants</Link>
          <Link href="/organizations">Organizations</Link>
          <Link href="/login">Log in</Link>
          <Link
            href="/signup"
            className="rounded bg-slate-900 px-4 py-2 text-white"
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  );
}
