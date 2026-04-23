"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TradeChartMode = "candle" | "line" | "ohlc" | "area";

export type TradeCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeOfferDisplay: number;
  volumeReturnDisplay: number;
  volume: number;
  trades: number;
};

export type TradeMarker = {
  time: string;
  price: number;
  label?: string;
  tone?: "buy" | "sell" | "event";
};

type ChartRangeLabel =
  | "1d"
  | "2d"
  | "5d"
  | "2w"
  | "1mo"
  | "2mo"
  | "6mo"
  | "1y"
  | "2y"
  | "all";

function formatXAxisLabel(value: string, rangeLabel?: ChartRangeLabel) {
  try {
    const date = new Date(value);

    if (rangeLabel === "1y" || rangeLabel === "2y" || rangeLabel === "all") {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "2-digit",
      }).format(date);
    }

    if (
      rangeLabel === "1mo" ||
      rangeLabel === "2mo" ||
      rangeLabel === "6mo" ||
      rangeLabel === "2w" ||
      rangeLabel === "5d"
    ) {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
      }).format(date);
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return value;
  }
}

function formatTooltipTime(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatNumber(value: number, max = 6) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
  }).format(Number.isFinite(value) ? value : 0);
}

function ema(values: number[], period: number) {
  const k = 2 / (period + 1);
  let last = values[0] ?? 0;

  return values.map((value, index) => {
    if (index === 0) {
      last = value;
      return value;
    }

    last = value * k + last * (1 - k);
    return last;
  });
}

