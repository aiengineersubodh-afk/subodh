/**
 * STARSKY Centralized Visual Asset Configuration
 *
 * All videos and images referenced on the Homepage and Explore Researchers page
 * are configured in this single file.
 *
 * Automatic Asset Replacement Workflow:
 * - Source folders in project root:
 *   1. `videos/home/background.mp4`
 *   2. `videos/Explore Researchers/background.mp4`
 *   3. `videos/Why Choose STARSKY/background.mp4`
 *   4. `images/How STARSKY Works/Explore Researchers.png`
 *   5. `images/How STARSKY Works/Discover Opportunities.png`
 *   6. `images/How STARSKY Works/Apply & Collaborate.png`
 *
 * - Primary `livePath` routes through `/api/assets/...` which streams directly from
 *   the project's `./videos` and `./images` folders with live ETag (`mtime` + `size`)
 *   revalidation and HTTP 206 Byte-Range support. Replacing any file on disk updates
 *   the website automatically on browser refresh without requiring code changes.
 * - Secondary `staticPath` points to `/videos/...` and `/images/...` inside `./public`
 *   (automatically synced via `scripts/sync-assets.mjs` during `npm run dev` & `npm run build`).
 */

export interface VideoAssetConfig {
  /** Live streaming route that reads directly from `./videos/...` with ETag revalidation */
  livePath: string;
  /** Static public fallback path under `./public/videos/...` */
  staticPath: string;
  /** Static poster fallback image */
  posterPath: string;
  /** Project-relative source file path for documentation & replacement */
  sourceDiskRelative: string;
}

export interface ImageAssetConfig {
  /** Live streaming route that reads directly from `./images/...` with ETag revalidation */
  livePath: string;
  /** Static public fallback path under `./public/images/...` */
  staticPath: string;
  /** Project-relative source file path for documentation & replacement */
  sourceDiskRelative: string;
}

export const STARSKY_ASSETS = {
  homeHeroVideo: {
    livePath: "/api/assets/videos/home/background.mp4",
    staticPath: "/videos/home/background.mp4",
    posterPath: "/videos/starsky-research-hero-poster.svg",
    sourceDiskRelative: "videos/home/background.mp4",
  } satisfies VideoAssetConfig,

  exploreResearchersVideo: {
    livePath: "/api/assets/videos/Explore%20Researchers/background.mp4",
    staticPath: "/videos/Explore%20Researchers/background.mp4",
    posterPath: "/videos/starsky-research-hero-poster.svg",
    sourceDiskRelative: "videos/Explore Researchers/background.mp4",
  } satisfies VideoAssetConfig,

  whyChooseStarskyVideo: {
    livePath: "/api/assets/videos/Why%20Choose%20STARSKY/background.mp4",
    staticPath: "/videos/Why%20Choose%20STARSKY/background.mp4",
    posterPath: "/videos/starsky-research-hero-poster.svg",
    sourceDiskRelative: "videos/Why Choose STARSKY/background.mp4",
  } satisfies VideoAssetConfig,

  howStarskyWorksCards: {
    exploreResearchers: {
      livePath:
        "/api/assets/images/How%20STARSKY%20Works/Explore%20Researchers.png",
      staticPath: "/images/How%20STARSKY%20Works/Explore%20Researchers.png",
      sourceDiskRelative: "images/How STARSKY Works/Explore Researchers.png",
    } satisfies ImageAssetConfig,

    discoverOpportunities: {
      livePath:
        "/api/assets/images/How%20STARSKY%20Works/Discover%20Opportunities.png",
      staticPath: "/images/How%20STARSKY%20Works/Discover%20Opportunities.png",
      sourceDiskRelative:
        "images/How STARSKY Works/Discover Opportunities.png",
    } satisfies ImageAssetConfig,

    applyAndCollaborate: {
      livePath:
        "/api/assets/images/How%20STARSKY%20Works/Apply%20%26%20Collaborate.png",
      staticPath: "/images/How%20STARSKY%20Works/Apply%20%26%20Collaborate.png",
      sourceDiskRelative: "images/How STARSKY Works/Apply & Collaborate.png",
    } satisfies ImageAssetConfig,
  },
} as const;

