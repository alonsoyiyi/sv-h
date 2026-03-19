"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Star from "./components/Star";
import StarModal from "./components/StarModal";
import ConfluenceOverlay, { StarPosition } from "./components/ConfluenceOverlay";

/* ─────────────────────────────────────────────
   DATA  – 12 estrellas con posiciones, textos,
   imágenes y labels de hover.
   Las posiciones (x, y) son porcentajes dentro
   del "mundo" expandido.
   ───────────────────────────────────────────── */
interface StarData {
  id: number;
  x: number;
  y: number;
  label: string;
  text: string;
  image: string;
  size: number;
}

const STARS: StarData[] = [
  {
    id: 1,
    x: 12,
    y: 15,
    label: "Nuestro primer encuentro",
    text: "El día que te vi por primera vez, supe que mi vida cambiaría para siempre. Tu sonrisa iluminó todo mi universo.",
    image: "/photos/1.jpg",
    size: 7,
  },
  {
    id: 2,
    x: 35,
    y: 8,
    label: "Tu sonrisa",
    text: "Cada vez que sonríes, las estrellas se ponen celosas. Eres la luz más hermosa de mi galaxia.",
    image: "/photos/2.jpg",
    size: 5,
  },
  {
    id: 3,
    x: 58,
    y: 20,
    label: "Nuestras aventuras",
    text: "Cada momento juntos es una aventura que atesoro en mi corazón. Contigo, hasta lo simple se vuelve mágico.",
    image: "/photos/3.jpg",
    size: 8,
  },
  {
    id: 4,
    x: 82,
    y: 12,
    label: "Tu risa",
    text: "Tu risa es mi melodía favorita. Podría escucharla por toda la eternidad y nunca me cansaría.",
    image: "/photos/4.jpg",
    size: 6,
  },
  {
    id: 5,
    x: 20,
    y: 42,
    label: "Nuestros abrazos",
    text: "En tus brazos encontré mi hogar. No necesito nada más en este universo que tu calidez.",
    image: "/photos/5.jpg",
    size: 7,
  },
  {
    id: 6,
    x: 50,
    y: 48,
    label: "Te amo",
    text: "Tres palabras que se quedan cortas para expresar todo lo que siento por ti. Eres mi todo, mi universo entero.",
    image: "/photos/6.jpg",
    size: 9,
  },
  {
    id: 7,
    x: 75,
    y: 40,
    label: "Nuestros sueños",
    text: "Sueño con un futuro donde cada mañana despierte a tu lado. Tú eres mi sueño más bonito hecho realidad.",
    image: "/photos/7.jpg",
    size: 6,
  },
  {
    id: 8,
    x: 8,
    y: 70,
    label: "Tu mirada",
    text: "Tus ojos son dos galaxias en las que me pierdo. Cada vez que me miras, siento que todo tiene sentido.",
    image: "/photos/8.jpg",
    size: 5,
  },
  {
    id: 9,
    x: 30,
    y: 78,
    label: "Nuestras noches",
    text: "Las noches contigo bajo las estrellas son los momentos más perfectos que he vivido.",
    image: "/photos/9.jpg",
    size: 7,
  },
  {
    id: 10,
    x: 55,
    y: 72,
    label: "Tu voz",
    text: "Tu voz es como una canción de cuna que calma mi alma. Eres la paz que siempre busqué.",
    image: "/photos/10.jpg",
    size: 6,
  },
  {
    id: 11,
    x: 78,
    y: 80,
    label: "Nuestras promesas",
    text: "Te prometo amarte en cada vida, en cada universo, en cada estrella. Siempre serás tú.",
    image: "/photos/11.jpg",
    size: 8,
  },
  {
    id: 12,
    x: 90,
    y: 55,
    label: "Para siempre",
    text: "Si pudiera elegir a alguien una y otra vez, siempre te elegiría a ti. Eres mi eternidad.",
    image: "/photos/12.jpg",
    size: 7,
  },
];