function vwap(rows: TradeCandle[]) {
  let cumulativePV = 0;
  let cumulativeV = 0;

  return rows.map((row) => {
    const typical = (row.high + row.low + row.close) / 3;
    const volume = row.volume || 0;
    cumulativePV += typical * volume;
    cumulativeV += volume;
    return cumulativeV > 0 ? cumulativePV / cumulativeV : row.close;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildPriceDomain(
  rows: Array<TradeCandle & { ema20?: number; ema50?: number; vwap?: number }>
): [number, number] {
  const lows = rows.map((row) => row.low).filter(Number.isFinite);
  const highs = rows.map((row) => row.high).filter(Number.isFinite);

  let min = lows.length ? Math.min(...lows) : 0;
  let max = highs.length ? Math.max(...highs) : 1;

  // 🚨 CRITICAL: force minimum visible range
  if (Math.abs(max - min) < 0.0001) {
    const mid = (max + min) / 2 || 1;
    min = mid * 0.95;
    max = mid * 1.05;
  }

  const span = max - min;
  const padding = span * 0.12;

  return [min - padding, max + padding];
}

function markerFill(tone?: TradeMarker["tone"]) {
  if (tone === "sell") return "#fb7185";
  if (tone === "event") return "#f59e0b";
  return "#22d3ee";
}

function TradeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const candle = payload[0]?.payload;
  if (!candle) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#090d17]/95 p-4 text-xs text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">
        {formatTooltipTime(label || candle.time)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        <div>Open</div>
        <div className="text-right font-semibold">
          {formatNumber(candle.open, 6)}
        </div>
        <div>High</div>
        <div className="text-right font-semibold">
          {formatNumber(candle.high, 6)}
        </div>
        <div>Low</div>
        <div className="text-right font-semibold">
          {formatNumber(candle.low, 6)}
        </div>
        <div>Close</div>
        <div className="text-right font-semibold">
          {formatNumber(candle.close, 6)}
        </div>
        <div>Volume</div>
        <div className="text-right font-semibold">
          {formatNumber(candle.volume, 2)}
        </div>
        <div>Trades</div>
        <div className="text-right font-semibold">
          {formatNumber(candle.trades, 0)}
        </div>
      </div>
    </div>
  );
}

function CustomCandleChart({
  data,
  mode,
  lastPrice,
  tradeMarkers,
  eventMarkers,
  rangeLabel,
}: {
  data: Array<
    TradeCandle & {
      ema20?: number;
      ema50?: number;
      vwap?: number;
    }
  >;
  mode: "candle" | "ohlc";
  lastPrice?: number;
  tradeMarkers: TradeMarker[];
  eventMarkers: TradeMarker[];
  rangeLabel?: ChartRangeLabel;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;

    const measure = () => {
      setSize({
        width: node.clientWidth,
        height: node.clientHeight,
      });
    };

    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const [domainMin, domainMax] = useMemo(() => buildPriceDomain(data), [data]);

  const margin = { top: 18, right: 18, bottom: 38, left: 74 };
  const outerWidth = Math.max(size.width, 320);
  const outerHeight = Math.max(size.height, 260);
  const innerWidth = Math.max(outerWidth - margin.left - margin.right, 40);
  const innerHeight = Math.max(outerHeight - margin.top - margin.bottom, 40);

const sparseMode = data.length <= 20;
const xStep = innerWidth / Math.max(data.length, 1);
const candleWidth = sparseMode
  ? Math.max(18, Math.min(36, xStep * 0.9))
  : Math.max(10, Math.min(22, xStep * 0.62));
const tickWidth = Math.max(6, Math.min(12, xStep * 0.22));
const showMarkerLabels = data.length <= 24 && rangeLabel !== "all";

  const yAt = (price: number) => {
    const safeSpan = Math.max(domainMax - domainMin, 0.000001);
    const ratio = (price - domainMin) / safeSpan;
    return margin.top + innerHeight - ratio * innerHeight;
  };

  const xAtIndex = (index: number) => margin.left + xStep * (index + 0.5);

  const timeToIndex = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((row, index) => {
      map.set(row.time, index);
    });
    return map;
  }, [data]);

  const resolveMarkerIndex = (marker: TradeMarker) => {
    const direct = timeToIndex.get(marker.time);
    if (typeof direct === "number") return direct;

    const target = new Date(marker.time).getTime();
    if (!Number.isFinite(target) || !data.length) return null;

    let bestIndex = 0;
    let bestDiff = Math.abs(new Date(data[0].time).getTime() - target);

    for (let i = 1; i < data.length; i += 1) {
      const diff = Math.abs(new Date(data[i].time).getTime() - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIndex = i;
      }
    }

    return bestIndex;
  };

  const allMarkers = [...tradeMarkers, ...eventMarkers]
    .map((marker) => {
      const index = resolveMarkerIndex(marker);
      if (index === null) return null;

      return {
        ...marker,
        index,
        x: xAtIndex(index),
        y: yAt(marker.price),
      };
    })
    .filter(Boolean) as Array<TradeMarker & { index: number; x: number; y: number }>;

  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const ratio = i / 4;
    const value = domainMax - (domainMax - domainMin) * ratio;
    return {
      value,
      y: margin.top + innerHeight * ratio,
    };
  });

  const xTickCount = Math.min(5, data.length);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => {
    const index =
      xTickCount === 1
        ? 0
        : Math.round((i * Math.max(data.length - 1, 0)) / (xTickCount - 1));

    return {
      index,
      x: xAtIndex(index),
      label: formatXAxisLabel(data[index]?.time || "", rangeLabel),
    };
  });

  const hovered =
    hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length
      ? data[hoverIndex]
      : null;

  const hoverX = hovered && hoverIndex !== null ? xAtIndex(hoverIndex) : null;

  const onMouseMove = (event: any) => {
    if (!data.length) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - rect.left;

    if (localX < margin.left || localX > margin.left + innerWidth) {
      setHoverIndex(null);
      return;
    }

    const rawIndex = Math.floor((localX - margin.left) / Math.max(xStep, 1));
    setHoverIndex(clamp(rawIndex, 0, data.length - 1));
  };

  return (
    <div ref={frameRef} className="relative h-full w-full">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${outerWidth} ${outerHeight}`}
        className="overflow-visible"
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="rioex-candle-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
          </linearGradient>
        </defs>

        <rect
          x={margin.left}
          y={margin.top}
          width={innerWidth}
          height={innerHeight}
          rx={18}
          fill="url(#rioex-candle-bg)"
          stroke="rgba(255,255,255,0.06)"
        />

        {yTicks.map((tick, index) => (
          <g key={`y-tick-${index}`}>
            <line
              x1={margin.left}
              x2={margin.left + innerWidth}
              y1={tick.y}
              y2={tick.y}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3 4"
            />
            <text
              x={margin.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="rgba(255,255,255,0.46)"
            >
              {formatNumber(tick.value, 6)}
            </text>
          </g>
        ))}

        {xTicks.map((tick, index) => (
          <g key={`x-tick-${tick.index}-${index}`}>
            <line
              x1={tick.x}
              x2={tick.x}
              y1={margin.top}
              y2={margin.top + innerHeight}
              stroke="rgba(255,255,255,0.04)"
            />
            <text
              x={tick.x}
              y={margin.top + innerHeight + 20}
              textAnchor="middle"
              fontSize="10"
              fill="rgba(255,255,255,0.46)"
            >
              {tick.label}
            </text>
          </g>
        ))}

        {typeof lastPrice === "number" && Number.isFinite(lastPrice) && lastPrice > 0 ? (
          <g>
            <line
              x1={margin.left}
              x2={margin.left + innerWidth}
              y1={yAt(lastPrice)}
              y2={yAt(lastPrice)}
              stroke="rgba(34,211,238,0.9)"
              strokeDasharray="4 4"
            />
            <text
              x={margin.left + 8}
              y={yAt(lastPrice) - 8}
              fontSize="10"
              fill="rgba(34,211,238,0.95)"
            >
              Last {formatNumber(lastPrice, 6)}
            </text>
          </g>
        ) : null}

        {data.map((entry, index) => {
          const x = xAtIndex(index);
          const yOpen = yAt(entry.open);
          const yHigh = yAt(entry.high);
          const yLow = yAt(entry.low);
          const yClose = yAt(entry.close);

          const isUp = entry.close >= entry.open;
          const stroke =
            mode === "ohlc"
              ? isUp
                ? "#38bdf8"
                : "#f59e0b"
              : isUp
              ? "#34d399"
              : "#fb7185";
          const fill = isUp ? "rgba(52,211,153,0.96)" : "rgba(251,113,133,0.96)";

          const isSinglePrint =
            Math.abs(entry.open - entry.close) < 1e-12 &&
            Math.abs(entry.high - entry.low) < 1e-12;

          const minVisualBodyHeight =
            rangeLabel === "all" || rangeLabel === "2y" || rangeLabel === "1y"
              ? 8
              : 6;

          const rawTop = Math.min(yOpen, yClose);
          const rawBottom = Math.max(yOpen, yClose);
          const rawHeight = rawBottom - rawTop;
          const bodyHeight = Math.max(minVisualBodyHeight, rawHeight);

          const bodyY = clamp(
            rawHeight < minVisualBodyHeight
              ? rawTop - (minVisualBodyHeight - rawHeight) / 2
              : rawTop,
            margin.top,
            margin.top + innerHeight - bodyHeight
          );

          const wickTopBase = clamp(
            Math.min(yHigh, yLow),
            margin.top,
            margin.top + innerHeight
          );
          const wickBottomBase = clamp(
            Math.max(yHigh, yLow),
            margin.top,
            margin.top + innerHeight
          );

          const wickTop = isSinglePrint
            ? clamp(bodyY - 4, margin.top, margin.top + innerHeight)
            : wickTopBase;

          const wickBottom = isSinglePrint
            ? clamp(bodyY + bodyHeight + 4, margin.top, margin.top + innerHeight)
            : wickBottomBase;

          if (mode === "ohlc") {
            return (
              <g key={`ohlc-${entry.time}-${index}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={wickTop}
                  y2={wickBottom}
                  stroke={stroke}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <line
                  x1={x - tickWidth}
                  x2={x}
                  y1={clamp(yOpen, margin.top, margin.top + innerHeight)}
                  y2={clamp(yOpen, margin.top, margin.top + innerHeight)}
                  stroke={stroke}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <line
                  x1={x}
                  x2={x + tickWidth}
                  y1={clamp(yClose, margin.top, margin.top + innerHeight)}
                  y2={clamp(yClose, margin.top, margin.top + innerHeight)}
                  stroke={stroke}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
              </g>
            );
          }

          return (
            <g key={`candle-${entry.time}-${index}`}>
              <line
                x1={x}
                x2={x}
                y1={wickTop}
                y2={wickBottom}
                stroke={stroke}
                strokeWidth={1.8}
                strokeLinecap="round"
                opacity={isSinglePrint ? 0.9 : 1}
              />
              <rect
                x={x - candleWidth / 2}
                y={bodyY}
                width={candleWidth}
                height={bodyHeight}
                fill={fill}
                stroke={stroke}
                strokeWidth={1}
                rx={3}
              />
            </g>
          );
        })}

        {allMarkers.map((marker, index) => (
          <g key={`${marker.time}-${index}-${marker.label || ""}`}>
            <circle
              cx={marker.x}
              cy={marker.y}
              r={4}
              fill={markerFill(marker.tone)}
              stroke="rgba(255,255,255,0.85)"
              strokeWidth={1}
            />
            {marker.label && showMarkerLabels ? (
              <text
                x={marker.x}
                y={marker.y - 9}
                textAnchor="middle"
                fontSize="9"
                fill="rgba(255,255,255,0.9)"
              >
                {marker.label}
              </text>
            ) : null}
          </g>
        ))}

        {hovered && hoverX !== null ? (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={margin.top}
            y2={margin.top + innerHeight}
            stroke="rgba(255,255,255,0.14)"
            strokeDasharray="3 4"
          />
        ) : null}
      </svg>

      {hovered && hoverX !== null ? (
        <div
          className="pointer-events-none absolute z-10 min-w-[220px] rounded-2xl border border-white/10 bg-[#090d17]/95 p-4 text-xs text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
          style={{
            left: `${clamp(hoverX + 14, 8, Math.max(8, outerWidth - 240))}px`,
            top: "12px",
          }}
        >
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">
            {formatTooltipTime(hovered.time)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
            <div>Open</div>
            <div className="text-right font-semibold">
              {formatNumber(hovered.open, 6)}
            </div>
            <div>High</div>
            <div className="text-right font-semibold">
              {formatNumber(hovered.high, 6)}
            </div>
            <div>Low</div>
            <div className="text-right font-semibold">
              {formatNumber(hovered.low, 6)}
            </div>
            <div>Close</div>
            <div className="text-right font-semibold">
              {formatNumber(hovered.close, 6)}
            </div>
            <div>Volume</div>
            <div className="text-right font-semibold">
              {formatNumber(hovered.volume, 2)}
            </div>
            <div>Trades</div>
            <div className="text-right font-semibold">
              {formatNumber(hovered.trades, 0)}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TradeChart({
  candles,
  mode,
  lastPrice,
  showEma20 = true,
  showEma50 = true,
  showVwap = true,
  tradeMarkers = [],
  eventMarkers = [],
  rangeLabel,
}: {
  candles: TradeCandle[];
  mode: TradeChartMode;
  lastPrice?: number;
  showEma20?: boolean;
  showEma50?: boolean;
  showVwap?: boolean;
  tradeMarkers?: TradeMarker[];
  eventMarkers?: TradeMarker[];
  rangeLabel?: ChartRangeLabel;
}) {
  const closes = candles.map((candle) => candle.close);
  const ema20Values = ema(closes, 20);
  const ema50Values = ema(closes, 50);
  const vwapValues = vwap(candles);

  const chartData = candles.map((candle, index) => ({
    ...candle,
    ema20: ema20Values[index],
    ema50: ema50Values[index],
    vwap: vwapValues[index],
  }));

  const overlayMode = mode === "line" || mode === "area";

  const effectiveShowEma20 = overlayMode && showEma20;
  const effectiveShowEma50 = overlayMode && showEma50;
  const effectiveShowVwap = overlayMode && showVwap;

  const priceDomain = buildPriceDomain(chartData);

  const renderMarker = (marker: TradeMarker, index: number) => {
    const fill = markerFill(marker.tone);

    return (
      <ReferenceDot
        key={`${marker.time}-${index}-${marker.label || ""}`}
        x={marker.time}
        y={marker.price}
        yAxisId="price"
        r={3}
        fill={fill}
        stroke="rgba(255,255,255,0.8)"
      />
    );
  };

  return (
    <div className="grid gap-4">
      <div className="h-[500px] w-full rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4">
        {mode === "candle" || mode === "ohlc" ? (
          <CustomCandleChart
            data={chartData}
            mode={mode}
            lastPrice={lastPrice}
            tradeMarkers={tradeMarkers}
            eventMarkers={eventMarkers}
            rangeLabel={rangeLabel}
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {mode === "line" ? (
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="time"
                  tickFormatter={(value) => formatXAxisLabel(value, rangeLabel)}
                  tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  yAxisId="price"
                  domain={priceDomain}
                  tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={76}
                />
                <Tooltip content={<TradeTooltip />} />
                {typeof lastPrice === "number" && lastPrice > 0 ? (
                  <ReferenceLine
                    yAxisId="price"
                    y={lastPrice}
                    stroke="rgba(34,211,238,0.8)"
                    strokeDasharray="3 3"
                  />
                ) : null}
                {effectiveShowEma20 ? (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="ema20"
                    stroke="#a855f7"
                    dot={false}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                ) : null}
                {effectiveShowEma50 ? (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="ema50"
                    stroke="#38bdf8"
                    dot={false}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                ) : null}
                {effectiveShowVwap ? (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="vwap"
                    stroke="#f59e0b"
                    dot={false}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                ) : null}
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                {tradeMarkers.map(renderMarker)}
                {eventMarkers.map(renderMarker)}
              </LineChart>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tradeAreaFillV2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="time"
                  tickFormatter={(value) => formatXAxisLabel(value, rangeLabel)}
                  tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  yAxisId="price"
                  domain={priceDomain}
                  tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={76}
                />
                <Tooltip content={<TradeTooltip />} />
                {typeof lastPrice === "number" && lastPrice > 0 ? (
                  <ReferenceLine
                    yAxisId="price"
                    y={lastPrice}
                    stroke="rgba(34,211,238,0.8)"
                    strokeDasharray="3 3"
                  />
                ) : null}
                {effectiveShowEma20 ? (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="ema20"
                    stroke="#a855f7"
                    dot={false}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                ) : null}
                {effectiveShowEma50 ? (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="ema50"
                    stroke="#38bdf8"
                    dot={false}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                ) : null}
                {effectiveShowVwap ? (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="vwap"
                    stroke="#f59e0b"
                    dot={false}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                ) : null}
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke="#a855f7"
                  fill="url(#tradeAreaFillV2)"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                {tradeMarkers.map(renderMarker)}
                {eventMarkers.map(renderMarker)}
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      <div className="h-[140px] w-full rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="time"
              tickFormatter={(value) => formatXAxisLabel(value, rangeLabel)}
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<TradeTooltip />} />
            <Bar
              dataKey="volume"
              fill="#22d3ee"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
