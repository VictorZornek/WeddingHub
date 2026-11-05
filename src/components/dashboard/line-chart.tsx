import { useState } from 'react';
import { Platform, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { formatMonth } from '@/features/payments/schedule';
import { useTheme } from '@/hooks/use-theme';

const HEIGHT = 170;
const PAD = { top: 12, right: 14, bottom: 22, left: 58 };
// Native SVG text already uses the system font; the browser would default to serif.
const AXIS_FONT = Platform.OS === 'web' ? 'sans-serif' : undefined;
const MAX_POINTS_WITH_DOTS = 18;

export type LineSeries = {
  key: string;
  color: string;
  values: number[];
  /** Fill the area under the line. */
  area?: boolean;
  /** Hollow dots instead of filled ones. */
  hollow?: boolean;
};

type Props = {
  /** "AAAA-MM", one per point. */
  months: string[];
  series: LineSeries[];
  /** Horizontal dashed reference line (e.g. the spending cap). */
  reference?: { value: number; color: string } | null;
  /** Month to mark with a dotted vertical line. */
  currentMonth?: string;
};

// "R$ 12 mil", "R$ 1,2 mi": short labels for the axis.
function compactCurrency(value: number) {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')} mi`;
  if (value >= 1_000) return `R$ ${Math.round(value / 1_000)} mil`;
  return `R$ ${Math.round(value)}`;
}

function linePath(coords: { x: number; y: number }[]) {
  return coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
}

// Multi-line chart over months, sized to the width of its container.
export function LineChart({ months, series, reference, currentMonth }: Props) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const maxValue = Math.max(1, reference?.value ?? 0, ...series.flatMap((s) => s.values));
  const top = maxValue * 1.08;
  const plotWidth = Math.max(width - PAD.left - PAD.right, 1);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) =>
    PAD.left + (months.length === 1 ? plotWidth / 2 : (index / (months.length - 1)) * plotWidth);
  const y = (value: number) => PAD.top + plotHeight - (value / top) * plotHeight;

  const currentIndex = currentMonth ? months.indexOf(currentMonth) : -1;
  const labelEvery = Math.ceil(months.length / 5);
  const gridValues = [0, top / 2, top];
  const showDots = months.length <= MAX_POINTS_WITH_DOTS;

  const anchorFor = (index: number) =>
    months.length === 1 ? 'middle' : index === 0 ? 'start' : index === months.length - 1 ? 'end' : 'middle';

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          {gridValues.map((value) => (
            <Line
              key={value}
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(value)}
              y2={y(value)}
              stroke={theme.border}
              strokeWidth={1}
            />
          ))}
          {gridValues.slice(1).map((value) => (
            <SvgText
              key={value}
              x={PAD.left - 6}
              y={y(value) + 4}
              fontSize={10}
              fontFamily={AXIS_FONT}
              fill={theme.textSecondary}
              textAnchor="end">
              {compactCurrency(value)}
            </SvgText>
          ))}

          {currentIndex >= 0 && (
            <Line
              x1={x(currentIndex)}
              x2={x(currentIndex)}
              y1={PAD.top}
              y2={y(0)}
              stroke={theme.textSecondary}
              strokeWidth={1}
              strokeDasharray="2 3"
            />
          )}

          {reference && (
            <Line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(reference.value)}
              y2={y(reference.value)}
              stroke={reference.color}
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
          )}

          {series.map((s) => {
            const coords = s.values.map((value, i) => ({ x: x(i), y: y(value) }));
            const area =
              s.area && coords.length > 1
                ? `${linePath(coords)} L${x(coords.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
                : null;
            return (
              <G key={s.key}>
                {area && <Path d={area} fill={s.color} opacity={0.22} />}
                <Path d={linePath(coords)} stroke={s.color} strokeWidth={2.5} fill="none" />
                {showDots &&
                  coords.map((c, i) =>
                    s.hollow ? (
                      <Circle
                        key={i}
                        cx={c.x}
                        cy={c.y}
                        r={3}
                        fill={theme.backgroundElement}
                        stroke={s.color}
                        strokeWidth={2}
                      />
                    ) : (
                      <Circle key={i} cx={c.x} cy={c.y} r={2.5} fill={s.color} />
                    )
                  )}
              </G>
            );
          })}

          {months.map((month, index) =>
            index % labelEvery === 0 || index === months.length - 1 ? (
              <SvgText
                key={month}
                x={x(index)}
                y={HEIGHT - 6}
                fontSize={10}
                fontFamily={AXIS_FONT}
                fill={theme.textSecondary}
                textAnchor={anchorFor(index)}>
                {formatMonth(month).replace(' 20', '/')}
              </SvgText>
            ) : null
          )}
        </Svg>
      )}
    </View>
  );
}
