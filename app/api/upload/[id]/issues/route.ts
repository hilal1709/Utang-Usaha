import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { submissionIssues } from "@/db/schema";
import { apiUser } from "@/lib/session";
import { handle, json } from "@/lib/api";
import { getSubmissionFor } from "@/lib/upload/server";

export async function GET(_req: Request, ctx: RouteContext<"/api/upload/[id]/issues">) {
  const user = await apiUser();
  if (!user) return json({ error: "Tidak berhak." }, 401);
  return handle(async () => {
    const id = Number((await ctx.params).id);
    const submission = await getSubmissionFor(id, user);
    const issues = await db.select().from(submissionIssues).where(eq(submissionIssues.submissionId, id))
      .orderBy(asc(submissionIssues.severity), asc(submissionIssues.row)).limit(5000);
    return { submission, issues };
  });
}
