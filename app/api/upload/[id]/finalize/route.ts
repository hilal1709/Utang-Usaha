import { z } from "zod";
import { apiUser } from "@/lib/session";
import { handle, json } from "@/lib/api";
import { finalizeSubmission, getSubmissionFor, UploadError } from "@/lib/upload/server";

export const maxDuration = 60;

const issue = z.object({
  row: z.number().nullable(), column: z.string().nullable(), code: z.string(), message: z.string(),
  severity: z.enum(["error", "warning"]), value: z.string().optional(), suggestion: z.string().optional(),
});
const body = z.object({
  fileIssues: z.array(z.object({ code: z.string(), severity: z.enum(["error", "warning"]), title: z.string(), count: z.number(), samples: z.array(issue) })),
});

export async function POST(req: Request, ctx: RouteContext<"/api/upload/[id]/finalize">) {
  const user = await apiUser(["ADMIN", "OPCO"]);
  if (!user) return json({ error: "Tidak berhak." }, 401);
  return handle(async () => {
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id)) throw new UploadError("ID tidak valid.");
    await getSubmissionFor(id, user);
    const { fileIssues } = body.parse(await req.json());
    return finalizeSubmission(id, fileIssues);
  });
}
