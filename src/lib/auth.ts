import "server-only";

import { createAuthServer } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL ?? null;

export const neonAuthEnabled = Boolean(baseUrl);

export const auth = neonAuthEnabled ? createAuthServer() : null;
