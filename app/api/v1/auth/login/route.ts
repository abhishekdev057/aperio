import { compare } from "bcryptjs";
import { createSession } from "@/lib/auth";
import { one } from "@/lib/db";
import { fail, handleApiError, ok } from "@/lib/api";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await one<{ id: string; passwordHash: string; fullName: string } & Record<string, unknown>>(
      `SELECT id,password_hash AS "passwordHash",full_name AS "fullName" FROM users WHERE email=$1`, [input.email],
    );
    if (!user || !(await compare(input.password, user.passwordHash))) return fail("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
    await createSession(user.id);
    return ok({ id: user.id, email: input.email, fullName: user.fullName });
  } catch (error) { return handleApiError(error); }
}
