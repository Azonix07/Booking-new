"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Animated mesh-gradient aurora backdrop.
 * Pure canvas2D with simplex-like noise — no WebGL. ~30fps cap.
 * Respects prefers-reduced-motion and pauses when off-screen.
 */
export function AuroraBackground({
  className,
  intensity = 1,
}: {
  className?: string;
  intensity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([e]) => { running = e.isIntersecting; },
      { threshold: 0 },
    );
    io.observe(canvas);

    const blobs = [
      { hue: 268, x: 0.2, y: 0.2, r: 0.55, sx: 0.00018, sy: 0.00012, phase: 0 },   // violet
      { hue: 220, x: 0.8, y: 0.3, r: 0.50, sx: -0.00022, sy: 0.00014, phase: 2 },  // blue
      { hue: 188, x: 0.6, y: 0.8, r: 0.45, sx: 0.00015, sy: -0.00020, phase: 4 },  // cyan
      { hue: 322, x: 0.3, y: 0.75, r: 0.40, sx: -0.00012, sy: -0.00016, phase: 6 },// magenta
    ];

    let last = 0;
    const frame = (t: number) => {
      if (!running) { raf = requestAnimationFrame(frame); return; }
      // Cap at ~30fps
      if (t - last < 33) { raf = requestAnimationFrame(frame); return; }
      last = t;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (const b of blobs) {
        const ox = Math.sin(t * b.sx + b.phase) * 0.15;
        const oy = Math.cos(t * b.sy + b.phase) * 0.15;
        const cx = (b.x + ox) * width;
        const cy = (b.y + oy) * height;
        const rad = b.r * Math.max(width, height);

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grad.addColorStop(0, `hsla(${b.hue}, 90%, 60%, ${0.32 * intensity})`);
        grad.addColorStop(0.45, `hsla(${b.hue}, 90%, 55%, ${0.10 * intensity})`);
        grad.addColorStop(1, `hsla(${b.hue}, 90%, 50%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) raf = requestAnimationFrame(frame);
    };

    if (reduced) {
      frame(0); // single paint
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [intensity]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ filter: "blur(40px) saturate(140%)" }}
      />
      {/* subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border) / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.35) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #000 20%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #000 20%, transparent 80%)",
        }}
      />
      {/* noise */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}
