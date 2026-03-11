import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#07090c",
    theme_color: "#07090c",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
    shortcuts: [
      {
        name: "Start lesson",
        short_name: "Lesson",
        description: SITE_TAGLINE,
        url: "/",
      },
      {
        name: "View history",
        short_name: "History",
        description: "Review saved lessons and resume where you left off.",
        url: "/history",
      },
    ],
  };
}
