// src/components/history/HistorySensorView.tsx
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface HistorySensorViewProps {
  title: string;
  data: any[]; // DB에서 가져와 timestamp로 변환된 데이터
  rawKey: string; // 'value', 'x', 'y', 'z'
  color: string;
  unit?: string;
}

export function HistorySensorView({
  title,
  data,
  rawKey,
  color,
  unit,
}: HistorySensorViewProps) {
  // 데이터가 너무 많을 경우 Recharts가 버거워할 수 있으므로,
  // 필요시 데이터를 드문드문 솎아내는(Downsampling) 로직이 여기에 들어갈 수 있습니다.
  // (일단은 원본 데이터 그대로 그립니다.)

  // X축 타임스탬프(초)를 시각(KST, HH:mm:ss)으로 바꾸는 포맷터
  const formatXAxisTime = (tickItem: number) => {
    // Unix Timestamp(초) -> 밀리초로 변환
    const date = new Date(tickItem * 1000);
    // 한국 시간 기준으로 시:분:초 추출
    return date.toLocaleTimeString("ko-KR", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 툴팁에 마우스를 올렸을 때 날짜와 시각 전체를 보여주는 포맷터
  const formatTooltipTime = (label: number) => {
    const date = new Date(label * 1000);
    return date.toLocaleString("ko-KR", { hour12: false }); // YYYY. MM. DD. HH:mm:ss
  };

  return (
    <div className="flex-1 p-6 flex flex-col h-full overflow-hidden bg-background">
      <div className="bg-card p-6 rounded-2xl border border-border shadow-md flex flex-col flex-1">
        {/* 헤더 및 정보 */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <h3 className="text-xl font-bold text-foreground tracking-tight">
            {title}
          </h3>
          <div className="flex gap-4 items-center bg-muted/50 px-4 py-1.5 rounded-full border border-border">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Data Points
            </span>
            <span className="text-lg font-mono font-bold text-indigo-600">
              {data.length.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 역사 데이터 전용 Area 차트 (넓은 범위를 보기에 적합) */}
        <div className="flex-1 w-full min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />

              {/* X축: timestamp 기반 시각 표현 */}
              <XAxis
                dataKey="timestamp"
                scale="time" // 시간 기반 스케일
                type="number" // 데이터가 숫자형 스케일임
                domain={["dataMin", "dataMax"]} // 데이터의 최소/최대 시간으로 축 고정
                tickFormatter={formatXAxisTime} // 축 라벨 포맷 (HH:mm:ss)
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickCount={8} // 라벨 갯수 조절
              />

              {/* Y축: 센서 값 */}
              <YAxis
                domain={["auto", "auto"]}
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickFormatter={(val) => `${val}${unit || ""}`}
              />

              {/* 고급 툴팁 세팅 */}
              <Tooltip
                labelFormatter={formatTooltipTime} // 툴팁 제목을 상세 날짜로
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                itemStyle={{ color: color, fontSize: "13px" }}
                cursor={{
                  stroke: color,
                  strokeWidth: 1,
                  strokeDasharray: "6 6",
                }}
              />

              {/* 🌟 역사 파형: 면적 그래프로 꽉 차게 그림 */}
              <Area
                type="monotone" // 곡선 형태
                dataKey={rawKey}
                stroke={color}
                fill={color} // 면적 채우기
                fillOpacity={0.2}
                strokeWidth={1.5}
                dot={false} // 점 안그림 (데이터 많음)
                activeDot={{ r: 4, strokeWidth: 1 }} // 마우스 올렸을 때만 점 표시
                isAnimationActive={true} // 과거 데이터이므로 애니메이션 켜도 됨
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 하단 설명 */}
        <div className="mt-4 text-center text-xs text-muted-foreground bg-muted/30 p-2 rounded-md border border-border/50">
          Recharts 'AreaChart'를 사용하여 과거 기록 스펙트럼을 그립니다.
          마우스를 올려 상세 값과 시각을 확인하세요.
        </div>
      </div>
    </div>
  );
}
