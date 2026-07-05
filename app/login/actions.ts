import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";

export function validateLoginForm(formData: FormData) {
  return loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function login(formData: FormData): Promise<{ error?: string }> {
  "use server";

  const parsed = validateLoginForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: error.message };
  }

  redirect("/");
}
