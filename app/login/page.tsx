import { login } from "./actions";

export default function LoginPage() {
  async function handleLogin(formData: FormData) {
    "use server";
    await login(formData);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Log in to OrgDev</h1>
      <form action={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-slate-900 px-4 py-2 text-white"
        >
          Log in
        </button>
      </form>
    </main>
  );
}
