import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const DOCTOR_PREFIX = "/dottore";
const ADMIN_PREFIX = "/admin";
const PATIENT_PREFIX = "/area-personale";

export async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsAuth = path.startsWith(DOCTOR_PREFIX) || path.startsWith(ADMIN_PREFIX) || path.startsWith(PATIENT_PREFIX);

  if (needsAuth && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (path.startsWith(DOCTOR_PREFIX) || path.startsWith(ADMIN_PREFIX))) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const role = profile?.role;

    if (path.startsWith(ADMIN_PREFIX) && role !== "superadmin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (path.startsWith(DOCTOR_PREFIX) && role !== "doctor" && role !== "staff" && role !== "superadmin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}
