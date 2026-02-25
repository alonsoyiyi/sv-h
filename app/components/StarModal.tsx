"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface StarModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  text: string;
  starLabel: string;
}

export default function StarModal({
  isOpen,
  onClose,
  imageSrc,
  text,
  starLabel,
}: StarModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{
              background: "radial-gradient(circle, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.92) 100%)",
              backdropFilter: "blur(6px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="relative pointer-events-auto max-w-lg w-full rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, rgba(20,10,40,0.95), rgba(10,5,25,0.98))",
                border: "1px solid rgba(200,180,255,0.15)",
                boxShadow:
                  "0 0 40px rgba(200,180,255,0.1), 0 0 80px rgba(100,80,200,0.05), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
              initial={{ scale: 0.3, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.3, opacity: 0, y: 30 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 25,
                duration: 0.6,
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
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
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 60%, rgba(20,10,40,0.98) 100%)",
                    zIndex: 1,
                  }}
                />
                <Image
                  src={imageSrc}
                  alt={starLabel}
                  fill
                  className="object-cover"
                  sizes="(max-width: 512px) 100vw, 512px"
                />
              </div>

              {/* Text */}
              <div className="relative px-6 pb-6 -mt-8 z-10">
                <motion.h3
                  className="text-xl md:text-2xl font-light text-white/90 mb-3 tracking-wide"
                  style={{
                    textShadow: "0 0 20px rgba(200,180,255,0.5)",
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {starLabel}
                </motion.h3>
                <motion.p
                  className="text-sm md:text-base text-white/70 leading-relaxed font-light italic"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  {text}
                </motion.p>
              </div>

              {/* Decorative corner glows */}
              <div
                className="absolute -top-20 -left-20 w-40 h-40 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(200,180,255,0.08) 0%, transparent 70%)",
                }}
              />
              <div
                className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(150,130,220,0.06) 0%, transparent 70%)",
                }}
              />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
