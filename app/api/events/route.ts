import { body, checked, db, failure, json, rate } from "@/lib/crm/server";
import { attribution, pick, text, uuid } from "@/lib/crm/validation";
export async function POST(req: Request) {
  try {
    const b = await body(req);
    await rate(req, "events", 150, 3600);
    const a = attribution(b.attribution),
      page = text(b.page, 300);
    if (
      !page.startsWith("/") ||
      page.startsWith("/admin") ||
      page.includes("?")
    )
      return json({ ok: true });
    checked(
      await db()
        .from("crm_events")
        .upsert(
          {
            id: uuid(b.id),
            session_id: uuid(b.session_id),
            event: pick(b.event, [
              "page_view",
              "product_view",
              "form_open",
              "whatsapp_click",
              "lead_submitted",
            ]),
            page,
            source: a.source || "direct",
            medium: a.medium || null,
            campaign: a.campaign || null,
            referrer: a.referrer || null,
            device: pick(b.device, ["mobile", "desktop"], "desktop"),
          },
          { onConflict: "id", ignoreDuplicates: true },
        ),
    );
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
