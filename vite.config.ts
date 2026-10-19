// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      {
        // Dev-only: /__l5e/assets-v1/* is served by Lovable's hosting, not Vite,
        // so proxy those requests to the published site when running locally.
        name: "l5e-assets-proxy",
        apply: "serve",
        configureServer(server) {
          const target = "https://spark-digital-lounge.lovable.app";
          server.middlewares.use((req, res, next) => {
            if (!req.url?.startsWith("/__l5e/")) return next();
            fetch(target + req.url)
              .then(async (upstream) => {
                res.statusCode = upstream.status;
                const type = upstream.headers.get("content-type");
                if (type) res.setHeader("content-type", type);
                res.end(Buffer.from(await upstream.arrayBuffer()));
              })
              .catch(() => {
                res.statusCode = 502;
                res.end();
              });
          });
        },
      },
    ],
  },
});
