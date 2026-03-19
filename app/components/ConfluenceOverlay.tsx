"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/* ── Star polygon (reused from Star component) */
const STAR_POINTS =
  "50,5 60.58,35.44 92.8,36.09 67.12,55.56 76.45,86.42 50,68 23.55,86.42 32.88,55.56 7.2,36.09 39.42,35.44";

type Phase = "glow" | "converge" | "fadeout" | "video" | "modal";

export interface StarPosition {
  x: number; // screen px
  y: number; // screen px
}

interface ConfluenceOverlayProps {
  stars: StarPosition[];       // 4, 8 or 12 star screen positions
  milestone: 4 | 8 | 12;
  imageSrc: string;
  text: string;
  onComplete: () => void;      // called when user closes the special modal
}

const MILESTONE_TITLE: Record<number, string> = {
  4:  "Un mensaje del universo",
  8:  "El universo habla de nuevo",
  12: "El universo completo es tuyo",
};

/* ── Small star SVG rendered in overlay */
function OverlayStar({ size, phase }: { size: number; phase: Phase }) {
  const glowing = phase === "glow";
  // Drop-shadow only during glow phase — removes expensive filter repaint while stars move
  const filterStyle = glowing
    ? `drop-shadow(0 0 16px rgba(255,220,80,0.95))
       drop-shadow(0 0 28px rgba(203,48,174,0.7))
       drop-shadow(0 0 42px rgba(86,52,185,0.4))`
    : "none";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        display: "block",
        overflow: "visible",
        filter: filterStyle,
        transition: "filter 0.4s ease",
      }}
    >
      <polygon points={STAR_POINTS} fill="url(#star-grad)" />
    </svg>
  );
}

