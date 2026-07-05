import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/admin";

const DASHBOARD_ROLE_PREFIX: Record<string, string> = {
  consultant: "CONSULTANT",
  organization: "ORGANIZATION",
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!path.startsWith("/dashboard")) {
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const segment = path.split("/")[2]; // dashboard/<segment>

  if (segment === "admin") {
    if (!isAdminEmail(user.email ?? "")) {
      return NextResponse.redirect(new URL("/403", request.url));
    }
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const expectedRole = DASHBOARD_ROLE_PREFIX[segment];
  if (!expectedRole || profile?.role !== expectedRole) {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
