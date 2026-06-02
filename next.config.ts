import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Canonical URLs end with "/". Required so the project pages at
  // /works/<slug>/ keep the trailing slash in the address bar — the
  // static HTML files reference resources via "./assets/..." which
  // only resolves correctly when the browser treats the URL as a
  // directory.
  trailingSlash: true,

  async rewrites() {
    return [
      // Serve static project pages from public/works/<slug>/index.html
      // under clean URLs like /works/nemo/ (no .html visible).
      // Subpaths like /works/nemo/assets/cover.jpg fall through to
      // /public/ static serving normally.
      {
        source: "/works/:slug/",
        destination: "/works/:slug/index.html",
      },
      // /about/ → minimal hero (photo + 1 line + 2 CTAs).
      // /about/story/ → the long Maison-style chronicle for visitors
      // who tap "Want to know more". Both are hand-coded HTML inside
      // /public/about/ so the editorial typography + grain overlay
      // can be tuned directly.
      {
        source: "/about/",
        destination: "/about/index.html",
      },
      {
        source: "/about/story/",
        destination: "/about/story/index.html",
      },
    ];
  },
};

export default nextConfig;
