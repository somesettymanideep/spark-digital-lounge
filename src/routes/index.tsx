import { createFileRoute, redirect } from "@tanstack/react-router";

// The published site is the static Barsi HTML template served from /public.
// Redirect / to the template's home page.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SEA — Architecture & Interior Design" },
      { name: "description", content: "Discover architectural projects and interior design from SEA — Studio for Eclectic Architecture." },
      { property: "og:title", content: "SEA — Architecture & Interior Design" },
      { property: "og:description", content: "Discover architectural projects and interior design from SEA — Studio for Eclectic Architecture." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ href: "/index-6.html" });
  },
});
