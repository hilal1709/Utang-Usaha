import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { opcos } from "@/db/schema";
import { apiUser } from "@/lib/session";
import { handle, json } from "@/lib/api";
import { getSubmissionFor, ingestBatch, UploadError } from "@/lib/upload/server";

export const maxDuration = 60;

const body = z.object({ rows: z.array(z.object({ r: z.number().int().positive(), c: z.array(z.unknown()) })).max(5000) });

export async function POST(req: Request, ctx: RouteContext<"/api/upload/[id]/rows">) {
  const user = await apiUser(["ADMIN", "OPCO"]);
  if (!user) return json({ error: "Tidak berhak." }, 401);
  return handle(async () => {
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) throw new UploadError("ID tidak valid.");
    const sub = await getSubmissionFor(id, user);
    const { rows } = body.parse(await req.json());
    const [opco] = await db.select().from(opcos).where(eq(opcos.code, sub.opcoCode));
    return ingestBatch(sub, rows, opco?.cocds ?? []);
  });
}
