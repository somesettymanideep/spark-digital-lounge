<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Static template pages

- Brand/media binaries the site shows are uploaded as Lovable Assets and referenced by their `/__l5e/assets-v1/...` URL from the static pages under `/public`, so the repository keeps no copies of them — keep new brand images on the same pattern.
- Page-specific styling for one template page goes in a `<style>` block in that page's own `<head>`, not in the shared `assets/css/main.css`, so sibling pages are untouched.
- Home 6 uses a page-local scroll listener and header state class instead of the shared direction-sensitive sticky plugin, so its header remains visible in both scroll directions without affecting sibling pages.
- Home 6 uses one page-local hero Swiper containing paired media/copy slides with discipline controls and opacity crossfades, keeping slide content synchronized without affecting sibling pages; the copy panel carries a page-local decorative image pinned to its bottom-right corner (slide number moved to the top-right, decoration hidden below 767px) so the corner accent stays put across slides.
- Home 6 About media uses native inline video and page-local playback controls, with muted autoplay to satisfy browser autoplay policies.
- Home 6 Vastu tile overlays share one page-local CSS animation with nonoverlapping row-order slots, so only one of the nine tiles is active at a time and reduced motion disables the turns.
- Home 6 sizes its services accordion page-locally (the open card takes a viewport-based clamp, the folded cards split the remainder) and gives that section a left gutter where the sticky social rail would otherwise sit under it, so the row always fits the window instead of the template's fixed card widths.
- Home 6 implements an Architect's Drafting Set Square (Triangle Ruler) scroll-to-top instrument with millimeter/centimeter scale graduations (1:100), circular drafting stencil aperture progress gauge, elevation datum benchmark symbol (±0.00), floating datum tooltip, and kinetic ascent launch.
- Site-wide animated 3D architectural pyramid custom cursor featuring faceted triangular geometry in SEA brand palette (#eef8f9 ice crystal and #00869b architectural teal), dynamic 3D velocity tilt and pitch/roll banking, translucent glass reflections, internal structural datum space-frame, idle gyroscopic orbit and sinusoidal elevation float, expanding isometric click pulse, subtle geometric trail shards, and contextual interactions (nav hover, project "EXPLORE" badge, button luminous glow, input fading). Mobile/touch and reduced motion fallbacks included.
- Home 6 displays a dedicated full image container banner section for "500+ trusted partners all over the world." with the panoramic dome pavilion render (contact-dome-3.jpg) as the background image with GSAP parallax, high-contrast dark architectural overlay, and centered typography immediately preceding the brand marquee.

- Home 6 prioritizes its first hero image, lazy-loads below-fold images and video, and loads the contact ripple engine near the viewport to keep initial media and rendering work small.

- The static About page mirrors Home 6 header, offcanvas menu, footer markup and their page-local styling/state listener; keep these copies aligned when modifying shared navigation so both pages remain self-contained static deployments.

- GitHub Pages is built by `.github/workflows/deploy-pages.yml` from `public/` (Home 6 copied to index.html, Lovable asset URLs pointed at the published Lovable site), because the repo root has no static index and Pages would otherwise render README.
