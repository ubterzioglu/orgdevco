import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ConsultantCard from "@/components/profile/ConsultantCard";

export const metadata: Metadata = {
  title: "Consultants & Coaches",
  description:
    "Browse vetted consultants and coaches available on OrgDev, searchable by expertise, language, and location.",
};

export default async function ConsultantsPage() {
  const supabase = await createClient();
  const { data: consultants } = await supabase
    .from("consultant_profiles")
    .select("title, bio, expertise, location, profiles(name)")
    .order("updated_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-2xl font-semibold mb-8">Consultants & Coaches</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(consultants ?? []).map((c, i) => (
          <ConsultantCard
            key={i}
            name={(c.profiles as unknown as { name: string })?.name ?? "Unknown"}
            title={c.title}
            bio={c.bio}
            expertise={c.expertise}
            location={c.location}
          />
        ))}
      </div>
    </main>
  );
}
