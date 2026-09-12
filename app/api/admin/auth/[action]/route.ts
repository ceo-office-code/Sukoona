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
import { createSession, loginClient } from "@/lib/crm/auth";
import { email, InputError, text } from "@/lib/crm/validation";
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
    if (action !== "request") throw new InputError("Not found.", 404);
    const address = email(b.email, true);
    await rate(req, "auth-ip", 12, 3600);
    await rate(req, "auth-request", 3, 3600, address);
    const m = checked(
      await client
        .from("crm_members")
        .select("id")
        .eq("email", address)
        .eq("active", true)
        .maybeSingle(),
    );
    if (m) {
      const auth = await loginClient();
      const result = await auth.auth.signInWithOtp({
        email: address,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: new URL(
            "/api/admin/auth/callback",
            req.url,
          ).toString(),
        },
      });
      if (result.error)
        throw new InputError(
          "We could not send a sign-in link. Please try again later.",
          503,
        );
    }
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function GET(req: Request, { params }: Context) {
  const base = new URL(req.url).origin;
  try {
    if ((await params).action !== "callback")
      throw new InputError("Not found.", 404);
    await rate(req, "auth-callback", 25, 3600);
    const p = new URL(req.url).searchParams,
      code = text(p.get("code"), 300, true),
      flowId = p.get("sb_flow_id");
    const auth = await loginClient(),
      result = await auth.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined,
      );
    if (result.error || !result.data.user?.email)
      throw new InputError("Invalid sign-in link.", 401);
    const m = checked(
      await db()
        .from("crm_members")
        .select("id")
        .eq("email", result.data.user.email.toLowerCase())
        .eq("active", true)
        .maybeSingle(),
    );
    if (!m) throw new InputError("Access denied.", 403);
    await createSession(m.id);
    return Response.redirect(base + "/admin", 303);
  } catch {
    return Response.redirect(base + "/admin?login=expired", 303);
  }
}
