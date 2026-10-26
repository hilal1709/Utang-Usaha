"use client";

// Diadaptasi dari Aceternity UI "Card Spotlight": efek canvas (three.js) dibuang,
// sorotan mengikuti kursor memakai warna tema dan tetap di bawah konten.
import { useMotionValue, motion, useMotionTemplate } from "motion/react";
import React, { type MouseEvent as ReactMouseEvent } from "react";
import { cn } from "@/lib/utils";

export const CardSpotlight = ({
  children,
  radius = 320,
  color = "rgba(59, 142, 165, 0.16)",
  className,
  ...props
}: {
  radius?: number;
  color?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const mouseX = useMotionValue(-999);
  const mouseY = useMotionValue(-999);
  function handleMouseMove({ currentTarget, clientX, clientY }: ReactMouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }
  const mask = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, white, transparent 75%)`;

  return (
    <div className={cn("group/spotlight relative", className)} onMouseMove={handleMouseMove} {...props}>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-px z-0 rounded-[inherit] opacity-0 transition duration-300 group-hover/spotlight:opacity-100"
        style={{ backgroundColor: color, maskImage: mask, WebkitMaskImage: mask }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
