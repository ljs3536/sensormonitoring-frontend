// src/app/history/page.tsx (완전히 새로운 파일 생성)
"use client";

import { useState } from "react";
// 전용 사이드바와 뷰 컴포넌트를 만들어서 수입합니다.
import { QuerySidebar } from "@/components/history/QuerySidebar";
import { HistorySensorView } from "@/components/history/HistorySensorView";

export default function HistoryPage() {
  // 조회된 역사 데이터 상태 (차트에 그릴 데이터)
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  // 현재 조회 중인 센서 정보 상태 (제목 표출용)
  const [currentQuery, setCurrentQuery] = useState({
    sensorType: "piezo",
    rawKey: "value",
  });

  // 🌟 QuerySidebar에서 [조회] 버튼을 누르면 이 함수가 호출되어
  // 데이터를 백엔드에서 가져오고 view를 업데이트합니다.
  const handleQuerySuccess = (
    data: any[],
    sensorType: string,
    rawKey: string,
  ) => {
    setHistoricalData(data);
    setCurrentQuery({ sensorType, rawKey });
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* 좌측: 기록 조회 전용 사이드바 (날짜/센서 선택기 탑재) */}
      <QuerySidebar onQuerySuccess={handleQuerySuccess} />

      {/* 우측: 역사 데이터 전용 그래프 화면 */}
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
        {historicalData.length === 0 ? (
          // 조회 전 초기 화면
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground p-12 text-center">
            <span className="text-6xl">🔍</span>
            <h2 className="text-2xl font-bold">과거 데이터 조회</h2>
            <p>
              좌측 제어판에서 센서 종류와 날짜 범위를 선택하고 [조회하기] 버튼을
              눌러주세요.
            </p>
          </div>
        ) : (
          // 조회된 데이터를 그리는 전용 뷰
          <HistorySensorView
            title={`${currentQuery.sensorType.toUpperCase()} 센서 기록 (${currentQuery.rawKey.toUpperCase()}축)`}
            data={historicalData}
            rawKey={currentQuery.rawKey}
            color={currentQuery.sensorType === "piezo" ? "#4f46e5" : "#ef4444"}
            unit={currentQuery.sensorType === "piezo" ? "V" : "g"}
          />
        )}
      </div>
    </div>
  );
}
