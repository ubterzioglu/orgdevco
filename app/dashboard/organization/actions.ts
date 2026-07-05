import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { organizationProfileSchema } from "@/lib/validation/profile";

export function validateOrganizationProfileForm(formData: FormData) {
  return organizationProfileSchema.safeParse({
    industry: formData.get("industry"),
    description: formData.get("description"),
    location: formData.get("location") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
  });
}

export async function saveOrganizationProfile(
  formData: FormData
): Promise<{ error?: string }> {
  "use server";

  const parsed = validateOrganizationProfileForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("organization_profiles")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id" });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/organization");
  revalidatePath("/organizations");
  return {};
}
