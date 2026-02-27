import { useEffect, useState } from "react";

const AICursor = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setTrail((prev) => [...prev.slice(-7), { x: e.clientX, y: e.clientY }]);
    };
    const down = () => setClicking(true);
    const up = () => setClicking(false);

    const checkHover = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const isInteractive = el.closest("a, button, [role='button'], input, textarea, select, label, [data-clickable]");
      setHovering(!!isInteractive);
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mousemove", checkHover);
    document.addEventListener("mousedown", down);
    document.addEventListener("mouseup", up);
    document.documentElement.style.cursor = "none";

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mousemove", checkHover);
      document.removeEventListener("mousedown", down);
      document.removeEventListener("mouseup", up);
      document.documentElement.style.cursor = "";
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden="true">
      {/* trail particles */}
      {trail.map((t, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary"
          style={{
            left: t.x,
            top: t.y,
            width: 4 + i * 0.5,
            height: 4 + i * 0.5,
            opacity: (i + 1) / trail.length * 0.35,
            transform: "translate(-50%, -50%)",
            transition: "opacity 0.15s",
          }}
        />
      ))}

      {/* outer ring */}
      <div
        className="absolute rounded-full border-2 border-primary transition-all duration-200 ease-out"
        style={{
          left: pos.x,
          top: pos.y,
          width: hovering ? 48 : clicking ? 28 : 36,
          height: hovering ? 48 : clicking ? 28 : 36,
          transform: "translate(-50%, -50%)",
          opacity: 0.5,
          boxShadow: "0 0 12px hsl(var(--primary) / 0.3)",
        }}
      />

      {/* core dot */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="absolute transition-transform duration-150"
        style={{
          left: pos.x,
          top: pos.y,
          transform: `translate(-50%, -50%) scale(${clicking ? 0.8 : hovering ? 1.15 : 1})`,
          filter: `drop-shadow(0 0 6px hsl(var(--primary) / 0.6))`,
        }}
      >
        {/* AI brain icon */}
        <circle cx="12" cy="12" r="5" fill="hsl(var(--primary))" />
        <circle cx="12" cy="12" r="3" fill="hsl(var(--primary-foreground))" />
        {/* neural spokes */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <line
            key={deg}
            x1="12"
            y1="12"
            x2={12 + 9 * Math.cos((deg * Math.PI) / 180)}
            y2={12 + 9 * Math.sin((deg * Math.PI) / 180)}
            stroke="hsl(var(--primary))"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.5"
          />
        ))}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <circle
            key={`n-${deg}`}
            cx={12 + 9 * Math.cos((deg * Math.PI) / 180)}
            cy={12 + 9 * Math.sin((deg * Math.PI) / 180)}
            r="1.5"
            fill="hsl(var(--primary))"
            opacity="0.7"
          />
        ))}
      </svg>
    </div>
  );
};

export default AICursor;
