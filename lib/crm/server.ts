import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createHash, createHmac } from "node:crypto";
import { InputError } from "./validation";
import type { Member } from "./types";
export const COOKIE = "sukoona_admin";
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export function db() {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new InputError(
      "The service is temporarily unavailable. Please try again later.",
      503,
    );
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function checked<T>(result: {
  data: T;
  error: { message: string } | null;
}): T {
  if (result.error) {
    const messages: Record<string, string> = {
      order_contact_mismatch:
        "The order email or customer phone must match this lead.",
      version_conflict: "This lead changed. Refresh it before saving.",
      idempotency_conflict:
        "This request has already been used. Refresh and try again.",
      reason_required: "Add a reason for closing this lead.",
      paid_order_required:
        "A paid, confirmed order is required to mark a lead as won.",
      manager_required: "A manager must make this change.",
      invalid_assignee: "Choose an active team member.",
      not_found: "Record not found.",
      forbidden: "Access denied.",
      note_required: "Add an activity note.",
    };
    for (const [code, message] of Object.entries(messages))
      if (result.error.message.includes(code))
        throw new InputError(message, code === "version_conflict" ? 409 : 422);
    console.error("CRM database request failed.");
    throw new InputError(
      "We could not save or load this information. Please try again.",
      503,
    );
  }
  return result.data;
}
export async function member(): Promise<Member> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    throw new InputError("Please sign in.", 401);
  const client = db();
  const session = checked(
    await client
      .from("crm_sessions")
      .select("member_id")
      .eq("token_hash", hash(token))
      .gt("expires_at", new Date().toISOString())
      .maybeSingle(),
  );
  if (!session)
    throw new InputError("Your session has expired. Please sign in.", 401);
  const m = checked(
    await client
      .from("crm_members")
      .select("id,email,name,role,active")
      .eq("id", session.member_id)
      .eq("active", true)
      .maybeSingle(),
  );
  if (!m) throw new InputError("Access has been disabled.", 401);
  return m as Member;
}
export function manager(m: Member) {
  if (m.role === "agent") throw new InputError("Manager access required.", 403);
}
export function owner(m: Member) {
  if (m.role !== "owner") throw new InputError("Owner access required.", 403);
}
export function origin(req: Request) {
  const o = req.headers.get("origin");
  if (!o || o !== new URL(req.url).origin)
    throw new InputError(
      "Please submit this form from the Sukoona website.",
      403,
    );
}
export async function body(req: Request): Promise<Record<string, unknown>> {
  origin(req);
  if (!req.headers.get("content-type")?.includes("application/json"))
    throw new InputError("JSON required.", 415);
  const reader = req.body?.getReader();
  if (!reader) throw new InputError("Missing form.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 16000) {
      await reader.cancel();
      throw new InputError("Form is too large.", 413);
    }
    chunks.push(value);
  }
  try {
    const v = JSON.parse(Buffer.concat(chunks).toString());
    if (!v || typeof v !== "object" || Array.isArray(v)) throw Error();
    return v;
  } catch {
    throw new InputError("Invalid form.", 400);
  }
}
export async function rate(
  req: Request,
  bucket: string,
  limit: number,
  seconds: number,
  identity?: string,
) {
  const ip =
    req.headers.get("x-vercel-forwarded-for") ||
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    "local";
  const key = createHmac("sha256", process.env.SUPABASE_SECRET_KEY || "")
    .update(bucket + ":" + (identity || ip))
    .digest("hex");
  if (
    !checked(
      await db().rpc("crm_rate_limit", {
        p_key: key,
        p_limit: limit,
        p_seconds: seconds,
      }),
    )
  )
    throw new InputError("Too many attempts. Please try again later.", 429);
}
export const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
export function failure(e: unknown) {
  return json(
    {
      error:
        e instanceof InputError
          ? e.message
          : "Something went wrong. Please try again.",
    },
    e instanceof InputError ? e.status : 500,
  );
}
