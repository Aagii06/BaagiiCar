import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const nextConfig = (phase: string): NextConfig => ({
  // `next build` writes a static site to out/, served by nginx (no Node server).
  // Build only: under `next dev` export mode would reject every /cars/<id> but
  // the placeholder one.
  output: phase === PHASE_PRODUCTION_BUILD ? "export" : undefined,
  // Pin the Turbopack root to this folder so a stray lockfile higher up
  // (e.g. in ~/) isn't picked as the workspace root.
  turbopack: {
    root: __dirname,
  },
  // `next dev` only lets localhost use its dev endpoints (the HMR websocket,
  // /_next/*). Allow the office LAN too, so another computer opening
  // http://192.168.10.x:3790 gets live updates instead of a websocket error.
  allowedDevOrigins: ["192.168.10.*"],
});

export default nextConfig;
