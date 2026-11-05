import Svg, { Circle, G, Path } from 'react-native-svg';

type Slice = { id: string; value: number; color: string };

type Props = {
  slices: Slice[];
  size: number;
  /** Ring thickness. Use size / 2 for a full pie. */
  thickness: number;
  /** Color of the thin gap between slices (the card background). */
  gapColor: string;
};

function polar(cx: number, cy: number, r: number, angle: number) {
  // 0 rad = 12 o'clock, clockwise.
  return { x: cx + r * Math.sin(angle), y: cy - r * Math.cos(angle) };
}

// One ring segment from startAngle to endAngle (radians).
function arcPath(cx: number, cy: number, outer: number, inner: number, start: number, end: number) {
  const large = end - start > Math.PI ? 1 : 0;
  const o1 = polar(cx, cy, outer, start);
  const o2 = polar(cx, cy, outer, end);
  const i1 = polar(cx, cy, inner, end);
  const i2 = polar(cx, cy, inner, start);
  return [
    `M${o1.x},${o1.y}`,
    `A${outer},${outer} 0 ${large} 1 ${o2.x},${o2.y}`,
    `L${i1.x},${i1.y}`,
    `A${inner},${inner} 0 ${large} 0 ${i2.x},${i2.y}`,
    'Z',
  ].join(' ');
}

export function PieChart({ slices, size, thickness, gapColor }: Props) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const center = size / 2;
  const outer = size / 2;
  const inner = Math.max(outer - thickness, 0);

  if (total <= 0) return null;

  // A single slice is a full ring; arcs can't draw a full circle.
  if (slices.length === 1) {
    return (
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={(outer + inner) / 2}
          stroke={slices[0].color}
          strokeWidth={outer - inner}
          fill="none"
        />
      </Svg>
    );
  }

  // Start and end angle of every slice, computed before drawing.
  const arcs = slices.reduce<{ slice: Slice; start: number; end: number }[]>((list, slice) => {
    const start = list.at(-1)?.end ?? 0;
    return [...list, { slice, start, end: start + (slice.value / total) * Math.PI * 2 }];
  }, []);

  return (
    <Svg width={size} height={size}>
      <G>
        {arcs.map(({ slice, start, end }) => (
          <Path
            key={slice.id}
            d={arcPath(center, center, outer, inner, start, end)}
            fill={slice.color}
            stroke={gapColor}
            strokeWidth={2}
          />
        ))}
      </G>
    </Svg>
  );
}
