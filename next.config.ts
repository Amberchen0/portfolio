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
    ];
  },
};

export default nextConfig;
