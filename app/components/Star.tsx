"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";

// ── 5-pointed star polygon points (viewBox 0 0 100 100) ──
// outer R=45, inner r=18, starting from top (-90°)
const STAR_POINTS =
  "50,5 60.58,35.44 92.8,36.09 67.12,55.56 76.45,86.42 50,68 23.55,86.42 32.88,55.56 7.2,36.09 39.42,35.44";

const G_START = "#cb30ae";
const G_END   = "#5634b9";

// ── Reusable 5-pointed star SVG ──
function StarSVG({
  size,
  opacity = 1,
  rotate = 0,
  glowBlur = 5,
  visited = false,
}: {
  size: number;
  opacity?: number;
  rotate?: number;
  glowBlur?: number;
  visited?: boolean;
}) {
  const blur1 = glowBlur;
  const blur2 = glowBlur * 1.8;
  const shadow = visited
    ? `drop-shadow(0 0 ${blur1}px rgba(223,204,61,0.9)) drop-shadow(0 0 ${blur2}px rgba(223,204,61,0.5))`
    : `drop-shadow(0 0 ${blur1}px rgba(203,48,174,0.85)) drop-shadow(0 0 ${blur2}px rgba(86,52,185,0.55))`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: `rotate(${rotate}deg)`,
        opacity,
        display: "block",
        overflow: "visible",
        filter: shadow,
        willChange: "transform",
        transition: "filter 0.6s ease",
      }}
    >
      <polygon
        points={STAR_POINTS}
        fill={visited ? "#dfcc3d" : "url(#star-grad)"}
        style={{ transition: "fill 0.6s ease" }}
      />
    </svg>
  );
}

interface StarProps {
  id: number;
  x: number;
  y: number;
  label: string;
  size?: number;
  delay?: number;
  visited?: boolean;
  onClick: (id: number) => void;
}

interface MiniStar {
  angle: number;
  dist: number;
  duration: number;
  delay: number;
  pSize: number;
  initRotate: number;
  endRotate: number;
}

export default function Star({
  id,
  x,
  y,
  label,
  size = 6,
  delay = 0,
  visited = false,
  onClick,
}: StarProps) {
  const [hovered, setHovered] = useState(false);

  // Core visual size in px
  const S = size * 5;

  // Build stable mini-star list
  const miniStars = useMemo<MiniStar[]>(() => {
    const count = 10;
    return Array.from({ length: count }, (_, i) => ({
      angle: (360 / count) * i + (Math.random() * 20 - 10),
      dist: S * 1.8 + Math.random() * S * 1.2,
      duration: 1.6 + Math.random() * 1.6,
      delay: Math.random() * 2.8,
      pSize: 6 + Math.random() * 8,
      initRotate: Math.random() * 90,
      endRotate: 180 + Math.random() * 180,
    }));
  }, [S]);

  return (
    <motion.div
      className="absolute z-10"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 1.2, ease: "easeOut" }}
    >
      {/* ── Outer ambient glow (gradient blob) ── */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: S * 6,
          height: S * 6,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, rgba(203,48,174,0.18) 0%, rgba(86,52,185,0.1) 50%, transparent 70%)`,
          filter: "blur(6px)",
        }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.65, 0.3] }}
        transition={{ duration: 3.5 + Math.random() * 1.5, repeat: Infinity, delay }}
      />

      {/* ── Inner glow halo ── */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: S * 3.5,
          height: S * 3.5,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, rgba(203,48,174,0.28) 0%, rgba(86,52,185,0.14) 55%, transparent 75%)`,
          filter: "blur(4px)",
        }}
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: delay + 0.4 }}
      />

      {/* ── Mini floating stars ── */}
      {miniStars.map((ms, i) => {
        const rad = (ms.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * ms.dist;
        const ty = Math.sin(rad) * ms.dist;
        return (
          <motion.div
            key={`ms-${id}-${i}`}
            className="absolute pointer-events-none"
            style={{
              width: ms.pSize,
              height: ms.pSize,
              left: "50%",
              top: "50%",
              marginLeft: -(ms.pSize / 2),
              marginTop: -(ms.pSize / 2),
            }}
            animate={{
              x: [0, tx * 0.45, tx],
              y: [0, ty * 0.45, ty],
              opacity: [0, 1, 0],
              scale: [0.3, 1.1, 0.2],
              rotate: [ms.initRotate, ms.endRotate],
            }}
            transition={{
              duration: ms.duration,
              repeat: Infinity,
              delay: ms.delay,
              ease: "easeOut",
              repeatDelay: 0.2 + Math.random() * 1.0,
            }}
          >
            <StarSVG size={ms.pSize} glowBlur={3} visited={visited} />
          </motion.div>
        );
      })}

      {/* ── Main star — clickable ── */}
      <motion.button
        className="relative cursor-pointer focus:outline-none"
        style={{
          width: S,
          height: S,
          background: "none",
          border: "none",
          padding: 0,
        }}
        animate={{
          scale: hovered ? [1.3, 1.5, 1.3] : [0.9, 1.08, 0.9],
          rotate: hovered ? [0, 5, -5, 0] : [0, 3, -3, 0],
        }}
        transition={{
          duration: hovered ? 1.2 : 2.6 + Math.random() * 1.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onClick(id)}
        aria-label={label}
      >
        <StarSVG size={S} glowBlur={hovered ? 9 : 6} visited={visited} />
      </motion.button>

      {/* ── Hover label ── */}
      <motion.div
        className="absolute left-1/2 pointer-events-none whitespace-nowrap"
        style={{
          bottom: S + 10,
          transform: "translateX(-50%)",
          textShadow: "0 0 12px rgba(203,48,174,0.9), 0 0 24px rgba(86,52,185,0.6)",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.35 }}
      >
        <span
          className="text-sm md:text-base font-light tracking-wide italic"
          style={{
            backgroundImage: visited
              ? "linear-gradient(90deg, #dfcc3d, #b8a020)"
              : `linear-gradient(90deg, ${G_START}, ${G_END})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            transition: "background-image 0.6s ease",
          }}
        >
          {label}
        </span>
      </motion.div>
    </motion.div>
  );
}
