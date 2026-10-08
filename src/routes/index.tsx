import { createFileRoute, redirect } from "@tanstack/react-router";

// The published site is the static Barsi HTML template served from /public.
// Redirect / to the template's home page.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ href: "/index-6.html" });
  },
});
