import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { checked, COOKIE, db, hash } from "./server";
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
