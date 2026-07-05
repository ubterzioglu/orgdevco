import { createClient } from "@/lib/supabase/server";
import { saveOrganizationProfile } from "./actions";

export default async function OrganizationDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("organization_profiles")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  async function handleSave(formData: FormData) {
    "use server";
    await saveOrganizationProfile(formData);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Your organization profile</h1>
      <form action={handleSave} className="space-y-4">
        <div>
          <label htmlFor="industry" className="block text-sm font-medium">
            Industry
          </label>
          <input
            id="industry"
            name="industry"
            defaultValue={profile?.industry ?? ""}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={profile?.description ?? ""}
            required
            rows={4}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium">
            Location
          </label>
          <input
            id="location"
            name="location"
            defaultValue={profile?.location ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="logoUrl" className="block text-sm font-medium">
            Logo URL
          </label>
          <input
            id="logoUrl"
            name="logoUrl"
            defaultValue={profile?.logo_url ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-slate-900 px-4 py-2 text-white"
        >
          Save profile
        </button>
      </form>
    </main>
  );
}
