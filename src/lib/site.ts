export const SITE_NAME = "NOTUBE";
export const SITE_TAGLINE = "Escape the YouTube algorithm. Keep the knowledge.";
export const SITE_DESCRIPTION =
  "NOTUBE turns YouTube into a rabbit hole, on rails. One lesson, one reflection, one quiz, and only two backup paths when you choose to go deeper.";
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
