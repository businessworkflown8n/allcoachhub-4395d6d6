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
          transform: `scale(${clicking ? 0.85 : 1})`,
          filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.5))",
        }}
        width="28"
        height="38"
        viewBox="0 0 28 38"
        fill="none"
      >
        {/* classic arrow cursor shape */}
        <path
          d="M2 2L2 30L8.5 23.5L14 35L18 33L12.5 21.5L21 21.5L2 2Z"
          fill="hsl(var(--primary))"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* AI label */}
        <text
          x="6"
          y="17"
          fill="hsl(var(--primary-foreground))"
          fontSize="8"
          fontWeight="800"
          fontFamily="Inter, system-ui, sans-serif"
        >
          AI
        </text>
      </svg>
    </div>
  );
};

export default AICursor;
