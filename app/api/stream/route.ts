import { desc, gt, asc } from "drizzle-orm";
import { db } from "@/db";
import { dataEvents } from "@/db/schema";
import { apiUser } from "@/lib/session";

export const maxDuration = 60;

const POLL_MS = 3000;
const LIFETIME_MS = 50_000; // tutup sebelum batas durasi fungsi; EventSource akan reconnect otomatis

/**
 * Server-Sent Events untuk pembaruan realtime. Neon (HTTP/WebSocket serverless) tidak mendukung
 * LISTEN/NOTIFY jangka panjang di Vercel, jadi tabel `data_events` dipantau berkala.
 */
export async function GET(req: Request) {
  const user = await apiUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const lastEventId = Number(req.headers.get("last-event-id") ?? new URL(req.url).searchParams.get("since") ?? NaN);
  let cursor = Number.isFinite(lastEventId) ? lastEventId : (await db.select({ id: dataEvents.id }).from(dataEvents).orderBy(desc(dataEvents.id)).limit(1))[0]?.id ?? 0;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const started = Date.now();
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));
      send(`retry: 2000\n: connected\n\n`);
      let closed = false;
      req.signal.addEventListener("abort", () => { closed = true; });
      while (!closed && Date.now() - started < LIFETIME_MS) {
        try {
          const events = await db.select().from(dataEvents).where(gt(dataEvents.id, cursor)).orderBy(asc(dataEvents.id)).limit(50);
          for (const e of events) {
            cursor = e.id;
            // Akun OpCo hanya menerima event OpCo-nya sendiri (+ event global tanpa OpCo, mis. kunci periode).
            if (user.role === "OPCO" && e.opcoCode && e.opcoCode !== user.opcoCode) continue;
            send(`id: ${e.id}\nevent: ${e.kind}\ndata: ${JSON.stringify({ id: e.id, kind: e.kind, message: e.message, period: e.period, opcoCode: e.opcoCode, at: e.createdAt })}\n\n`);
          }
          send(`: ping\n\n`);
        } catch {
          break;
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
      try { controller.close(); } catch {}
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" },
  });
}
