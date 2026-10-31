import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUserSections } from "@/lib/section-guard";

type Handler<C = any> = (
  request: Request,
  context: C,
  user: Awaited<ReturnType<typeof getAuthUser>>,
) => Promise<Response> | Response;

export function withSection<C = any>(section: string, handler: Handler<C>) {
  return async (request: Request, context: C): Promise<Response> => {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sections = await getUserSections(user);
    const allowed = sections === null || sections.has(section);
    if (!allowed) {
      return NextResponse.json(
        {
          error: `Your plan does not include the "${section}" feature.`,
          section,
          code: "SECTION_LOCKED",
        },
        { status: 403 },
      );
    }

    return handler(request, context, user);
  };
}
