import { signup } from "./actions";

export default function SignupPage() {
  async function handleSignup(formData: FormData) {
    "use server";
    await signup(formData);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Create your OrgDev account</h1>
      <form action={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
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
            minLength={8}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <fieldset>
          <legend className="block text-sm font-medium">I am a...</legend>
          <label className="mr-4">
            <input type="radio" name="role" value="CONSULTANT" defaultChecked /> Consultant
          </label>
          <label>
            <input type="radio" name="role" value="ORGANIZATION" /> Organization
          </label>
        </fieldset>
        <button
          type="submit"
          className="w-full rounded bg-slate-900 px-4 py-2 text-white"
        >
          Sign up
        </button>
      </form>
    </main>
  );
}
