import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DEFAULT_USER_SETTINGS, getUserSettings, upsertUserSettings } from "@/lib/server/user-settings";
import { QuizMode } from "@/lib/types";

const parseQuizMode = (value: unknown): QuizMode | null => {
  if (value === "advanced" || value === "standard") {
    return value;
  }
  return null;
};

export async function GET() {
  if (!auth) {
    return NextResponse.json({
      authEnabled: false,
      authenticated: false,
      settings: DEFAULT_USER_SETTINGS,
    });
  }

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({
      authEnabled: true,
      authenticated: false,
      settings: DEFAULT_USER_SETTINGS,
    });
  }

  const settings = await getUserSettings(userId);

  return NextResponse.json({
    authEnabled: true,
    authenticated: true,
    settings,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
  });
}

export async function POST(request: Request) {
  if (!auth) {
    return NextResponse.json(
      {
        error: "Neon Auth is not configured.",
      },
      { status: 503 },
    );
  }

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Sign in to change this setting." }, { status: 401 });
  }

  const payload = (await request.json()) as { quizMode?: unknown };
  const quizMode = parseQuizMode(payload.quizMode);

  if (!quizMode) {
    return NextResponse.json({ error: "That quiz mode is not valid." }, { status: 400 });
  }

  await upsertUserSettings(userId, { quizMode });

  return NextResponse.json({
    ok: true,
    settings: {
      quizMode,
    },
  });
}
