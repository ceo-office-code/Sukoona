"use client";

import type { StyleKey } from "@/lib/content";

type Props = { pack: number; styleKey: StyleKey };

const COLS = 5;
const SIZE = 34;
const GAP = 11;
const START_X = (300 - (COLS * SIZE + (COLS - 1) * GAP)) / 2;

/**
 * Small diagram of how many pieces are in the selected pack.
 * It sits under the jar photograph and answers "how many", which
 * the photograph alone cannot show.
 */
export default function PieceRow({ pack, styleKey }: Props) {
  const rows = Math.ceil(pack / COLS);
  const startY = rows === 1 ? 30 : 16;
  const radius = styleKey === "soft" ? 13 : styleKey === "bold" ? 6 : 10;

  const pieces = Array.from({ length: 10 }, (_, i) => ({
    i,
    x: START_X + (i % COLS) * (SIZE + GAP),
    y: startY + Math.floor(i / COLS) * (SIZE + GAP),
    on: i < pack,
  }));

  return (
    <svg
      viewBox="0 0 300 106"
      className="h-auto w-full"
      role="img"
      aria-label={`Diagram showing ${pack} gummies`}
    >
      {pieces.map((p) => (
        <g
          key={p.i}
          style={{
            transformOrigin: `${p.x + SIZE / 2}px ${p.y + SIZE / 2}px`,
            transform: p.on ? "scale(1)" : "scale(0.4)",
            opacity: p.on ? 1 : 0,
            transition: `transform 320ms cubic-bezier(0.34,1.4,0.64,1) ${p.i * 26}ms, opacity 240ms ease ${p.i * 26}ms`,
          }}
        >
          <rect
            x={p.x}
            y={p.y}
            width={SIZE}
            height={SIZE}
            rx={radius}
            fill={p.i % 2 === 0 ? "var(--piece-a)" : "var(--piece-b)"}
            style={{ transition: "fill 400ms ease" }}
          />
          <ellipse cx={p.x + 11} cy={p.y + 10} rx="6" ry="4" fill="#ffffff" opacity="0.26" />
        </g>
      ))}
    </svg>
  );
}
