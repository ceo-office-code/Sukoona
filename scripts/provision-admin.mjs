import { createClient } from "@supabase/supabase-js";
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@"))
  throw Error("Provide the authorised admin email as the first argument.");
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY)
  throw Error("Server database configuration is required.");
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const existing = await db
  .from("crm_members")
  .select("id,role")
  .eq("email", email)
  .maybeSingle();
if (existing.error) throw Error("Could not check admin membership.");
if (existing.data) {
  console.log("Admin membership already exists; no changes made.");
  process.exit(0);
}
const user = await db.auth.admin.createUser({ email, email_confirm: true });
if (user.error && !user.error.message.toLowerCase().includes("already"))
  throw Error("Could not provision the admin login.");
const result = await db
  .from("crm_members")
  .insert({ email, name: "Sukoona Owner", role: "owner" });
if (result.error) throw Error("Could not save admin membership.");
console.log("Authorised owner account provisioned. No email was sent.");
