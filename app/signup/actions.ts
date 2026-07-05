import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation/auth";

export function validateSignupForm(formData: FormData) {
  return signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    role: formData.get("role"),
  });
}

export async function signup(formData: FormData): Promise<{ error?: string }> {
  "use server";

  const parsed = validateSignupForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password, name, role } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) {
    return { error: error?.message ?? "Signup failed" };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    email,
    name,
    role,
  });
  if (profileError) {
    return { error: profileError.message };
  }

  redirect(role === "CONSULTANT" ? "/dashboard/consultant" : "/dashboard/organization");
}
