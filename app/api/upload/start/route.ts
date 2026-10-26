import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { opcos } from "@/db/schema";
import { apiUser } from "@/lib/session";
import { handle, json } from "@/lib/api";
import { startSubmission, UploadError } from "@/lib/upload/server";

const body = z.object({
  period: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  opcoCode: z.string().min(1),
  fileName: z.string().min(1).max(255),
  expectedRows: z.number().int().nonnegative(),
  flipSign: z.boolean(),
  columnMap: z.record(z.string(), z.number().int().nonnegative()),
});

export async function POST(req: Request) {
  const user = await apiUser(["ADMIN", "OPCO"]);
  if (!user) return json({ error: "Tidak berhak." }, 401);
  return handle(async () => {
    const b = body.parse(await req.json());
    if (user.role === "OPCO" && b.opcoCode !== user.opcoCode) throw new UploadError("Anda hanya bisa mengunggah untuk OpCo Anda sendiri.");
    const [opco] = await db.select().from(opcos).where(eq(opcos.code, b.opcoCode));
    const { submission } = await startSubmission({ ...b, uploadedBy: user.id });
    return { id: submission.id, version: submission.version, allowedCocds: opco?.cocds ?? [] };
  });
}
