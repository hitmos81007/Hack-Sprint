import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = z.string().min(1).max(2048).safeParse(request.nextUrl.searchParams.get("code"));
  let target = "/login?error=callback";
  if (code.success) {
    try {
      const client = await createClient(true);
      const { error } = await client.auth.exchangeCodeForSession(code.data);
      if (!error) target = "/dashboard";
    } catch { /* Generic error only; never echo the code or provider details. */ }
  }
  const response = NextResponse.redirect(new URL(target, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
