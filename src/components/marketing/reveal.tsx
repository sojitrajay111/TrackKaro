"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Fades + rises its content in the first time it scrolls into view (marketing page).
 * Children with `.tk-reveal-item` stagger in after it. Reduced motion: shown immediately.
 */
export function Reveal({ children, className = "", delay = 0, as: Tag = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "section" | "li" | "ul" | "ol" }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const style = { "--d": `${delay}ms` } as CSSProperties;
  return (
    // @ts-expect-error — polymorphic ref is fine for these block tags
    <Tag ref={ref} className={`tk-reveal ${className}`} style={style}>
      {children}
    </Tag>
  );
}
