import React from "react";
import { G, Path, Svg } from "react-native-svg";
import type { ColorItem } from "@colorwalking/shared";

type WheelProps = {
  size: number;
  colors: ColorItem[];
};

function toCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (Math.PI / 180) * angle;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(cx: number, cy: number, r: number, start: number, end: number) {
  const startPoint = toCartesian(cx, cy, r, start);
  const endPoint = toCartesian(cx, cy, r, end);
  const largeArc = end - start <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${startPoint.x} ${startPoint.y} A ${r} ${r} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y} Z`;
}

export function WheelGraphic({ size, colors }: WheelProps) {
  const radius = size / 2;
  const sectorAngle = 360 / colors.length;

  return (
    <Svg width={size} height={size}>
      <G originX={radius} originY={radius} rotation={-90}>
        {colors.map((c, i) => {
          const start = i * sectorAngle;
          const end = start + sectorAngle;
          return <Path key={c.id} d={sectorPath(radius, radius, radius, start, end)} fill={c.hex} />;
        })}
      </G>
    </Svg>
  );
}

