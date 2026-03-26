// src/components/SensorView.tsx
"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SensorViewProps {
  title: string;
  rawData: any[]; // RAW 데이터
  fftData: any[]; // FFT 데이터
  rawKey: string; // 'value' 또는 'x', 'y', 'z'
  color: string;
  unit?: string;
}

export function SensorView({
  title,
  rawData,
  fftData,
  rawKey,
  color,
  unit,
}: SensorViewProps) {
  return (
    <div className="flex-1 p-6 flex flex-col space-y-6 overflow-y-auto bg-background">
      {/* 1. 상단: RAW DATA (Time Domain) */}
      <div className="flex-1 bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col">
        <h3 className="text-md font-semibold mb-2 text-foreground">
          {title} - RAW Data (Time)
        </h3>
        <div className="flex-1 w-full min-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rawData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis dataKey="timestamp" hide={true} />
              <YAxis
                domain={["auto", "auto"]}
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickFormatter={(val) => `${val}${unit || ""}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                }}
              />
              <Line
                type="monotone"
                dataKey={rawKey}
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. 하단: FFT DATA (Frequency Domain) */}
      <div className="flex-1 bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col">
        <h3 className="text-md font-semibold mb-2 text-foreground">
          {title} - FFT Analysis (Freq)
        </h3>
        <div className="flex-1 w-full min-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fftData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              {/* X축은 Frequency */}
              <XAxis
                dataKey="frequency"
                stroke="var(--muted-foreground)"
                fontSize={12}
                unit="Hz"
              />
              <YAxis
                domain={["auto", "auto"]}
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                }}
              />
              {/* FFT는 면적(Area) 그래프로 그리면 더 분석적여 보입니다. */}
              <Area
                type="monotone"
                dataKey="magnitude"
                stroke="#eab308"
                fill="#eab308"
                fillOpacity={0.3}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
