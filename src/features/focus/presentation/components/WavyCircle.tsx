'use client';

import React, { useMemo } from 'react';

interface WavyCircleProps {
  size: number;
  color: string;
  strokeWidth?: number;
  value?: number;
  opacity?: number;
  rotate?: number;
}

const createWavyPath = (size: number, value = 1, strokeWidth = 7) => {
  const radius = size / 2;
  const center = size / 2;
  const waves = 12;
  const amplitude = 2.5;
  const clampedValue = Math.max(0, Math.min(1, value));
  const endAngle = 360 * clampedValue;

  const points: string[] = [];

  for (let degree = 0; degree <= endAngle; degree += 1) {
    const angle = (degree * Math.PI) / 180;
    const adjustedRadius =
      radius - amplitude - strokeWidth + amplitude * Math.sin(waves * angle);
    const x = center + adjustedRadius * Math.cos(angle);
    const y = center + adjustedRadius * Math.sin(angle);
    points.push(`${degree === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  if (clampedValue >= 0.99) {
    points.push('Z');
  }

  return points.join(' ');
};

export function WavyCircle({
  size,
  color,
  strokeWidth = size * 0.03,
  value = 1,
  opacity = 1,
  rotate = 0,
}: WavyCircleProps) {
  const path = useMemo(() => createWavyPath(size, value, strokeWidth), [size, strokeWidth, value]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={opacity}
      />
    </svg>
  );
}
