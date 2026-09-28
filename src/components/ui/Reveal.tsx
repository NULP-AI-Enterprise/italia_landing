"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  as?: "div" | "article" | "figure";
  className?: string;
  /** Position in a group; staggers the entrance by 90ms per step. */
  index?: number;
  children: ReactNode;
};

/**
 * Fades content up when it scrolls into view.
 * Server HTML stays visible; only elements below the fold are hidden after
 * hydration, so the first screen never waits for JavaScript.
 */
export function Reveal({ as: Tag = "div", className, index = 0, children }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.dataset.reveal = "hidden";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = "shown";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={className}
      data-reveal=""
      style={{ "--i": index } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
