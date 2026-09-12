// Supply the password through stdin; it is never stored in this file or printed.
import { createClient } from "@supabase/supabase-js";
const address = process.argv[2]?.trim().toLowerCase();
let password = "";
for await (const chunk of process.stdin) password += chunk;
password = password.replace(/\r?\n$/, "");
if (!address || !password || password.length > 256)
  throw Error("An authorised email and password are required.");
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const membership = await client
  .from("crm_members")
  .select("id")
  .eq("email", address)
  .eq("active", true)
  .maybeSingle();
if (membership.error || !membership.data)
  throw Error("Active admin membership not found.");
let user;
for (let page = 1; page <= 100; page++) {
  const result = await client.auth.admin.listUsers({ page, perPage: 100 });
  if (result.error) throw Error("Could not look up the admin account.");
  user = result.data.users.find((u) => u.email?.toLowerCase() === address);
  if (user || result.data.users.length < 100) break;
}
if (!user) throw Error("Admin authentication account not found.");
const updated = await client.auth.admin.updateUserById(user.id, { password });
password = "";
if (updated.error)
  throw Error(
    "The authentication service could not set the requested password.",
  );
const revoked = await client
  .from("crm_sessions")
  .delete()
  .eq("member_id", membership.data.id);
if (revoked.error)
  throw Error(
    "Password updated, but old workspace sessions could not be revoked.",
  );
console.log(
  "Admin password updated securely. Previous workspace sessions were signed out.",
);
