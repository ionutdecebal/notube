import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "radial-gradient(circle at 18% 18%, rgba(72,94,128,0.32), transparent 34%), radial-gradient(circle at 84% 22%, rgba(24,45,70,0.28), transparent 30%), linear-gradient(135deg, #0a0d12 0%, #06080c 58%, #030406 100%)",
          color: "#f4f7fb",
          padding: "72px",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "Avenir Next, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: "999px",
            padding: "12px 20px",
            fontSize: 28,
            letterSpacing: "0.28em",
          }}
        >
          {SITE_NAME}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 920 }}>
          <div style={{ fontSize: 76, lineHeight: 1.02, fontWeight: 600 }}>{SITE_TAGLINE}</div>
          <div style={{ fontSize: 30, lineHeight: 1.35, color: "rgba(244,247,251,0.72)" }}>
            One lesson, one reflection, one quiz, and backup explanations only when you need them.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
