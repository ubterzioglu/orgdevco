import { createClient } from "@/lib/supabase/server";
import OrganizationCard from "@/components/profile/OrganizationCard";

export default async function OrganizationsPage() {
  const supabase = await createClient();
  const { data: organizations } = await supabase
    .from("organization_profiles")
    .select("industry, description, location, profiles(name)")
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-2xl font-semibold mb-8">Organizations</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(organizations ?? []).map((o, i) => (
          <OrganizationCard
            key={i}
            name={(o.profiles as unknown as { name: string })?.name ?? "Unknown"}
            industry={o.industry}
            description={o.description}
            location={o.location}
          />
        ))}
      </div>
    </main>
  );
}