export default function ConfluenceOverlay({
  stars,
  milestone,
  imageSrc,
  text,
  onComplete,
}: ConfluenceOverlayProps) {
  const [phase, setPhase] = useState<Phase>("glow");
  const [showModal, setShowModal] = useState(false);
  const [visible, setVisible] = useState(true);
  const [videoOpacity, setVideoOpacity] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const cx = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
  const cy = typeof window !== "undefined" ? window.innerHeight / 2 : 0;

  // Drive the phase timeline
  useEffect(() => {
    // glow → converge
    const t1 = setTimeout(() => setPhase("converge"), 900);
    // converge → fadeout: stars fade out, video starts
    const t2 = setTimeout(() => {
      setPhase("fadeout");
      // Start loading & playing the video, then fade it in
      const vid = videoRef.current;
      if (vid) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
        setTimeout(() => setVideoOpacity(1), 200);
      }
    }, 2400);
    // fadeout → video: stars are gone
    const t3 = setTimeout(() => setPhase("video"), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Monitor video time — fade out 2.5s before end → show modal
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    function handleTimeUpdate() {
      if (!vid) return;
      const remaining = vid.duration - vid.currentTime;
      if (remaining <= 2.5 && phase === "video") {
        setVideoOpacity(0);
        setTimeout(() => {
          setPhase("modal");
          setShowModal(true);
        }, 700);
      }
    }

    // Fallback: if video ends without triggering timeupdate in time
    function handleEnded() {
      setVideoOpacity(0);
      setPhase("modal");
      setShowModal(true);
    }

    vid.addEventListener("timeupdate", handleTimeUpdate);
    vid.addEventListener("ended", handleEnded);
    return () => {
      vid.removeEventListener("timeupdate", handleTimeUpdate);
      vid.removeEventListener("ended", handleEnded);
    };
  }, [phase]);

  const handleClose = () => {
    setShowModal(false);
    setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 500);
  };

  if (!visible) return null;

  const starSize = 56;
  const half = starSize / 2;
  const isConverging = phase === "converge" || phase === "fadeout" || phase === "video" || phase === "modal";
  const isFadingOut = phase === "fadeout" || phase === "video" || phase === "modal";

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ pointerEvents: phase === "modal" ? "auto" : "none" }}
    >
      {/* Dark backdrop */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0)" }}
        animate={{
          background:
            phase === "glow"
              ? "rgba(0,0,0,0.2)"
              : phase === "converge"
              ? "rgba(0,0,0,0.55)"
              : "rgba(0,0,0,0.95)",
        }}
        transition={{ duration: 0.8 }}
      />

      {/* ── Video — fullscreen behind everything ── */}
      <div
        className="absolute inset-0"
        style={{
          opacity: videoOpacity,
          transition: "opacity 0.8s ease",
          zIndex: 1,
        }}
      >
        <video
          ref={videoRef}
          src="/videos/xplosion%20stars.mp4"
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted={false}
          preload="auto"
        />
      </div>

      {/* ── Animated stars ── */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        {stars.map((pos, i) => {
          const delay = i * 0.06;
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: pos.x - half,
                top: pos.y - half,
                width: starSize,
                height: starSize,
              }}
              animate={
                isConverging
                  ? {
                      x: cx - pos.x,
                      y: cy - pos.y,
                      scale: isFadingOut ? 0.6 : [1.8, 1.8],
                      opacity: isFadingOut ? 0 : 1,
                    }
                  : {
                      scale: [1.2, 2.0, 1.2],
                      x: 0,
                      y: 0,
                      opacity: 1,
                    }
              }
              transition={
                isConverging
                  ? {
                      x: { duration: 1.0, ease: [0.4, 0, 0.2, 1], delay },
                      y: { duration: 1.0, ease: [0.4, 0, 0.2, 1], delay },
                      scale: { duration: isFadingOut ? 0.8 : 0.5, delay: isFadingOut ? delay * 0.5 : 0 },
                      opacity: { duration: 0.9, delay: isFadingOut ? delay * 0.5 : 0 },
                    }
                  : {
                      scale: {
                        duration: 0.7,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.15,
                      },
                    }
              }
            >
              <OverlayStar size={starSize} phase={phase} />
            </motion.div>
          );
        })}
      </div>

      {/* ── Special modal ── */}
      <div className="absolute inset-0" style={{ zIndex: 3 }}>
        <AnimatePresence>
          {showModal && (
            <>
              {/* Backdrop blur */}
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.6)", pointerEvents: "none" }}
              />

              {/* Centering wrapper */}
              <div className="absolute inset-0 flex items-center justify-center p-4" onClick={handleClose}>
                {/* Modal card */}
                <motion.div
                  className="relative max-w-md w-full rounded-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "linear-gradient(145deg, rgba(20,10,40,0.97), rgba(8,4,20,0.99))",
                    border: "1px solid rgba(223,204,61,0.2)",
                    boxShadow:
                      "0 0 60px rgba(223,204,61,0.15), 0 0 120px rgba(203,48,174,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
                  }}
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.2, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.1 }}
                >
                  {/* Close */}
                  <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white cursor-pointer"
                    aria-label="Cerrar"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Image */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    <div
                      className="absolute inset-0 z-10"
                      style={{
                        background: "linear-gradient(to bottom, transparent 55%, rgba(8,4,20,0.99) 100%)",
                      }}
                    />
                    <Image src={imageSrc} alt="Mensaje especial" fill className="object-cover" sizes="448px" />
                  </div>

                  {/* Text content */}
                  <div className="relative px-6 pb-7 -mt-10 z-10">
                    {/* Decorative mini-star */}
                    <motion.div
                      className="flex justify-center mb-3"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                    >
                      <svg width="28" height="28" viewBox="0 0 100 100" style={{ filter: "drop-shadow(0 0 8px rgba(223,204,61,0.8))" }}>
                        <polygon points={STAR_POINTS} fill="#dfcc3d" />
                      </svg>
                    </motion.div>

                    <motion.h3
                      className="text-center text-xl md:text-2xl font-light mb-3 tracking-wide"
                      style={{
                        backgroundImage: "linear-gradient(90deg, #dfcc3d, #cb30ae, #5634b9)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      {MILESTONE_TITLE[milestone]}
                    </motion.h3>

                    <motion.p
                      className="text-sm md:text-base text-white/75 leading-relaxed font-light italic text-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.65 }}
                    >
                      {text}
                    </motion.p>
                  </div>

                  {/* Corner glow accents */}
                  <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle, rgba(223,204,61,0.07) 0%, transparent 70%)" }} />
                  <div className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle, rgba(203,48,174,0.07) 0%, transparent 70%)" }} />
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
