export const runtime = "nodejs";

type UpstashResult = { error?: string; result?: unknown };

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { name?: string; phone?: string };
    const name = payload.name?.trim() ?? "";
    const phone = payload.phone?.trim().replace(/[\s()-]/g, "") ?? "";
    if (name.length < 2 || phone.length < 7 || phone.length > 20) return Response.json({ error: "Enter a valid name and phone number." }, { status: 400 });
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      return Response.json(
        { error: "Waitlist storage is not configured." },
        { status: 503 },
      );
    }

    const createdAt = new Date().toISOString();
    const response = await fetch(`${redisUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["HSET", `zeexco:waitlist:${phone}`, "name", name, "phone", phone, "createdAt", createdAt],
        ["ZADD", "zeexco:waitlist:entries", Date.now(), phone],
      ]),
      cache: "no-store",
    });

    const results = (await response.json()) as UpstashResult[];
    if (!response.ok || results.some((result) => result.error)) {
      throw new Error("Upstash rejected the waitlist write.");
    }

    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to join the waitlist." }, { status: 500 });
  }
}
