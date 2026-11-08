import { getDb } from "../../../db";
import { waitlistEntries } from "../../../db/schema";

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { name?: string; phone?: string };
    const name = payload.name?.trim() ?? "";
    const phone = payload.phone?.trim().replace(/[\s()-]/g, "") ?? "";
    if (name.length < 2 || phone.length < 7 || phone.length > 20) return Response.json({ error: "Enter a valid name and phone number." }, { status: 400 });
    const db = getDb();
    await db.insert(waitlistEntries).values({ name, phone }).onConflictDoUpdate({ target: waitlistEntries.phone, set: { name } });
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to join the waitlist." }, { status: 500 });
  }
}
