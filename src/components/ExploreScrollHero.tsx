"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, Crown, Lock, Sparkles } from "lucide-react";
import { STARSKY_ASSETS } from "@/config/assets";

interface DecodedFrameEntry {
  pts: number;
  bitmap: ImageBitmap;
}

interface ParsedAvcTrack {
  codec: string;
  codedWidth: number;
  codedHeight: number;
  avcC: Uint8Array;
  samples: Array<{
    offset: number;
    size: number;
    pts: number;
    isKey: boolean;
  }>;
}

/**
 * Lightweight ISO-BMFF (MP4) H.264 sample & PTS extractor for WebCodecs VideoDecoder.
 * Enables 60fps forward and reverse scroll scrubbing even on MP4 files encoded with
 * a single keyframe (long GOP).
 */
function parseMp4AvcTrack(arrayBuffer: ArrayBuffer): ParsedAvcTrack | null {
  try {
    const view = new DataView(arrayBuffer);
    const bytes = new Uint8Array(arrayBuffer);

    const readAscii = (offset: number, len: number): string => {
      let s = "";
      for (let i = 0; i < len; i++) {
        s += String.fromCharCode(bytes[offset + i]);
      }
      return s;
    };

    const findBoxes = (start: number, end: number) => {
      const list: Array<{
        type: string;
        offset: number;
        size: number;
        contentStart: number;
        contentEnd: number;
      }> = [];
      let off = start;
      while (off + 8 <= end) {
        let sz = view.getUint32(off);
        const tp = readAscii(off + 4, 4);
        let hdr = 8;
        if (sz === 1) {
          sz = Number(view.getBigUint64(off + 8));
          hdr = 16;
        } else if (sz === 0) {
          sz = end - off;
        }
        if (sz < hdr || off + sz > end) break;
        list.push({
          type: tp,
          offset: off,
          size: sz,
          contentStart: off + hdr,
          contentEnd: off + sz,
        });
        off += sz;
      }
      return list;
    };

    const rootBoxes = findBoxes(0, bytes.length);
    const moov = rootBoxes.find((b) => b.type === "moov");
    if (!moov) return null;

    const traks = findBoxes(moov.contentStart, moov.contentEnd).filter(
      (b) => b.type === "trak"
    );

    for (const trak of traks) {
      const mdia = findBoxes(trak.contentStart, trak.contentEnd).find(
        (b) => b.type === "mdia"
      );
      if (!mdia) continue;
      const mdiaChildren = findBoxes(mdia.contentStart, mdia.contentEnd);
      const hdlr = mdiaChildren.find((b) => b.type === "hdlr");
      if (!hdlr) continue;
      const handlerType = readAscii(hdlr.contentStart + 8, 4);
      if (handlerType !== "vide") continue;

      const minf = mdiaChildren.find((b) => b.type === "minf");
      if (!minf) continue;
      const stbl = findBoxes(minf.contentStart, minf.contentEnd).find(
        (b) => b.type === "stbl"
      );
      if (!stbl) continue;
      const stblChildren = findBoxes(stbl.contentStart, stbl.contentEnd);

      const stsd = stblChildren.find((b) => b.type === "stsd");
      const stsc = stblChildren.find((b) => b.type === "stsc");
      const stsz = stblChildren.find((b) => b.type === "stsz");
      const stco = stblChildren.find((b) => b.type === "stco");
      const co64 = stblChildren.find((b) => b.type === "co64");
      const stss = stblChildren.find((b) => b.type === "stss");
      const stts = stblChildren.find((b) => b.type === "stts");
      const ctts = stblChildren.find((b) => b.type === "ctts");

      if (!stsd || !stsc || !stsz || (!stco && !co64)) continue;

      const entryOff = stsd.contentStart + 8;
      const entrySize = view.getUint32(entryOff);
      const entryType = readAscii(entryOff + 4, 4);
      if (entryType !== "avc1" && entryType !== "avc3") continue;

      const codedWidth = view.getUint16(entryOff + 32);
      const codedHeight = view.getUint16(entryOff + 34);
      const subBoxes = findBoxes(entryOff + 86, entryOff + entrySize);
      const avcCBox = subBoxes.find((b) => b.type === "avcC");
      if (!avcCBox) continue;

      const avcC = bytes.slice(avcCBox.contentStart, avcCBox.contentEnd);
      const profile = avcC[1].toString(16).padStart(2, "0");
      const compat = avcC[2].toString(16).padStart(2, "0");
      const level = avcC[3].toString(16).padStart(2, "0");
      const codec = `${entryType}.${profile}${compat}${level}`;

      // Chunk offsets
      const chunkOffsets: number[] = [];
      if (stco) {
        const count = view.getUint32(stco.contentStart + 4);
        for (let i = 0; i < count; i++) {
          chunkOffsets.push(view.getUint32(stco.contentStart + 8 + i * 4));
        }
      } else if (co64) {
        const count = view.getUint32(co64.contentStart + 4);
        for (let i = 0; i < count; i++) {
          chunkOffsets.push(
            Number(view.getBigUint64(co64.contentStart + 8 + i * 8))
          );
        }
      }

      // Sample sizes
      const uniformSize = view.getUint32(stsz.contentStart + 4);
      const sampleCount = view.getUint32(stsz.contentStart + 8);
      const sampleSizes: number[] = [];
      for (let i = 0; i < sampleCount; i++) {
        sampleSizes.push(
          uniformSize !== 0
            ? uniformSize
            : view.getUint32(stsz.contentStart + 12 + i * 4)
        );
      }

      // Sync samples (keyframes)
      const keyframeSet = new Set<number>();
      if (stss) {
        const syncCount = view.getUint32(stss.contentStart + 4);
        for (let i = 0; i < syncCount; i++) {
          keyframeSet.add(view.getUint32(stss.contentStart + 8 + i * 4) - 1);
        }
      } else {
        keyframeSet.add(0);
      }

      // Decoding Time Stamps (stts)
      const dtsList: number[] = [];
      if (stts) {
        const count = view.getUint32(stts.contentStart + 4);
        let curDts = 0;
        for (let i = 0; i < count; i++) {
          const sCount = view.getUint32(stts.contentStart + 8 + i * 8);
          const sDelta = view.getUint32(stts.contentStart + 12 + i * 8);
          for (let j = 0; j < sCount; j++) {
            dtsList.push(curDts);
            curDts += sDelta;
          }
        }
      }

      // Composition Time Offsets (ctts)
      const ctsOffsets: number[] = [];
      if (ctts) {
        const version = view.getUint8(ctts.contentStart);
        const count = view.getUint32(ctts.contentStart + 4);
        for (let i = 0; i < count; i++) {
          const sCount = view.getUint32(ctts.contentStart + 8 + i * 8);
          const sOffset =
            version === 0
              ? view.getUint32(ctts.contentStart + 12 + i * 8)
              : view.getInt32(ctts.contentStart + 12 + i * 8);
          for (let j = 0; j < sCount; j++) {
            ctsOffsets.push(sOffset);
          }
        }
      }

      // Sample-to-chunk mapping (stsc)
      const stscCount = view.getUint32(stsc.contentStart + 4);
      const stscEntries: Array<{
        firstChunk: number;
        samplesPerChunk: number;
      }> = [];
      for (let i = 0; i < stscCount; i++) {
        stscEntries.push({
          firstChunk: view.getUint32(stsc.contentStart + 8 + i * 12) - 1,
          samplesPerChunk: view.getUint32(stsc.contentStart + 12 + i * 12),
        });
      }

      const samples: ParsedAvcTrack["samples"] = [];
      let sampleIdx = 0;
      for (
        let chunkIdx = 0;
        chunkIdx < chunkOffsets.length && sampleIdx < sampleCount;
        chunkIdx++
      ) {
        let samplesInChunk = stscEntries[0].samplesPerChunk;
        for (let s = 0; s < stscEntries.length; s++) {
          if (chunkIdx >= stscEntries[s].firstChunk) {
            samplesInChunk = stscEntries[s].samplesPerChunk;
          } else {
            break;
          }
        }
        let currentOffset = chunkOffsets[chunkIdx];
        for (
          let k = 0;
          k < samplesInChunk && sampleIdx < sampleCount;
          k++
        ) {
          const size = sampleSizes[sampleIdx];
          const dts = dtsList[sampleIdx] ?? sampleIdx * 512;
          const cts = ctsOffsets[sampleIdx] ?? 0;
          samples.push({
            offset: currentOffset,
            size,
            pts: dts + cts,
            isKey: keyframeSet.has(sampleIdx),
          });
          currentOffset += size;
          sampleIdx++;
        }
      }

      return { codec, codedWidth, codedHeight, avcC, samples };
    }
    return null;
  } catch {
    return null;
  }
}

