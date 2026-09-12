// Explicit integration check: creates uniquely named disposable fixtures and removes only those IDs.
import { createClient } from "@supabase/supabase-js";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import assert from "node:assert/strict";
const base = process.env.CRM_TEST_URL || "http://localhost:3000";
if (
  !["localhost", "127.0.0.1"].includes(new URL(base).hostname) &&
  process.env.CRM_TEST_ALLOW_LIVE !== "true"
)
  throw Error("Live checks require CRM_TEST_ALLOW_LIVE=true.");
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const tag = "QA-" + randomUUID(),
  ids = [],
  sessions = [],
  leadIds = [];
let eventId;
function check(r) {
  if (r.error) throw Error(r.error.message);
  return r.data;
}
async function call(path, method = "GET", body, cookie) {
  const r = await fetch(base + "/api/" + path, {
    method,
    headers: {
      Origin: base,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: "sukoona_admin=" + cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: r.status,
    data: r.headers.get("content-type")?.includes("json")
      ? await r.json()
      : await r.text(),
    headers: r.headers,
  };
}
try {
  for (const role of ["owner", "agent", "agent"]) {
    const m = check(
      await client
        .from("crm_members")
        .insert({
          email: randomUUID() + "@example.invalid",
          name: tag + " " + role,
          role,
        })
        .select("id")
        .single(),
    );
    ids.push(m.id);
    const token = randomBytes(32).toString("hex");
    sessions.push(token);
    check(
      await client
        .from("crm_sessions")
        .insert({
          token_hash: createHash("sha256").update(token).digest("hex"),
          member_id: m.id,
          expires_at: new Date(Date.now() + 300000).toISOString(),
        }),
    );
  }
  assert.equal((await call("admin/leads")).status, 401);
  assert.equal(
    (await call("admin/session", "GET", undefined, sessions[0])).status,
    200,
  );
  const outside = await fetch(base + "/api/leads", {
    method: "POST",
    headers: {
      Origin: "https://untrusted.example",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(outside.status, 403);
  const payload = {
    request_id: randomUUID(),
    name: tag,
    phone: "+12025550123",
    email: "qa-lead@example.invalid",
    city: "Test",
    inquiry: "product",
    pack: "10",
    message: "Disposable integration check",
    consent: true,
    source: "enquiry",
    attribution: { source: "qa", page: "/contact" },
  };
  const collision = check(
    await client
      .from("crm_leads")
      .select("id")
      .eq("phone", payload.phone)
      .maybeSingle(),
  );
  assert.equal(
    collision,
    null,
    "QA phone already exists; refusing to modify it.",
  );
  assert.equal(
    (await call("leads", "POST", { ...payload, consent: false })).status,
    422,
  );
  assert.equal((await call("leads", "POST", payload)).status, 200);
  const lead = check(
    await client
      .from("crm_leads")
      .select("*")
      .eq("phone", payload.phone)
      .single(),
  );
  leadIds.push(lead.id);
  assert.equal((await call("leads", "POST", payload)).status, 200);
  assert.equal(
    (
      await call("leads", "POST", {
        ...payload,
        request_id: randomUUID(),
        message: "Second message",
      })
    ).status,
    200,
  );
  const detail = await call(
    "admin/leads/" + lead.id,
    "GET",
    undefined,
    sessions[0],
  );
  assert.equal(detail.data.lead.submission_count, 2);
  assert.equal(detail.data.submissions.length, 2);
  assert.equal(
    (await call("admin/leads/" + lead.id, "GET", undefined, sessions[1]))
      .status,
    404,
  );
  const update = {
    version: 2,
    request_id: randomUUID(),
    patch: {
      kind: "assignment",
      assignee_id: ids[1],
      stage: "follow_up",
      follow_up_at: new Date(Date.now() + 3600000).toISOString(),
    },
  };
  assert.equal(
    (await call("admin/leads/" + lead.id, "PATCH", update, sessions[0])).status,
    200,
  );
  assert.equal(
    (await call("admin/leads/" + lead.id, "PATCH", update, sessions[0])).status,
    200,
  );
  assert.equal(
    (
      await call(
        "admin/leads/" + lead.id,
        "PATCH",
        { ...update, request_id: randomUUID() },
        sessions[0],
      )
    ).status,
    409,
  );
  assert.equal(
    (await call("admin/leads/" + lead.id, "GET", undefined, sessions[1]))
      .status,
    200,
  );
  assert.equal(
    (await call("admin/leads/" + lead.id, "GET", undefined, sessions[2]))
      .status,
    404,
  );
  assert.equal(
    (await call("admin/customers", "GET", undefined, sessions[1])).status,
    403,
  );
  assert.equal(
    (
      await call(
        "admin/members",
        "POST",
        { name: "Blocked", email: "blocked@example.invalid", role: "manager" },
        sessions[1],
      )
    ).status,
    403,
  );
  const note = await call(
    "admin/leads/" + lead.id,
    "PATCH",
    {
      version: 3,
      request_id: randomUUID(),
      patch: {
        kind: "call",
        note: "Test callback",
        outcome: "callback_requested",
      },
    },
    sessions[1],
  );
  assert.equal(note.status, 200);
  assert.ok(note.data.follow_up_at);
  const scoped = await call("admin/overview", "GET", undefined, sessions[2]);
  assert.equal(scoped.data.total, 0);
  assert.equal(scoped.data.visits, undefined);
  const csv = await call(
    "admin/export?q=" + encodeURIComponent(tag),
    "GET",
    undefined,
    sessions[0],
  );
  assert.equal(csv.status, 200);
  assert.ok(csv.data.includes(tag));
  assert.ok(csv.headers.get("content-disposition").includes(".csv"));
  for (const resource of ["customers", "orders", "settings"])
    assert.equal(
      (await call("admin/" + resource, "GET", undefined, sessions[0])).status,
      200,
    );
  eventId = randomUUID();
  assert.equal(
    (
      await call("events", "POST", {
        id: eventId,
        session_id: randomUUID(),
        event: "page_view",
        page: "/contact",
        device: "desktop",
        attribution: { source: tag },
      })
    ).status,
    200,
  );
  check(
    await client.from("crm_members").update({ active: false }).eq("id", ids[1]),
  );
  assert.equal(
    (await call("admin/leads", "GET", undefined, sessions[1])).status,
    401,
  );
  assert.equal(
    (await call("admin/auth/logout", "POST", {}, sessions[0])).status,
    200,
  );
  assert.equal(
    (await call("admin/session", "GET", undefined, sessions[0])).status,
    401,
  );
  console.log(
    "PASS: public capture/consent/CSRF, duplicate retry, repeat submissions, authenticated sessions, lead assignment, agent isolation, stale edit protection, activity notes, follow-up preservation, scoped metrics, CSV, customers/orders/settings, event capture, disabled access and logout.",
  );
} catch (e) {
  console.error("FAIL:", e.message);
  process.exitCode = 1;
} finally {
  if (eventId)
    check(await client.from("crm_events").delete().eq("id", eventId));
  for (const id of leadIds)
    check(await client.from("crm_leads").delete().eq("id", id));
  for (const id of ids)
    check(await client.from("crm_members").delete().eq("id", id));
  console.log("Disposed of this check’s test fixtures.");
}
