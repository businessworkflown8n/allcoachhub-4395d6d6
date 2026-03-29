import { useEffect, useState, useCallback, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const AICursor = () => {
  const isMobile = useIsMobile();
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [clicking, setClicking] = useState(false);
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    if (isMobile) return;

    // Add cursor class to body instead of CSS on all elements
    document.body.classList.add("ai-cursor-active");

    const move = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setPos(posRef.current);
          rafRef.current = 0;
        });
      }
    };
    const down = () => setClicking(true);
    const up = () => setClicking(false);

    document.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mousedown", down);
    document.addEventListener("mouseup", up);

    return () => {
      document.body.classList.remove("ai-cursor-active");
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mousedown", down);
      document.removeEventListener("mouseup", up);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden="true">
      <svg
        className="absolute"
        style={{
          left: pos.x,
          top: pos.y,
          transform: `translate3d(0,0,0) scale(${clicking ? 0.9 : 1})`,
          transition: "transform 0.1s",
          filter: "drop-shadow(0 2px 6px hsl(var(--primary) / 0.6))",
          willChange: "left, top",
        }}
        width="40"
        height="54"
        viewBox="0 0 40 54"
        fill="none"
      >
        <path
          d="M3 3L3 44L12 35L19 50L25 47L18 32L30 32L3 3Z"
          fill="hsl(var(--primary))"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <text
          x="7"
          y="26"
          fill="hsl(var(--primary-foreground))"
          fontSize="9.5"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          letterSpacing="-0.3"
        >
          AI
        </text>
      </svg>
    </div>
  );
};

export default AICursor;
