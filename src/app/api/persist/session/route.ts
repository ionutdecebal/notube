import { NextResponse } from "next/server";
import { DemoState } from "@/lib/types";
import { getSessionState, upsertSessionState } from "@/lib/server/persistence";

interface PersistSessionRequest {
  state?: DemoState;
}

const isValidDemoState = (state: unknown): state is DemoState => {
  if (!state || typeof state !== "object") return false;
  const s = state as DemoState;
  if (!s.session || typeof s.session.id !== "string" || typeof s.session.topic !== "string") return false;
  if (!Array.isArray(s.videoCandidates)) return false;
  if (s.videoCandidates.length < 1 || s.videoCandidates.length > 20) return false;
  return true;
};

export async function POST(request: Request) {
  const body = (await request.json()) as PersistSessionRequest;
  const state = body.state;

  if (!isValidDemoState(state)) {
    return NextResponse.json({ error: "invalid demo state payload" }, { status: 400 });
  }

  await upsertSessionState(state);
  return NextResponse.json({ ok: true, sessionId: state.session.id });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId")?.trim();

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const state = await getSessionState(sessionId);
  if (!state) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }

  return NextResponse.json({ state });
}
