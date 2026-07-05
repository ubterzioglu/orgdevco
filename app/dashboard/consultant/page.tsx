import { createClient } from "@/lib/supabase/server";
import { saveConsultantProfile } from "./actions";

export default async function ConsultantDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("consultant_profiles")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  async function handleSave(formData: FormData) {
    "use server";
    await saveConsultantProfile(formData);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Your consultant profile</h1>
      <form action={handleSave} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            defaultValue={profile?.title ?? ""}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            defaultValue={profile?.bio ?? ""}
            required
            rows={4}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="expertise" className="block text-sm font-medium">
            Expertise (comma-separated)
          </label>
          <input
            id="expertise"
            name="expertise"
            defaultValue={profile?.expertise?.join(", ") ?? ""}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="languages" className="block text-sm font-medium">
            Languages (comma-separated)
          </label>
          <input
            id="languages"
            name="languages"
            defaultValue={profile?.languages?.join(", ") ?? ""}
            required
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
          <label htmlFor="photoUrl" className="block text-sm font-medium">
            Photo URL
          </label>
          <input
            id="photoUrl"
            name="photoUrl"
            defaultValue={profile?.photo_url ?? ""}
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
