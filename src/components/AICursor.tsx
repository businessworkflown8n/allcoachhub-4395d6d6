import { useEffect, useState } from "react";

const AICursor = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    const down = () => setClicking(true);
    const up = () => setClicking(false);
    const checkHover = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      setHovering(!!el.closest("a, button, [role='button'], input, textarea, select, label"));
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mousemove", checkHover);
    document.addEventListener("mousedown", down);
    document.addEventListener("mouseup", up);

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mousemove", checkHover);
      document.removeEventListener("mousedown", down);
      document.removeEventListener("mouseup", up);
    };
  }, []);

  const size = clicking ? 36 : hovering ? 52 : 44;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden="true">
      {/* outer glow ring */}
      <div
        className="absolute rounded-full border border-primary/40 transition-all duration-200 ease-out"
        style={{
          left: pos.x,
          top: pos.y,
          width: size + 16,
          height: size + 16,
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 18px hsl(var(--primary) / 0.25)",
        }}
      />

      {/* main circle with "AI" text */}
      <div
        className="absolute flex items-center justify-center rounded-full bg-primary transition-all duration-150 ease-out"
        style={{
          left: pos.x,
          top: pos.y,
          width: size,
          height: size,
          transform: `translate(-50%, -50%) scale(${clicking ? 0.85 : 1})`,
          boxShadow: "0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.2)",
        }}
      >
        <span
          className="font-extrabold tracking-tight text-primary-foreground select-none"
          style={{ fontSize: clicking ? 13 : hovering ? 16 : 14 }}
        >
          AI
        </span>
      </div>
    </div>
  );
};

export default AICursor;
