import {
  checked,
  body,
  db,
  failure,
  json,
  manager,
  member,
  owner,
} from "@/lib/crm/server";
import {
  csvCell,
  email,
  InputError,
  leadInput,
  leadPatch,
  phone,
  pick,
  text,
  uuid,
} from "@/lib/crm/validation";
import { STAGES, PRIORITIES, type Member } from "@/lib/crm/types";
type Context = { params: Promise<{ path: string[] }> };
function leadsQuery(m: Member, p: URLSearchParams) {
  let q = db().from("crm_leads").select("*", { count: "exact" });
  if (m.role === "agent") q = q.eq("assignee_id", m.id);
  if (p.get("archived") === "true") q = q.not("archived_at", "is", null);
  else q = q.is("archived_at", null);
  for (const [key, allowed] of [
    ["stage", STAGES],
    ["priority", PRIORITIES],
  ] as const)
    if (p.get(key)) q = q.eq(key, pick(p.get(key), allowed));
  if (p.get("source")) q = q.eq("source", text(p.get("source"), 60));
  if (m.role !== "agent" && p.get("assignee"))
    q =
      p.get("assignee") === "unassigned"
        ? q.is("assignee_id", null)
        : q.eq("assignee_id", uuid(p.get("assignee")));
  const search = text(p.get("q"), 100)
    .replace(/[^\p{L}\p{N}@+ ._-]/gu, "")
    .replaceAll("%", "")
    .replaceAll("_", "");
  if (search)
    q = q.or(
      "name.ilike.%" +
        search +
        "%,phone.ilike.%" +
        search +
        "%,email.ilike.%" +
        search +
        "%",
    );
  if (p.get("due")) {
    q = q.not("follow_up_at", "is", null).not("stage", "in", "(won,lost,dnd)");
    if (p.get("due") === "overdue")
      q = q.lt("follow_up_at", new Date().toISOString());
  }
  for (const key of ["from", "to"])
    if (p.get(key)) {
      const s = p.get(key)!;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(Date.parse(s)))
        throw new InputError("Choose a valid date.");
      q =
        key === "from"
          ? q.gte("created_at", s + "T00:00:00+05:30")
          : q.lte("created_at", s + "T23:59:59.999+05:30");
    }
  return q
    .order(p.get("due") ? "follow_up_at" : "last_seen_at", {
      ascending: !!p.get("due"),
    })
    .order("id");
}
async function getLead(id: string, m: Member) {
  let q = db().from("crm_leads").select("*").eq("id", uuid(id));
  if (m.role === "agent") q = q.eq("assignee_id", m.id);
  const l = checked(await q.maybeSingle());
  if (!l) throw new InputError("Lead not found.", 404);
  return l;
}
export async function GET(req: Request, ctx: Context) {
  try {
    const m = await member(),
      [resource, id] = (await ctx.params).path,
      p = new URL(req.url).searchParams,
      client = db();
    if (resource === "session") return json({ member: m });
    if (resource === "overview")
      return json(checked(await client.rpc("crm_overview", { p_actor: m.id })));
    if (resource === "members")
      return json(
        checked(
          await client
            .from("crm_members")
            .select(
              m.role === "agent"
                ? "id,name,role,active"
                : "id,email,name,role,active",
            )
            .order("name"),
        ),
      );
    if (resource === "settings") {
      manager(m);
      return json(
        checked(
          await client
            .from("crm_settings")
            .select("whatsapp_number")
            .eq("id", true)
            .single(),
        ),
      );
    }
    if (resource === "leads" && id) {
      const lead = await getLead(id, m);
      const [a, s] = await Promise.all([
        client
          .from("crm_activities")
          .select("*")
          .eq("lead_id", id)
          .order("created_at", { ascending: false })
          .limit(200),
        client
          .from("crm_submissions")
          .select("id,payload,created_at")
          .eq("lead_id", id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      return json({ lead, activities: checked(a), submissions: checked(s) });
    }
    if (resource === "leads") {
      const page = Math.max(1, Math.min(100000, Number(p.get("page")) || 1));
      const result = await leadsQuery(m, p).range(
        (page - 1) * 25,
        page * 25 - 1,
      );
      return json({ leads: checked(result), count: result.count, page });
    }
    if (resource === "export") {
      const rows: Record<string, unknown>[] = [];
      for (let offset = 0; offset < 50000; offset += 1000) {
        const r = await leadsQuery(m, p).range(offset, offset + 999);
        const data = checked(r) || [];
        if ((r.count || 0) > 50000)
          throw new InputError(
            "Please narrow your filters to export fewer than 50,000 leads.",
          );
        rows.push(...data);
        if (data.length < 1000) break;
      }
      const keys = [
        "id",
        "name",
        "phone",
        "email",
        "city",
        "inquiry",
        "pack",
        "stage",
        "priority",
        "source",
        "assignee_id",
        "follow_up_at",
        "last_outcome",
        "lost_reason",
        "submission_count",
        "created_at",
        "last_seen_at",
        "consent",
      ];
      return new Response(
        "\uFEFF" +
          [
            keys.map(csvCell).join(","),
            ...rows.map((r) => keys.map((k) => csvCell(r[k])).join(",")),
          ].join("\r\n"),
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="sukoona-leads.csv"',
            "Cache-Control": "no-store",
          },
        },
      );
    }
    if (resource === "customers" || resource === "orders") {
      manager(m);
      const page = Math.max(1, Number(p.get("page")) || 1);
      const r = await client
        .from(resource)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * 25, page * 25 - 1);
      return json({ rows: checked(r), count: r.count, page });
    }
    throw new InputError("Not found.", 404);
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request, ctx: Context) {
  try {
    const m = await member(),
      [resource] = (await ctx.params).path,
      b = await body(req),
      client = db();
    if (resource === "leads") {
      manager(m);
      return json(
        checked(
          await client.rpc("crm_capture_lead", {
            p_payload: leadInput(b, true),
            p_actor: m.id,
          }),
        ),
      );
    }
    if (resource === "members") {
      owner(m);
      const address = email(b.email, true),
        name = text(b.name, 120, true),
        role = pick(b.role, ["manager", "agent"]);
      const existing = checked(
        await client
          .from("crm_members")
          .select("id")
          .eq("email", address)
          .maybeSingle(),
      );
      if (existing) throw new InputError("This email is already on the team.");
      const auth = await client.auth.admin.createUser({
        email: address,
        email_confirm: true,
      });
      if (auth.error && !auth.error.message.toLowerCase().includes("already"))
        throw new InputError("Could not create this login.", 503);
      return json(
        checked(
          await client
            .from("crm_members")
            .insert({ email: address, name, role })
            .select("id,email,name,role,active")
            .single(),
        ),
      );
    }
    throw new InputError("Not found.", 404);
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(req: Request, ctx: Context) {
  try {
    const m = await member(),
      [resource, id] = (await ctx.params).path,
      b = await body(req),
      client = db();
    if (resource === "leads" && id) {
      if (!Number.isInteger(b.version) || Number(b.version) < 1)
        throw new InputError("Refresh this lead before saving.");
      return json(
        checked(
          await client.rpc("crm_update_lead", {
            p_id: uuid(id),
            p_actor: m.id,
            p_version: b.version,
            p_patch: leadPatch((b.patch as Record<string, unknown>) || {}),
            p_request: uuid(b.request_id),
          }),
        ),
      );
    }
    if (resource === "settings") {
      owner(m);
      const number = b.whatsapp_number ? phone(b.whatsapp_number).slice(1) : "";
      checked(
        await client
          .from("crm_settings")
          .update({
            whatsapp_number: number,
            updated_at: new Date().toISOString(),
          })
          .eq("id", true),
      );
      return json({ ok: true });
    }
    if (resource === "members" && id) {
      owner(m);
      if (uuid(id) === m.id)
        throw new InputError(
          "You cannot disable or change your own owner account.",
        );
      const target = checked(
        await client.from("crm_members").select("role").eq("id", id).single(),
      );
      if (target?.role === "owner")
        throw new InputError("Owner accounts cannot be changed here.");
      if (typeof b.active !== "boolean")
        throw new InputError("Choose an access status.");
      checked(
        await client
          .from("crm_members")
          .update({
            active: b.active,
            role: pick(b.role, ["manager", "agent"]),
          })
          .eq("id", id),
      );
      if (!b.active)
        checked(await client.from("crm_sessions").delete().eq("member_id", id));
      return json({ ok: true });
    }
    throw new InputError("Not found.", 404);
  } catch (e) {
    return failure(e);
  }
}
