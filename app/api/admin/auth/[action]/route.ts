import { cookies } from "next/headers";
import {
  body,
  checked,
  COOKIE,
  db,
  failure,
  hash,
  json,
  rate,
} from "@/lib/crm/server";
import { createSession } from "@/lib/crm/auth";
import { email, InputError } from "@/lib/crm/validation";
type Context = { params: Promise<{ action: string }> };
export async function POST(req: Request, { params }: Context) {
  try {
    const { action } = await params,
      b = await body(req),
      client = db();
    if (action === "logout") {
      const jar = await cookies(),
        token = jar.get(COOKIE)?.value;
      if (token)
        checked(
          await client
            .from("crm_sessions")
            .delete()
            .eq("token_hash", hash(token)),
        );
      jar.delete(COOKIE);
      return json({ ok: true });
    }
    if (action !== "login") throw new InputError("Not found.", 404);
    const address = email(b.email, true);
    await rate(req, "password-login-ip", 30, 3600);
    await rate(req, "password-login-email", 10, 900, address);
    if (
      typeof b.password !== "string" ||
      !b.password.length ||
      b.password.length > 256
    )
      throw new InputError("Enter your password.");
    // Use a separate auth client: its user token must never replace the database client's server credentials.
    const auth = db();
    const result = await auth.auth.signInWithPassword({
      email: address,
      password: b.password,
    });
    if (
      result.error ||
      !result.data.user?.email ||
      !result.data.user.email_confirmed_at
    )
      throw new InputError(
        "The email or password is incorrect, or this account does not have access.",
        401,
      );
    const m = checked(
      await client
        .from("crm_members")
        .select("id")
        .eq("email", result.data.user.email.toLowerCase())
        .eq("active", true)
        .maybeSingle(),
    );
    if (!m)
      throw new InputError(
        "The email or password is incorrect, or this account does not have access.",
        401,
      );
    await createSession(m.id);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
