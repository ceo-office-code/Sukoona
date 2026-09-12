import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { checked, COOKIE, db, hash } from "./server";
export async function loginClient() {
  const jar = await cookies();
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: "sukoona-pkce",
        storage: {
          getItem: (key: string) =>
            key.endsWith("-code-verifier") ? jar.get(key)?.value || null : null,
          setItem: (key: string, value: string) => {
            if (key.endsWith("-code-verifier"))
              jar.set(key, value, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/api/admin/auth",
                maxAge: 3600,
              });
          },
          removeItem: (key: string) => {
            if (key.endsWith("-code-verifier"))
              jar.set(key, "", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/api/admin/auth",
                maxAge: 0,
              });
          },
        },
      },
    },
  );
}
export async function createSession(id: string) {
  const session = randomBytes(32).toString("hex");
  checked(
    await db()
      .from("crm_sessions")
      .insert({
        token_hash: hash(session),
        member_id: id,
        expires_at: new Date(Date.now() + 12 * 3600000).toISOString(),
      }),
  );
  (await cookies()).set(COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 12 * 3600,
  });
}
