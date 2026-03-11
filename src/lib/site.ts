export const SITE_NAME = "NOTUBE";
export const SITE_TAGLINE = "Escape the YouTube algorithm. Keep the knowledge.";
export const SITE_DESCRIPTION =
  "A focused YouTube learning loop with one lesson, one reflection, one quiz, and progress that stays with you.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://notube-tan.vercel.app";

export const SITE_PAGES = [
  "",
  "/how-it-works",
  "/account",
  "/history",
  "/stats",
  "/privacy",
  "/terms",
] as const;
