"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

/* ── Star polygon (reused from Star component) */
const STAR_POINTS =
  "50,5 60.58,35.44 92.8,36.09 67.12,55.56 76.45,86.42 50,68 23.55,86.42 32.88,55.56 7.2,36.09 39.42,35.44";

type Phase = "glow" | "converge" | "flash" | "modal";

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
function OverlayStar({
  size,
  phase,
  delay = 0,
}: {
  size: number;
  phase: Phase;
  delay?: number;
}) {
  const glowing = phase === "glow";
  const blur1 = glowing ? 16 : 6;
  const blur2 = glowing ? 28 : 10;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        display: "block",
        overflow: "visible",
        filter: `drop-shadow(0 0 ${blur1}px rgba(255,220,80,0.95))
                 drop-shadow(0 0 ${blur2}px rgba(203,48,174,0.7))
                 drop-shadow(0 0 ${blur2 * 1.5}px rgba(86,52,185,0.4))`,
        transition: `filter ${0.4 + delay}s ease`,
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

  const cx = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
  const cy = typeof window !== "undefined" ? window.innerHeight / 2 : 0;

  // Drive the phase timeline
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("converge"), 900);
    const t2 = setTimeout(() => setPhase("flash"), 2400);
    const t3 = setTimeout(() => {
      setPhase("modal");
      setShowModal(true);
    }, 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

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

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ pointerEvents: phase === "modal" ? "auto" : "none" }}
    >
      {/* Dark backdrop — fades in as stars glow */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0)" }}
        animate={{
          background:
            phase === "glow"
              ? "rgba(0,0,0,0.2)"
              : phase === "converge"
              ? "rgba(0,0,0,0.55)"
              : "rgba(0,0,0,0.82)",
        }}
        transition={{ duration: 0.8 }}
      />

      {/* ── Animated stars ── */}
      {stars.map((pos, i) => {
        const isConverging = phase === "converge" || phase === "flash" || phase === "modal";
        const isFlash = phase === "flash" || phase === "modal";
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
                    scale: isFlash ? 0 : [1.8, 1.8],
                    opacity: isFlash ? 0 : 1,
                  }
                : {
                    // Glow phase: pulse in-place
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
                    scale: { duration: 0.5, delay: isFlash ? delay : 0 },
                    opacity: { duration: 0.4, delay: isFlash ? delay : 0 },
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
            {/* Motion trail blur when converging */}
            {isConverging && !isFlash && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,220,80,0.35) 0%, transparent 70%)",
                  scale: 3.5,
                  filter: "blur(12px)",
                }}
                animate={{ opacity: [0.6, 0] }}
                transition={{ duration: 1.0, delay }}
              />
            )}
            <OverlayStar size={starSize} phase={phase} delay={i * 0.1} />
          </motion.div>
        );
      })}

      {/* ── Central flash / bloom ── centered with flex, no transform conflict ── */}
      <AnimatePresence>
        {(phase === "flash" || phase === "modal") && (
          /* Flex centering wrapper — no transform used here */
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* White core burst */}
            <motion.div
              className="absolute rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,220,80,0.8) 30%, rgba(203,48,174,0.5) 60%, transparent 100%)",
              }}
              initial={{ width: 0, height: 0, opacity: 1 }}
              animate={{
                width: phase === "modal" ? 0 : 700,
                height: phase === "modal" ? 0 : 700,
                opacity: phase === "modal" ? 0 : [0, 1, 0.8],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
            {/* Outer soft ring 1 */}
            <motion.div
              className="absolute rounded-full"
              style={{
                background:
                  "radial-gradient(circle, transparent 20%, rgba(203,48,174,0.3) 50%, transparent 80%)",
              }}
              initial={{ width: 0, height: 0, opacity: 0 }}
              animate={{
                width: phase === "modal" ? 0 : 1200,
                height: phase === "modal" ? 0 : 1200,
                opacity: phase === "modal" ? 0 : [0, 0.7, 0],
              }}
              transition={{ duration: 1.0, ease: "easeOut", delay: 0.1 }}
            />
            {/* Outer soft ring 2 */}
            <motion.div
              className="absolute rounded-full"
              style={{
                background:
                  "radial-gradient(circle, transparent 30%, rgba(86,52,185,0.2) 60%, transparent 85%)",
              }}
              initial={{ width: 0, height: 0, opacity: 0 }}
              animate={{
                width: phase === "modal" ? 0 : 1800,
                height: phase === "modal" ? 0 : 1800,
                opacity: phase === "modal" ? 0 : [0, 0.5, 0],
              }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ── Special modal ── */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop — visual blur/dim only, no onClick needed */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.6)", pointerEvents: "none" }}
            />

            {/* Centering wrapper — intercepts outside clicks to close */}
            <div className="absolute inset-0 flex items-center justify-center p-4" onClick={handleClose}>
            {/* Modal card — stop propagation so inner clicks don't close */}
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
                    textShadow: "none",
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

              {/* Gold corner glow accents */}
              <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(223,204,61,0.07) 0%, transparent 70%)" }} />
              <div className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(203,48,174,0.07) 0%, transparent 70%)" }} />
            </motion.div>
            </div>{/* end centering wrapper */}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