interface ExploreScrollHeroProps {
  domainsCount: number;
  totalApprovedScholarsCount: number;
  filteredInternshipsCount: number;
  activeTab: "domains" | "scholars" | "internships";
  onSelectTab: (tab: "domains" | "scholars" | "internships") => void;
  isPremiumUnlocked: boolean;
  freeScholarLimit: number;
  onOpenPremiumModal: (context: string) => void;
  onScrollToDirectory: () => void;
}

export function ExploreScrollHero({
  domainsCount,
  totalApprovedScholarsCount,
  filteredInternshipsCount,
  activeTab,
  onSelectTab,
  isPremiumUnlocked,
  freeScholarLimit,
  onOpenPremiumModal,
  onScrollToDirectory,
}: ExploreScrollHeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const progressTextRef = useRef<HTMLSpanElement | null>(null);
  const stageCaptionRef = useRef<HTMLSpanElement | null>(null);

  const framesRef = useRef<ImageBitmap[]>([]);
  const progressRef = useRef<number>(0);
  const isVideoSeekingRef = useRef<boolean>(false);
  const pendingVideoTimeRef = useRef<number | null>(null);

  const [prefersReducedMotion, setPrefersReducedMotion] =
    useState<boolean>(false);
  const [canvasReady, setCanvasReady] = useState<boolean>(false);
  const [videoReady, setVideoReady] = useState<boolean>(false);

  // Draw a specific ImageBitmap onto the full-bleed canvas using object-fit: cover math
  const drawBitmapCover = useCallback((bitmap: ImageBitmap) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const bw = bitmap.width;
    const bh = bitmap.height;
    if (!cw || !ch || !bw || !bh) return;

    const scale = Math.max(cw / bw, ch / bh);
    const drawW = bw * scale;
    const drawH = bh * scale;
    const offsetX = (cw - drawW) * 0.5;
    const offsetY = (ch - drawH) * 0.5;

    ctx.drawImage(bitmap, offsetX, offsetY, drawW, drawH);
  }, []);

  // Seek HTML5 <video> safely without overlapping seeks
  const seekVideoToProgress = useCallback((progress: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }
    const targetTime = Math.max(
      0,
      Math.min(video.duration - 0.04, progress * video.duration)
    );

    if (isVideoSeekingRef.current) {
      pendingVideoTimeRef.current = targetTime;
      return;
    }

    if (Math.abs(video.currentTime - targetTime) < 0.02) {
      return;
    }

    isVideoSeekingRef.current = true;
    video.currentTime = targetTime;
  }, []);

  // Render frame for current scroll progress [0..1] without triggering React re-renders
  const renderScrollFrame = useCallback(
    (progress: number) => {
      const clamped = Math.max(0, Math.min(1, progress));
      progressRef.current = clamped;

      // Update lightweight DOM progress bar & stage telemetry directly
      if (progressFillRef.current) {
        progressFillRef.current.style.transform = `scaleX(${clamped})`;
      }
      if (progressTextRef.current) {
        progressTextRef.current.textContent = `${Math.round(clamped * 100)}%`;
      }
      if (stageCaptionRef.current) {
        if (clamped < 0.34) {
          stageCaptionRef.current.textContent =
            "Stage 01 • Explore Multidisciplinary Research Domains";
        } else if (clamped < 0.68) {
          stageCaptionRef.current.textContent =
            "Stage 02 • Connect with Verified PhD Scholars";
        } else {
          stageCaptionRef.current.textContent =
            "Stage 03 • Transitioning to Academic Domain Directory ↓";
        }
      }

      const frames = framesRef.current;
      if (frames.length > 0) {
        const frameIndex = Math.min(
          frames.length - 1,
          Math.max(0, Math.round(clamped * (frames.length - 1)))
        );
        const bitmap = frames[frameIndex];
        if (bitmap) {
          drawBitmapCover(bitmap);
          return;
        }
      }

      // Fallback to HTML5 <video> scrubbing while WebCodecs buffer initializes
      seekVideoToProgress(clamped);
    },
    [drawBitmapCover, seekVideoToProgress]
  );

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Keep canvas sized to viewport container
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const section = sectionRef.current;
      if (!canvas || !section) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = section.getBoundingClientRect();
      const targetW = Math.max(320, Math.floor(rect.width * dpr));
      const targetH = Math.max(320, Math.floor(rect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        const frames = framesRef.current;
        if (frames.length > 0) {
          const idx = Math.min(
            frames.length - 1,
            Math.max(0, Math.round(progressRef.current * (frames.length - 1)))
          );
          if (frames[idx]) drawBitmapCover(frames[idx]);
        }
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize, { passive: true });
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [drawBitmapCover]);

  // Decode MP4 into ImageBitmap[] via WebCodecs VideoDecoder for 60fps forward & reverse scrubbing
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (typeof window === "undefined" || !("VideoDecoder" in window)) return;

    let cancelled = false;
    const decodedEntries: DecodedFrameEntry[] = [];

    async function decodeVideoFrames() {
      try {
        const res = await fetch(
          STARSKY_ASSETS.exploreResearchersVideo.livePath
        );
        if (!res.ok) return;
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        const track = parseMp4AvcTrack(buffer);
        if (!track || track.samples.length === 0) return;

        // Sample up to 120 frames evenly across the timeline to keep memory light & scrubbing 60fps
        const totalSamples = track.samples.length;
        const stride = Math.max(1, Math.floor(totalSamples / 120));

        // Sort PTS values to identify which PTS values to keep
        const sortedPts = track.samples
          .map((s) => s.pts)
          .sort((a, b) => a - b);
        const keepPts = new Set<number>();
        for (let i = 0; i < sortedPts.length; i += stride) {
          keepPts.add(sortedPts[i]);
        }
        keepPts.add(sortedPts[0]);
        keepPts.add(sortedPts[sortedPts.length - 1]);

        const pendingBitmaps: Promise<void>[] = [];
        const VideoDecoderCtor = (
          window as unknown as {
            VideoDecoder: typeof VideoDecoder;
            EncodedVideoChunk: typeof EncodedVideoChunk;
          }
        ).VideoDecoder;
        const EncodedVideoChunkCtor = (
          window as unknown as {
            EncodedVideoChunk: typeof EncodedVideoChunk;
          }
        ).EncodedVideoChunk;

        const support = await VideoDecoderCtor.isConfigSupported({
          codec: track.codec,
          codedWidth: track.codedWidth,
          codedHeight: track.codedHeight,
          description: track.avcC,
        });
        if (!support.supported || cancelled) return;

        const decoder = new VideoDecoderCtor({
          output: (videoFrame: VideoFrame) => {
            const pts = videoFrame.timestamp;
            if (cancelled || !keepPts.has(pts)) {
              videoFrame.close();
              return;
            }
            const p = createImageBitmap(videoFrame)
              .then((bitmap) => {
                if (cancelled) {
                  bitmap.close();
                  return;
                }
                decodedEntries.push({ pts, bitmap });
              })
              .catch(() => {})
              .finally(() => {
                videoFrame.close();
              });
            pendingBitmaps.push(p);
          },
          error: () => {},
        });

        decoder.configure({
          codec: track.codec,
          codedWidth: track.codedWidth,
          codedHeight: track.codedHeight,
          description: track.avcC,
        });

        const rawBytes = new Uint8Array(buffer);
        for (let i = 0; i < track.samples.length; i++) {
          if (cancelled) break;
          const s = track.samples[i];
          const chunk = new EncodedVideoChunkCtor({
            type: s.isKey ? "key" : "delta",
            timestamp: s.pts,
            data: rawBytes.subarray(s.offset, s.offset + s.size),
          });
          decoder.decode(chunk);
        }

        await decoder.flush();
        await Promise.all(pendingBitmaps);
        if (decoder.state !== "closed") {
          decoder.close();
        }

        if (cancelled || decodedEntries.length === 0) return;

        // Sort decoded frames in presentation order (PTS)
        decodedEntries.sort((a, b) => a.pts - b.pts);
        framesRef.current = decodedEntries.map((e) => e.bitmap);
        setCanvasReady(true);
        renderScrollFrame(progressRef.current);
      } catch {
        // Fallback to HTML5 <video> seeking if WebCodecs fails
      }
    }

    decodeVideoFrames();

    return () => {
      cancelled = true;
      for (const bmp of framesRef.current) {
        try {
          bmp.close();
        } catch {}
      }
      framesRef.current = [];
    };
  }, [prefersReducedMotion, renderScrollFrame]);

  // Set up GSAP ScrollTrigger pinned scrubbing
  useEffect(() => {
    if (prefersReducedMotion) return;
    const section = sectionRef.current;
    if (!section) return;

    gsap.registerPlugin(ScrollTrigger);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=200%",
      pin: true,
      pinSpacing: true,
      scrub: 0.25,
      anticipatePin: 1,
      onUpdate: (self) => {
        renderScrollFrame(self.progress);
      },
    });

    return () => {
      trigger.kill();
    };
  }, [prefersReducedMotion, renderScrollFrame]);

  const handleVideoSeeked = () => {
    isVideoSeekingRef.current = false;
    if (pendingVideoTimeRef.current !== null) {
      const nextTime = pendingVideoTimeRef.current;
      pendingVideoTimeRef.current = null;
      const video = videoRef.current;
      if (video && Math.abs(video.currentTime - nextTime) >= 0.02) {
        isVideoSeekingRef.current = true;
        video.currentTime = nextTime;
      }
    }
  };

  const handleTabSelection = (tab: "domains" | "scholars" | "internships") => {
    onSelectTab(tab);
    onScrollToDirectory();
  };

  return (
    <section
      ref={sectionRef}
      aria-label="Explore Academic Domains & PhD Scholars Hero"
      className="relative w-full min-h-[calc(100vh-4rem)] h-[calc(100vh-4rem)] bg-[#202124] border-b border-[#E5E7EB] overflow-hidden flex flex-col justify-between select-none"
    >
      {/* Full-Screen Scroll-Driven Video & Canvas Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#202124]"
      >
        {/* Fallback Static Poster */}
        <img
          src={STARSKY_ASSETS.exploreResearchersVideo.posterPath}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* HTML5 Video (Paused — timeline controlled strictly by scroll position) */}
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          poster={STARSKY_ASSETS.exploreResearchersVideo.posterPath}
          onLoadedMetadata={() => {
            setVideoReady(true);
            seekVideoToProgress(progressRef.current);
          }}
          onSeeked={handleVideoSeeked}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          style={{ objectFit: "cover" }}
        >
          <source
            src={STARSKY_ASSETS.exploreResearchersVideo.livePath}
            type="video/mp4"
          />
          <source
            src={STARSKY_ASSETS.exploreResearchersVideo.staticPath}
            type="video/mp4"
          />
        </video>

        {/* High-Frame-Rate Scrubbing Canvas (60fps forward & reverse scrubbing) */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ${
            canvasReady && !prefersReducedMotion ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Subtle Readability Gradient Scrims (STARSKY Charcoal & Orange) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#202124]/92 via-[#202124]/75 to-[#202124]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#202124]/90 via-transparent to-[#202124]/45" />
      </div>

      {/* Main Hero Content Container */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-8 flex-1 flex flex-col justify-between">
        {/* Top Row: Badge, Heading, Description */}
        <div className="max-w-3xl space-y-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-xs font-bold uppercase tracking-wider text-[#2563EB] shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Academic Discovery & Directory</span>
            </span>

            {isPremiumUnlocked ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-xs text-[11px] font-semibold text-emerald-200">
                <Crown className="w-3 h-3 text-[#2563EB]" />
                <span>STARSKY Premium Unlocked — Full Directory Access</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() =>
                  onOpenPremiumModal("Full PhD Scholar Directory Access")
                }
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#EFF6FF]/95 border border-[#2563EB]/40 text-[11px] font-semibold text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition-colors shadow-xs"
              >
                <Lock className="w-3 h-3" />
                <span>
                  Free Preview ({freeScholarLimit} of{" "}
                  {totalApprovedScholarsCount} Scholars) • Upgrade
                </span>
              </button>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold text-white tracking-tight leading-[1.12] drop-shadow-xs">
            Explore Academic Domains &amp; PhD Scholars
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-gray-200 max-w-2xl leading-relaxed">
            Browse 9 multidisciplinary academic domains, drill down into
            specialized research tracks, and discover verified PhD scholars
            offering internships.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="pt-2">
            <div className="inline-flex flex-wrap rounded-xl bg-white/95 backdrop-blur-md p-1.5 border border-white/20 shadow-lg gap-1">
              <button
                type="button"
                onClick={() => handleTabSelection("domains")}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "domains"
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "text-[#202124] hover:bg-[#F7F8FA]"
                }`}
              >
                1. Academic Domains ({domainsCount})
              </button>
              <button
                type="button"
                onClick={() => handleTabSelection("scholars")}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "scholars"
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "text-[#202124] hover:bg-[#F7F8FA]"
                }`}
              >
                2. PhD Scholar Directory ({totalApprovedScholarsCount})
              </button>
              <button
                type="button"
                onClick={() => handleTabSelection("internships")}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "internships"
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "text-[#202124] hover:bg-[#F7F8FA]"
                }`}
              >
                3. Open Internships ({filteredInternshipsCount})
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: Scroll-Driven Video Scrubbing Bar & Skip Action */}
        <div className="pt-6 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span
                ref={stageCaptionRef}
                className="font-semibold text-white tracking-wide"
              >
                {prefersReducedMotion
                  ? "Scroll down to explore Academic Domains"
                  : "Scroll to scrub research timeline • Stage 01"}
              </span>
              {!prefersReducedMotion && (
                <span
                  ref={progressTextRef}
                  className="font-mono font-bold text-[#2563EB]"
                >
                  0%
                </span>
              )}
            </div>

            {!prefersReducedMotion && (
              <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div
                  ref={progressFillRef}
                  className="h-full w-full bg-[#2563EB] origin-left transition-transform duration-75"
                  style={{ transform: "scaleX(0)" }}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onScrollToDirectory}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-[#2563EB] text-white border border-white/25 hover:border-[#2563EB] text-xs font-semibold backdrop-blur-xs transition-all self-start sm:self-center"
          >
            <span>Jump to Select an Academic Domain</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
}

