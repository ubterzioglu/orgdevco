import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { consultantProfileSchema } from "@/lib/validation/profile";

function splitList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateConsultantProfileForm(formData: FormData) {
  return consultantProfileSchema.safeParse({
    title: formData.get("title"),
    bio: formData.get("bio"),
    expertise: splitList(formData.get("expertise")),
    languages: splitList(formData.get("languages")),
    location: formData.get("location") || undefined,
    photoUrl: formData.get("photoUrl") || undefined,
  });
}

export async function saveConsultantProfile(
  formData: FormData
): Promise<{ error?: string }> {
  "use server";

  const parsed = validateConsultantProfileForm(formData);
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
    .from("consultant_profiles")
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id" });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/consultant");
  revalidatePath("/consultants");
  return {};
}
