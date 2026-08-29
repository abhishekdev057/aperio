import { requireAdmin } from "@/lib/admin";
import { fail, handleApiError, ok } from "@/lib/api";
import { deleteQuestionSet, getQuestionSet, setQuestionSetPublished } from "@/lib/quiz-bank";
import { idSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const id = idSchema.parse((await context.params).id);
    const set = await getQuestionSet(id);
    return set ? ok(set) : fail("NOT_FOUND", "Question set not found.", 404);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const id = idSchema.parse((await context.params).id);
    const body = (await request.json().catch(() => ({}))) as { published?: boolean };
    if (typeof body.published !== "boolean") return fail("VALIDATION_ERROR", "Pass { published: boolean }.", 422);
    await setQuestionSetPublished(id, body.published);
    return ok({ id, published: body.published });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const id = idSchema.parse((await context.params).id);
    await deleteQuestionSet(id);
    return ok({ id, deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
