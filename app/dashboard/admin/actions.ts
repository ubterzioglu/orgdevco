"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

export async function toggleProfileActive(
  userId: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email ?? "")) {
    return { error: "Not authorized" };
  }

  // RLS's profiles_update_own policy only allows a user to update their
  // own row, so activating/deactivating other users' profiles requires
  // the service-role client to bypass RLS. This is safe here because the
  // isAdminEmail check above has already gated access before this client
  // is ever created.
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/consultants");
  revalidatePath("/organizations");
  return {};
}
