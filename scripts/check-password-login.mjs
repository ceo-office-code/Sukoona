// Verify sign-in through the real API. Read the password from stdin and never print it.
import assert from "node:assert/strict";
const address = process.argv[2]?.trim().toLowerCase(),
  base = process.env.CRM_TEST_URL || "http://localhost:3000";
let password = "";
for await (const chunk of process.stdin) password += chunk;
password = password.replace(/\r?\n$/, "");
if (!address || !password) throw Error("Email and stdin password required.");
let cookie = "";
async function post(path, data) {
  return fetch(base + "/api/admin/auth/" + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: base,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(data),
  });
}
try {
  const wrong = await post("login", {
    email: address,
    password: password + "-wrong",
  });
  assert.equal(wrong.status, 401, "Incorrect password must be rejected");
  assert.equal(wrong.headers.get("set-cookie"), null);
  const removed = await post("request", { email: address });
  assert.equal(removed.status, 404, "Email-link endpoint must be disabled");
  const result = await post("login", { email: address, password });
  password = "";
  assert.equal(result.status, 200, "Correct password must be accepted");
  assert.deepEqual(await result.json(), { ok: true });
  const header = result.headers.get("set-cookie") || "";
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=Strict/i);
  assert.match(header, /Max-Age=43200/i);
  if (base.startsWith("https:")) assert.match(header, /Secure/i);
  cookie = header.split(";")[0];
  assert.match(cookie, /^sukoona_admin=[a-f0-9]{64}$/);
  const session = await fetch(base + "/api/admin/session", {
    headers: { Cookie: cookie },
  });
  assert.equal(session.status, 200);
  const me = await session.json();
  assert.equal(me.member.email, address);
  assert.equal(me.member.role, "owner");
  const leads = await fetch(base + "/api/admin/leads", {
    headers: { Cookie: cookie },
  });
  assert.equal(leads.status, 200);
  const overview = await fetch(base + "/api/admin/overview", {
    headers: { Cookie: cookie },
  });
  assert.equal(overview.status, 200);
  const data = await overview.json();
  assert.ok(Number.isFinite(data.total));
  const out = await post("logout", {});
  assert.equal(out.status, 200);
  assert.equal(
    (await fetch(base + "/api/admin/session", { headers: { Cookie: cookie } }))
      .status,
    401,
  );
  cookie = "";
  console.log(
    "PASS: invalid password rejected, email-link endpoint removed, correct owner login, secure session cookie, dashboard/lead access and logout.",
  );
} catch (e) {
  console.error("FAIL:", e.message);
  process.exitCode = 1;
} finally {
  password = "";
  if (cookie) await post("logout", {});
}