/* ─────────────────────────────────────────────
   WORLD SIZE
   Desktop: wider (horizontal exploration)
   Mobile:  taller (vertical exploration)
   ───────────────────────────────────────────── */
const WORLD_SCALE_X_DESKTOP = 1.6;
const WORLD_SCALE_Y_DESKTOP = 1.4;
const WORLD_SCALE_X_MOBILE = 1.2;
const WORLD_SCALE_Y_MOBILE = 1.8;

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/* ─────────────────────────────────────────────
   CONFLUENCE MILESTONES — configuración por evento
   ───────────────────────────────────────────── */
const CONFLUENCE_CONFIGS: Record<number, { imageSrc: string; text: string }> = {
  4: {
    imageSrc: "/photos/special4.jpg",
    text: "Hoy quiero que sepas que eres la persona más importante de mi vida. Cada estrella de este universo tiene tu nombre, y mi corazón tiene una sola dirección: hacia ti. Te amo hoy, mañana y siempre. ✨",
  },
  8: {
    imageSrc: "/photos/special8.jpg",
    text: "La mitad de este universo ya conoces, y aún hay más por descubrir. Así eres tú para mí: infinita, sorprendente, llena de luz que nunca deja de asombrarme. Gracias por existir. 💫",
  },
  12: {
    imageSrc: "/photos/special12.jpg",
    text: "Lo has visto todo. Has recorrido cada rincón de mi universo y en cada estrella encontraste un pedacito de lo que siento por ti. Este es mi regalo: todo mi amor, puesto en el cielo para que siempre lo veas. Te amo con todo. 🌌❤️",
  },
};

const LS_VISITED    = "sv-h-visited";
const LS_MILESTONES = "sv-h-milestones";

