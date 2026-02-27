import { useEffect, useState } from "react";

const AICursor = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    const down = () => setClicking(true);
    const up = () => setClicking(false);

    document.addEventListener("mousemove", move);
    document.addEventListener("mousedown", down);
    document.addEventListener("mouseup", up);

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mousedown", down);
      document.removeEventListener("mouseup", up);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden="true">
      <svg
        className="absolute transition-transform duration-100"
        style={{
          left: pos.x,
          top: pos.y,
          transform: `scale(${clicking ? 0.9 : 1})`,
          filter: "drop-shadow(0 2px 6px hsl(var(--primary) / 0.6))",
        }}
        width="44"
        height="58"
        viewBox="0 0 44 58"
        fill="none"
      >
        {/* classic arrow cursor shape */}
        <path
          d="M3 3L3 46L13 36L21 54L27 51L19 33L32 33L3 3Z"
          fill="hsl(var(--primary))"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* AI label */}
        <text
          x="9"
          y="28"
          fill="hsl(var(--primary-foreground))"
          fontSize="14"
          fontWeight="900"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="0.5"
        >
          AI
        </text>
      </svg>
    </div>
  );
};

export default AICursor;
