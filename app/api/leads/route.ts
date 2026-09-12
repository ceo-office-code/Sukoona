import { body, checked, db, failure, json, rate } from "@/lib/crm/server";
import { leadInput } from "@/lib/crm/validation";
export async function POST(req: Request) {
  try {
    const b = await body(req);
    await rate(req, "leads", 12, 3600);
    if (b.website) return json({ ok: true });
    const payload = leadInput(b);
    await rate(req, "phone", 6, 3600, payload.phone);
    checked(await db().rpc("crm_capture_lead", { p_payload: payload }));
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