/* ═════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═════════════════════════════════════════════ */
export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  // Direct DOM ref for the parallax world — bypasses React render on every mouse move
  const worldRef = useRef<HTMLDivElement>(null);

  // Target offset written by input handlers; never causes a re-render
  const targetOffsetRef = useRef({ x: 0, y: 0 });
  // Pending requestAnimationFrame id (null = none scheduled)
  const rafRef = useRef<number | null>(null);

  // Mirrors of state values readable inside non-React callbacks without stale closures
  const worldSizeRef = useRef({ w: 0, h: 0 });
  const isMobileRef  = useRef(false);
  const isZoomingRef = useRef(false);
  const showModalRef = useRef(false);

  const [worldSize, setWorldSize] = useState({ w: 0, h: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [activeStar, setActiveStar] = useState<StarData | null>(null);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [ready, setReady] = useState(false);
  const [visitedStars, setVisitedStars] = useState<Set<number>>(new Set());
  const [confluenceActive, setConfluenceActive] = useState(false);
  const [confluencePositions, setConfluencePositions] = useState<StarPosition[]>([]);
  const [confluenceMilestone, setConfluenceMilestone] = useState<4 | 8 | 12>(4);
  // Set of milestone counts that have already been triggered (survives resets via localStorage)
  const triggeredMilestonesRef = useRef<Set<number>>(new Set());

  // Stable particle data — computed once, never causes re-paint churn on re-renders
  const ambientParticles = useMemo(() =>
    Array.from({ length: 50 }, () => ({
      width:  Math.random() * 2 + 1,
      height: Math.random() * 2 + 1,
      left:   Math.random() * 100,
      top:    Math.random() * 100,
      duration: 3 + Math.random() * 4,
      delay:    Math.random() * 3,
    })),
  []);

  /* ── Write target offset directly to the DOM (called from rAF) ── */
  const applyTransform = useCallback(() => {
    rafRef.current = null;
    if (!worldRef.current) return;
    const { x, y } = targetOffsetRef.current;
    worldRef.current.style.transform = `translate(${x}px, ${y}px)`;
  }, []);

  /* ── Schedule one rAF per frame — multiple pointer events → single DOM write ── */
  const scheduleFrame = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(applyTransform);
  }, [applyTransform]);

  /* ── Load persisted state from localStorage (client-only) ── */
  useEffect(() => {
    try {
      const savedVisited = localStorage.getItem(LS_VISITED);
      if (savedVisited) {
        setVisitedStars(new Set(JSON.parse(savedVisited) as number[]));
      }
      const savedMilestones = localStorage.getItem(LS_MILESTONES);
      if (savedMilestones) {
        triggeredMilestonesRef.current = new Set(JSON.parse(savedMilestones) as number[]);
      }
    } catch {}
  }, []);

  /* ── Persist visitedStars to localStorage whenever it changes ── */
  useEffect(() => {
    try {
      localStorage.setItem(LS_VISITED, JSON.stringify([...visitedStars]));
    } catch {}
  }, [visitedStars]);

  /* ── Resize handler ── */
  useEffect(() => {
    function handleResize() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 768;
      setIsMobile(mobile);
      isMobileRef.current = mobile;

      const scaleX = mobile ? WORLD_SCALE_X_MOBILE : WORLD_SCALE_X_DESKTOP;
      const scaleY = mobile ? WORLD_SCALE_Y_MOBILE : WORLD_SCALE_Y_DESKTOP;
      const newSize = { w: vw * scaleX, h: vh * scaleY };
      setWorldSize(newSize);
      worldSizeRef.current = newSize;

      const initX = -(vw * scaleX - vw) / 2;
      const initY = -(vh * scaleY - vh) / 2;
      targetOffsetRef.current = { x: initX, y: initY };
      // Apply immediately (no animation needed on resize)
      if (worldRef.current) {
        worldRef.current.style.transform = `translate(${initX}px, ${initY}px)`;
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    setTimeout(() => setReady(true), 100);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ── Mouse parallax — zero React re-renders ── */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isZoomingRef.current || showModalRef.current) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const { w, h } = worldSizeRef.current;
      const nx = (e.clientX / vw) * 2 - 1;
      const ny = (e.clientY / vh) * 2 - 1;
      const maxPanX = w - vw;
      const maxPanY = h - vh;
      targetOffsetRef.current = {
        x: clamp(-(maxPanX / 2) * (1 + nx), -maxPanX, 0),
        y: clamp(-(maxPanY / 2) * (1 + ny), -maxPanY, 0),
      };
      scheduleFrame();
    },
    [scheduleFrame]
  );

  /* ── Touch move (mobile) ── */
  const lastTouch = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isZoomingRef.current || showModalRef.current) return;
      const t = e.touches[0];
      lastTouch.current = { x: t.clientX, y: t.clientY };
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isZoomingRef.current || showModalRef.current || !lastTouch.current) return;
      const t = e.touches[0];
      const dx = t.clientX - lastTouch.current.x;
      const dy = t.clientY - lastTouch.current.y;
      lastTouch.current = { x: t.clientX, y: t.clientY };

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const { w, h } = worldSizeRef.current;
      const maxPanX = w - vw;
      const maxPanY = h - vh;
      const prev = targetOffsetRef.current;
      targetOffsetRef.current = {
        x: clamp(prev.x + dx, -maxPanX, 0),
        y: clamp(prev.y + dy, -maxPanY, 0),
      };
      scheduleFrame();
    },
    [scheduleFrame]
  );

  /* ── Gyroscope for mobile ── */
  useEffect(() => {
    function handleOrientation(e: DeviceOrientationEvent) {
      if (!isMobileRef.current || isZoomingRef.current || showModalRef.current) return;
      const gamma = e.gamma ?? 0;
      const beta = e.beta ?? 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const { w, h } = worldSizeRef.current;
      const maxPanX = w - vw;
      const maxPanY = h - vh;
      const nx = clamp(gamma / 30, -1, 1);
      const ny = clamp((beta - 45) / 30, -1, 1);
      targetOffsetRef.current = {
        x: clamp(-(maxPanX / 2) * (1 + nx), -maxPanX, 0),
        y: clamp(-(maxPanY / 2) * (1 + ny), -maxPanY, 0),
      };
      scheduleFrame();
    }
    window.addEventListener("deviceorientation", handleOrientation);
    return () =>
      window.removeEventListener("deviceorientation", handleOrientation);
  }, [scheduleFrame]);

  /* ── Star click → zoom → modal ── */
  const handleStarClick = useCallback((id: number) => {
    const star = STARS.find((s) => s.id === id);
    if (!star) return;
    setZoomOrigin({ x: star.x, y: star.y });
    setActiveStar(star);
    isZoomingRef.current = true;
    setIsZooming(true);
    setTimeout(() => {
      showModalRef.current = true;
      setShowModal(true);
    }, 700);
  }, []);

  /* ── Close modal ── */
  const handleCloseModal = useCallback(() => {
    let shouldTriggerConfluence = false;
    let positions: StarPosition[] = [];
    let triggeredMilestone: 4 | 8 | 12 = 4;

    if (activeStar) {
      setVisitedStars((prev) => {
        const next = new Set(prev);
        next.add(activeStar.id);

        // Check each milestone in order — trigger the first untriggered one that matches
        for (const milestone of [4, 8, 12] as const) {
          if (next.size === milestone && !triggeredMilestonesRef.current.has(milestone)) {
            triggeredMilestonesRef.current.add(milestone);
            // Persist which milestones have fired so they don't retrigger on reload
            try {
              localStorage.setItem(LS_MILESTONES, JSON.stringify([...triggeredMilestonesRef.current]));
            } catch {}
            shouldTriggerConfluence = true;
            triggeredMilestone = milestone;
            // Only use the last 4 visited stars — fewer DOM nodes, much cheaper animation
            positions = [...next].slice(-4).map((sid) => {
              const s = STARS.find((st) => st.id === sid)!;
              return {
                x: (s.x / 100) * worldSizeRef.current.w + targetOffsetRef.current.x,
                y: (s.y / 100) * worldSizeRef.current.h + targetOffsetRef.current.y,
              };
            });
            break;
          }
        }
        return next;
      });
    }

    showModalRef.current = false;
    setShowModal(false);
    setTimeout(() => {
      isZoomingRef.current = false;
      setIsZooming(false);
      setActiveStar(null);
      if (shouldTriggerConfluence) {
        setConfluenceMilestone(triggeredMilestone);
        setConfluencePositions(positions);
        // Wait for zoom-out animation (0.6s) to fully finish before mounting overlay
        setTimeout(() => setConfluenceActive(true), 300);
      }
    }, 450);
  }, [activeStar]);

  /* ── Reset all visited stars ── */
  const handleReset = useCallback(() => {
    setVisitedStars(new Set());
    triggeredMilestonesRef.current = new Set();
    try {
      localStorage.removeItem(LS_VISITED);
      localStorage.removeItem(LS_MILESTONES);
    } catch {}
  }, []);

  /* ── Cleanup rAF on unmount ── */
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!ready) {
    return <div className="w-screen h-screen bg-black" />;
  }

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen overflow-hidden relative bg-black"
      onPointerMove={handlePointerMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* ── ZOOM CONTAINER ── */}
      <motion.div
        className="absolute inset-0"
        animate={
          isZooming
            ? {
                scale: 2.5,
                x: `${50 - zoomOrigin.x}%`,
                y: `${50 - zoomOrigin.y}%`,
              }
            : { scale: 1, x: "0%", y: "0%" }
        }
        transition={{
          duration: isZooming ? 0.7 : 0.6,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{ transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }}
      >
        {/* ── PARALLAX WORLD — plain div, CSS transition, transform via ref (off-thread) ── */}
        <div
          ref={worldRef}
          className="absolute"
          style={{
            width: worldSize.w,
            height: worldSize.h,
            // CSS transition runs on the compositor thread, no JS per frame
            transition: "transform 0.75s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            willChange: "transform",
          }}
        >
          {/* ── VIDEO BACKGROUND ── */}
          <video
            className="absolute inset-0 w-full h-full object-cover hidden md:block"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/videos/poster-desktop.jpg"
          >
            <source src="/videos/universe-desktop.mp4" type="video/mp4" />
          </video>

          <video
            className="absolute inset-0 w-full h-full object-cover block md:hidden"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/videos/poster-mobile.jpg"
          >
            <source src="/videos/universe-mobile.mp4" type="video/mp4" />
          </video>

          {/* Fallback gradient if no video */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 20%, rgba(20,10,60,1) 0%, rgba(5,2,15,1) 50%, rgba(0,0,0,1) 100%)",
              zIndex: -1,
            }}
          />

          {/* Depth overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.3) 100%)",
              zIndex: 1,
            }}
          />

          {/* Ambient particles — CSS animation, compositor thread only, zero JS per frame */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {ambientParticles.map((p, i) => (
              <div
                key={`particle-${i}`}
                className="absolute rounded-full bg-white/30"
                style={{
                  width:  p.width,
                  height: p.height,
                  left:   `${p.left}%`,
                  top:    `${p.top}%`,
                  animation: `ambient-particle ${p.duration}s ease-in-out infinite`,
                  animationDelay: `${p.delay}s`,
                }}
              />
            ))}
          </div>

          {/* ── STARS ── */}
          <div className="absolute inset-0" style={{ zIndex: 5 }}>
            {STARS.map((star, i) => (
              <Star
                key={star.id}
                id={star.id}
                x={star.x}
                y={star.y}
                label={star.label}
                size={star.size}
                delay={0.3 + i * 0.15}
                visited={visitedStars.has(star.id)}
                onClick={handleStarClick}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
          zIndex: 10,
        }}
      />

      {/* Hint text */}
      <AnimatePresence>
        {!isZooming && !showModal && (
          <motion.div
            className="absolute bottom-6 left-0 right-0 text-center z-20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 3, duration: 1.5 }}
          >
            <p
              className="text-xs md:text-sm text-white/30 tracking-widest uppercase font-light"
              style={{ textShadow: "0 0 10px rgba(200,180,255,0.2)" }}
            >
              {isMobile
                ? "Desliza para explorar · Toca una estrella"
                : "Mueve el cursor para explorar · Haz click en una estrella"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset button — bottom left, visible when at least one star is visited */}
      <AnimatePresence>
        {visitedStars.size > 0 && !isZooming && !showModal && (
          <motion.button
            className="absolute bottom-5 left-5 z-20 flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer focus:outline-none"
            style={{
              background: "rgba(10,5,25,0.75)",
              border: "1px solid rgba(223,204,61,0.3)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 0 16px rgba(223,204,61,0.1)",
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4 }}
            whileHover={{
              boxShadow: "0 0 24px rgba(223,204,61,0.3)",
              borderColor: "rgba(223,204,61,0.6)",
            }}
            onClick={handleReset}
            aria-label="Reiniciar estrellas"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4v6h6M23 20v-6h-6" stroke="#dfcc3d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" stroke="#dfcc3d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs tracking-widest uppercase font-light" style={{ color: "#dfcc3d" }}>
              Reiniciar ({visitedStars.size}/{STARS.length})
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── MODAL ── */}
      <StarModal
        isOpen={showModal}
        onClose={handleCloseModal}
        imageSrc={activeStar?.image ?? "/photos/1.jpg"}
        text={activeStar?.text ?? ""}
        starLabel={activeStar?.label ?? ""}
      />

      {/* ── CONFLUENCE OVERLAY — se activa en los milestones 4, 8 y 12 ── */}
      {confluenceActive && (
        <ConfluenceOverlay
          stars={confluencePositions}
          milestone={confluenceMilestone}
          imageSrc={CONFLUENCE_CONFIGS[confluenceMilestone].imageSrc}
          text={CONFLUENCE_CONFIGS[confluenceMilestone].text}
          onComplete={() => setConfluenceActive(false)}
        />
      )}
    </div>
  );
}
