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
- Home 6 applies its image reveal through page-local GSAP animations attached to the existing Swiper, overriding the template's vertical translation only on that page and honoring reduced motion.
- Home 6 About media uses native inline video and page-local playback controls, with muted autoplay to satisfy browser autoplay policies.
- Home 6 Vastu tile overlays share one page-local CSS animation with nonoverlapping row-order slots, so only one of the nine tiles is active at a time and reduced motion disables the turns.
- Home 6 sizes its services accordion page-locally (the open card takes a viewport-based clamp, the folded cards split the remainder) and gives that section a left gutter where the sticky social rail would otherwise sit under it, so the row always fits the window instead of the template's fixed card widths.
- Home 6 implements an Architect's Drafting Set Square (Triangle Ruler) scroll-to-top instrument with millimeter/centimeter scale graduations (1:100), circular drafting stencil aperture progress gauge, elevation datum benchmark symbol (±0.00), floating datum tooltip, and kinetic ascent launch.
