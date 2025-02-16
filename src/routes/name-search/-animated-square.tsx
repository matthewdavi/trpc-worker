import { useState, useEffect, useRef } from "react";

interface IPosition {
  x: number;
  y: number;
}

interface IDragging {
  dragging: boolean;
  offsetX: number;
  offsetY: number;
}

export function AnimatedSquare() {
  const [fps, setFps] = useState<number>(0);
  const [position, setPosition] = useState<IPosition>({ x: 0, y: 0 });
  const draggingRef = useRef<IDragging>({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    let frameId: number;
    let lastTimestamp: number | null = null;

    function animate(timestamp: number) {
      if (lastTimestamp !== null) {
        const delta = timestamp - lastTimestamp;
        const currentFps = Math.round(1000 / delta);
        setFps(currentFps);
      }
      lastTimestamp = timestamp;
      frameId = requestAnimationFrame(animate);
    }

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, []);

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    draggingRef.current.dragging = true;
    draggingRef.current.offsetX = e.clientX - position.x;
    draggingRef.current.offsetY = e.clientY - position.y;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!draggingRef.current.dragging) {
      return;
    }
    const newX = e.clientX - draggingRef.current.offsetX;
    const newY = e.clientY - draggingRef.current.offsetY;
    setPosition({ x: newX, y: newY });
  }

  function handleMouseUp() {
    draggingRef.current.dragging = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      className={
        "fixed cursor-move w-[100px] h-[100px] z-50 flex items-center justify-center"
      }
      style={{ left: position.x, top: position.y, backgroundColor: `black` }}
    >
      <span className={"text-white"}>{fps}</span>
    </div>
  );
}
