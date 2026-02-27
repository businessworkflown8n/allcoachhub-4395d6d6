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
        width="40"
        height="54"
        viewBox="0 0 40 54"
        fill="none"
      >
        {/* arrow cursor */}
        <path
          d="M3 3L3 44L12 35L19 50L25 47L18 32L30 32L3 3Z"
          fill="hsl(var(--primary))"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* AI text centered inside the arrow body */}
        <text
          x="8.5"
          y="24"
          fill="hsl(var(--primary-foreground))"
          fontSize="11"
          fontWeight="900"
          fontFamily="Inter, system-ui, sans-serif"
          letterSpacing="0.3"
        >
          AI
        </text>
      </svg>
    </div>
  );
};

export default AICursor;
