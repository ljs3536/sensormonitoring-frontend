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
  // 👇 여기서부터 새로 추가된 부분 (Y축 제어용 변수 선언)
  yMode?: "auto" | "fixed";
  yMin?: number;
  yMax?: number;
}

export function SensorView({
  title,
  rawData,
  fftData,
  rawKey,
  color,
  unit,
  // 👇 부모에게서 전달받은 값을 사용 (기본값도 설정)
  yMode = "auto",
  yMin = 0,
  yMax = 5,
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
              <XAxis
                dataKey="frequency"
                stroke="var(--muted-foreground)"
                fontSize={12}
                unit="Hz"
              />

              {/* 👇 전달받은 yMode, yMin, yMax를 드디어 사용합니다! */}
              <YAxis
                domain={yMode === "fixed" ? [yMin, yMax] : ["auto", "auto"]}
                stroke="var(--muted-foreground)"
                fontSize={12}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                }}
              />
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
