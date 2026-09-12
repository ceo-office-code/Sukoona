import { INQUIRIES, OUTCOMES, PRIORITIES, STAGES } from "./types";
export class InputError extends Error {
  constructor(
    message: string,
    public status = 422,
  ) {
    super(message);
  }
}
export function text(value: unknown, max = 200, required = false): string {
  if (value === undefined || value === null) {
    if (required) throw new InputError("Please complete the required fields.");
    return "";
  }
  if (typeof value !== "string" || value.length > max)
    throw new InputError("A field is too long or invalid.");
  const result = value.trim();
  if (required && !result)
    throw new InputError("Please complete the required fields.");
  return result;
}
export function uuid(value: unknown) {
  const v = text(value, 36, true);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v,
    )
  )
    throw new InputError("Invalid request identifier.");
  return v;
}
export function phone(value: unknown) {
  const raw = text(value, 30, true);
  let d = raw.replace(/[\s()+.-]/g, "");
  if (/^[6-9]\d{9}$/.test(d)) d = "91" + d;
  if (!/^[1-9]\d{7,14}$/.test(d))
    throw new InputError("Enter a valid phone number, including country code.");
  if (d.startsWith("91") && !/^91[6-9]\d{9}$/.test(d))
    throw new InputError("Enter a valid 10-digit Indian mobile number.");
  return "+" + d;
}
export function email(value: unknown, required = false) {
  const v = text(value, 254, required).toLowerCase();
  if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    throw new InputError("Enter a valid email address.");
  return v;
}
export function pick(
  value: unknown,
  allowed: readonly string[],
  fallback?: string,
) {
  if ((value === undefined || value === "") && fallback !== undefined)
    return fallback;
  const v = text(value, 60, true);
  if (!allowed.includes(v))
    throw new InputError("Choose one of the available options.");
  return v;
}
export function attribution(value: unknown) {
  const a = (value && typeof value === "object" ? value : {}) as Record<
    string,
    unknown
  >;
  const result: Record<string, string> = {};
  for (const k of [
    "source",
    "medium",
    "campaign",
    "referrer",
    "landing_page",
    "page",
  ]) {
    const v = text(a[k], 300);
    if (v) result[k] = v;
  }
  for (const k of ["page", "landing_page"])
    if (result[k] && !/^\/[^?#]*$/.test(result[k])) result[k] = "/";
  if (result.referrer) {
    try {
      result.referrer = new URL(result.referrer).hostname;
    } catch {
      result.referrer = "";
    }
  }
  return result;
}
export function leadInput(body: Record<string, unknown>, manual = false) {
  if (body.consent !== true)
    throw new InputError(
      "Please confirm that we may contact you about this enquiry.",
    );
  return {
    request_id: uuid(body.request_id),
    name: text(body.name, 120, true),
    phone: phone(body.phone),
    email: email(body.email),
    city: text(body.city, 100),
    inquiry: pick(body.inquiry, INQUIRIES, "product"),
    pack: pick(body.pack, ["5", "10", "not_sure"], "not_sure"),
    message: text(body.message, 2000),
    consent: true,
    source: manual
      ? "manual"
      : pick(
          body.source,
          ["enquiry", "product", "whatsapp", "journal", "callback", "bulk"],
          "enquiry",
        ),
    attribution: attribution(body.attribution),
  };
}
export function leadPatch(body: Record<string, unknown>) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new InputError("Invalid lead update.");
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (
      ![
        "kind",
        "note",
        "stage",
        "priority",
        "assignee_id",
        "follow_up_at",
        "outcome",
        "lost_reason",
        "order_id",
        "archived",
      ].includes(key)
    )
      throw new InputError("Unsupported change.");
  }
  result.kind = pick(
    body.kind,
    ["update", "note", "call", "follow_up", "archive", "assignment"],
    "update",
  );
  if (body.note !== undefined) result.note = text(body.note, 3000);
  if (body.stage !== undefined) result.stage = pick(body.stage, STAGES);
  if (body.priority !== undefined)
    result.priority = pick(body.priority, PRIORITIES);
  if (body.outcome !== undefined) result.outcome = pick(body.outcome, OUTCOMES);
  if (body.lost_reason !== undefined)
    result.lost_reason = text(body.lost_reason, 1000);
  for (const key of ["assignee_id", "order_id"])
    if (key in body) result[key] = body[key] ? uuid(body[key]) : null;
  if ("archived" in body) {
    if (typeof body.archived !== "boolean")
      throw new InputError("Invalid archive choice.");
    result.archived = body.archived;
  }
  if ("follow_up_at" in body) {
    const v = body.follow_up_at;
    if (v !== null && v !== "") {
      const d = new Date(text(v, 40, true));
      if (!Number.isFinite(+d))
        throw new InputError("Choose a valid follow-up date.");
      result.follow_up_at = d.toISOString();
    } else result.follow_up_at = null;
  }
  if (["note", "call"].includes(String(result.kind)) && !result.note)
    throw new InputError("Add a note for this activity.");
  return result;
}
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[\s]*[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
