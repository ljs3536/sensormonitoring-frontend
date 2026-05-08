"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { LeakRecord } from "./SensorList";

interface SensorViewProps {
  title?: string;
  selectedRecords: LeakRecord[];
}

// 다중 라인을 그릴 때 사용할 색상 팔레트
const COLORS = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
];

export function SensorView({
  title = "주파수 대역별 FFT 분석",
  selectedRecords,
}: SensorViewProps) {
  // 1. RDB 데이터를 Recharts가 그릴 수 있는 형태로 변환
  const chartData = useMemo(() => {
    if (!selectedRecords || selectedRecords.length === 0) return [];
    console.log(selectedRecords);
    // 가장 첫 번째 데이터의 길이를 기준으로 X축 생성 (보통 모든 배열 길이가 동일함)
    const firstRecordData = selectedRecords[0].sensorDataStr?.split("|");
    const dataLength = firstRecordData?.length;

    const formattedData = [];

    for (let i = 0; i < dataLength; i++) {
      // X축 라벨 생성 (이미지의 25kHz ~ 88kHz 범위 매핑 예시)
      // 실제 Hz 계산식이 있다면 이 부분을 수정하시면 됩니다.
      const freq = 25 + (i / (dataLength - 1)) * (88 - 25);

      const dataPoint: any = {
        frequency: `${freq.toFixed(1)}kHz`,
        rawIndex: i, // Tooltip 정렬용
      };

      // 선택된 모든 레코드의 i번째 값을 추출해서 dataPoint에 삽입
      selectedRecords.forEach((record) => {
        const parsedArray = record.sensorDataStr.split("|");
        // 데이터가 비어있거나 짧을 경우를 대비해 예외 처리
        const val = parsedArray[i] ? parseFloat(parsedArray[i]) : 0;
        dataPoint[`line_${record.seq}`] = val;
      });

      formattedData.push(dataPoint);
    }

    return formattedData;
  }, [selectedRecords]);

  // 2. 데이터가 없을 때 보여줄 Placeholder 화면
  if (!selectedRecords || selectedRecords.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded border border-dashed">
        <svg
          className="w-12 h-12 mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          ></path>
        </svg>
        <p>좌측 리스트에서 데이터를 선택하면 그래프가 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none p-2 font-bold text-gray-700 border-b mb-4">
        {title}
      </div>

      <div className="flex-1 min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="frequency"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              interval="preserveStartEnd"
              minTickGap={30}
            />

            {/* YAxis를 Log Scale로 변경하고 싶다면 scale="log" domain={['auto', 'auto']} 추가 */}
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(val) => val.toFixed(4)}
            />

            <Tooltip
              contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
              labelStyle={{ fontWeight: "bold", marginBottom: "5px" }}
            />

            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ fontSize: "12px" }}
            />

            {/* 선택된 데이터 개수만큼 Line 컴포넌트를 동적으로 생성 */}
            {selectedRecords.map((record, index) => (
              <Line
                key={record.seq}
                type="monotone"
                dataKey={`line_${record.seq}`}
                name={`${record.receptionDate}`} // 범례(Legend)와 툴팁에 표시될 이름
                stroke={COLORS[index % COLORS.length]} // 팔레트에서 색상 순환 배정
                strokeWidth={1.5}
                dot={false} // 포인트 마커 숨김 (데이터가 많을 때 지저분함 방지)
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
