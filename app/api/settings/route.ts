import { checked, db, failure, json } from "@/lib/crm/server";
export async function GET() {
  try {
    return json(
      checked(
        await db()
          .from("crm_settings")
          .select("whatsapp_number")
          .eq("id", true)
          .single(),
      ),
    );
  } catch (e) {
    return failure(e);
  }
}
