import { createClient } from "@/lib/supabase/server";
import { toggleProfileActive } from "./actions";
import { getChangelogEntries } from "@/lib/changelog";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, role, is_active")
    .order("created_at", { ascending: false });

  const changelog = getChangelogEntries();

  async function handleToggle(userId: string, isActive: boolean) {
    "use server";
    await toggleProfileActive(userId, isActive);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-semibold mb-8">Admin: all profiles</h1>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2">Active</th>
            <th className="py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {(profiles ?? []).map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.name}</td>
              <td className="py-2">{p.email}</td>
              <td className="py-2">{p.role}</td>
              <td className="py-2">{p.is_active ? "Yes" : "No"}</td>
              <td className="py-2">
                <form action={handleToggle.bind(null, p.id, !p.is_active)}>
                  <button type="submit" className="underline">
                    {p.is_active ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Recent updates</h2>
        {changelog.map((entry) => (
          <div key={entry.date} className="mb-6">
            <h3 className="text-sm font-medium text-slate-500">
              {entry.date}
            </h3>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {entry.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
