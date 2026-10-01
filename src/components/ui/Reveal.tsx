"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";

type RevealProps = {
  as?: "div" | "article" | "figure" | "li" | "section";
  className?: string;
  /** For in-page links to this element. */
  id?: string;
  /** Position in a group; staggers the entrance by 90ms per step. */
  index?: number;
  children: ReactNode;
};

/**
 * Fades content up when it scrolls into view.
 * Server HTML stays visible; only elements below the fold are hidden after
 * hydration, so the first screen never waits for JavaScript. Opacity does not
 * hide content from assistive technology.
 */
export function Reveal({ as = "div", className, id, index = 0, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    const show = () => {
      el.dataset.reveal = "shown";
      observer.disconnect();
      el.removeEventListener("focusin", show);
    };
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && show(), {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12,
    });

    el.dataset.reveal = "hidden";
    observer.observe(el);
    // Keyboard focus moving into hidden content reveals it at once
    el.addEventListener("focusin", show);
    return () => {
      observer.disconnect();
      el.removeEventListener("focusin", show);
    };
  }, []);

  // The element type varies; the ref only needs HTMLElement APIs.
  const Tag = as as "div";
  return (
    <Tag
      ref={ref as RefObject<HTMLDivElement>}
      className={className}
      id={id}
      data-reveal=""
      style={{ "--i": index } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
