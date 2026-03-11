import { authApiHandler } from "@neondatabase/auth/next/server";
import { neonAuthEnabled } from "@/lib/auth";

const unavailable = () =>
  Response.json(
    {
      error: "Neon Auth is not configured. Set NEON_AUTH_BASE_URL.",
    },
    { status: 503 },
  );

const handler = neonAuthEnabled ? authApiHandler() : null;

export const GET = handler?.GET ?? unavailable;
export const POST = handler?.POST ?? unavailable;
export const PUT = handler?.PUT ?? unavailable;
export const DELETE = handler?.DELETE ?? unavailable;
export const PATCH = handler?.PATCH ?? unavailable;
