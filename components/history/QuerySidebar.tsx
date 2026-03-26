// src/components/history/QuerySidebar.tsx
"use client";

import { useState } from "react";
import { Search, CalendarDays, Zap } from "lucide-react";
import { API } from "@/lib/api"; // 아까 만든 API config 수입

interface QuerySidebarProps {
  // 조회 성공 시 부모(HistoryPage)에게 데이터를 넘겨주는 콜백 함수
  onQuerySuccess: (data: any[], sensorType: string, rawKey: string) => void;
}

export function QuerySidebar({ onQuerySuccess }: QuerySidebarProps) {
  // --- 조회 조건 상태 (UI) ---
  const [sensorType, setSensorType] = useState<"piezo" | "adxl">("piezo");
  const [adxlAxis, setAdxlAxis] = useState<"x" | "y" | "z">("x");

  // 한국 시간(KST) 기준으로 datetime-local input에 넣을 초기값 세팅 (오늘 00:00 ~ 현재)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // input type="datetime-local"은 'YYYY-MM-DDTHH:mm' 형식을 요구합니다.
  const toInputTime = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000; // 분 단위를 밀리초로
    const localISOTime = new Date(date.getTime() - offset)
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  };

  const [startDate, setStartDate] = useState(toInputTime(todayStart));
  const [endDate, setEndDate] = useState(toInputTime(now));

  // 로딩 상태 및 에러 메시지
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- [핵심] DB 조회 요청 함수 ---
  const handlePerformQuery = async () => {
    setError("");
    setLoading(true);

    // 1. 입력 검증 (시작 시간이 끝 시간보다 빨라야 함)
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      setError("시작 시간이 종료 시간보다 늦거나 같을 수 없습니다.");
      setLoading(false);
      return;
    }

    try {
      // 2. [중요] input의 한국 시간을 백엔사용 ISO 형식(UTC 기반 Z 붙임)으로 변환
      // backend_api.py의 fromisoformat()이 이를 인식합니다.
      const startIso = start.toISOString(); // '2023-10-27T10:00:00.000Z'
      const endIso = end.toISOString();

      // 3. API 호출
      const axisParam = sensorType === "adxl" ? adxlAxis : "x";
      const url = API.DB_HISTORY(sensorType, startIso, endIso, axisParam);

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`서버 응답 에러: ${res.status}`);
      }

      const responseData = await res.json();

      // 4. 데이터 포맷 변환 (InfluxDB 결과 -> Recharts 차트용)
      // InfluxDB는 날짜를 'time' 키로 보냅니다. 차트는 Unix Timestamp(숫자)를 선호합니다.
      const formattedData = responseData.data.map((d: any) => ({
        // ISO 시간을 Unix Timestamp (초 단위 숫자)로 변환 (X축 좌표)
        timestamp: new Date(d.time).getTime() / 1000,
        // Piezo는 'value', ADXL은 요청한 축('x' 등)에 값 할당
        [sensorType === "piezo" ? "value" : d.field || axisParam]: d.value,
      }));

      if (formattedData.length === 0) {
        setError("해당 기간에 저장된 데이터가 없습니다.");
      }

      // 5. 부모 컴포넌트에 결과 전달
      const chartKey = sensorType === "piezo" ? "value" : adxlAxis;
      onQuerySuccess(formattedData, sensorType, chartKey);
    } catch (e: any) {
      console.error("History Query Error:", e);
      setError(`조회 중 오류가 발생했습니다: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-80 border-r border-border bg-card p-6 flex flex-col h-full space-y-6 overflow-y-auto shrink-0">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <CalendarDays className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold">기록 조회 조건</h2>
        </div>
      </div>

      {/* 1. 센서 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground uppercase">
          센서 종류
        </label>
        <div className="flex bg-muted p-1 rounded-lg">
          <button
            onClick={() => setSensorType("piezo")}
            className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md ${sensorType === "piezo" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
          >
            PIEZO
          </button>
          <button
            onClick={() => setSensorType("adxl")}
            className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md ${sensorType === "adxl" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
          >
            ADXL
          </button>
        </div>
      </div>

      {/* 2. ADXL 축 선택 (ADXL일 때만 나타남) */}
      {sensorType === "adxl" && (
        <div className="space-y-2 pt-2">
          <label className="text-sm font-medium text-muted-foreground uppercase">
            조회할 축 (Axis)
          </label>
          <div className="flex gap-2">
            {(["x", "y", "z"] as const).map((axis) => (
              <button
                key={axis}
                onClick={() => setAdxlAxis(axis)}
                className={`flex-1 border py-1.5 rounded-md text-sm font-mono ${adxlAxis === axis ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold" : "bg-muted/50 text-muted-foreground"}`}
              >
                {axis.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      <hr className="border-border" />

      {/* 3. 기간 선택 (날짜/시간) */}
      <div className="space-y-4 flex-1">
        <label className="text-sm font-medium text-muted-foreground uppercase">
          조회 기간 (KST)
        </label>

        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">
            시작 시간 (From)
          </span>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-background p-2.5 rounded border border-border text-sm shadow-sm"
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">종료 시간 (To)</span>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-background p-2.5 rounded border border-border text-sm shadow-sm"
          />
        </div>

        {/* 에러 메시지 표출 */}
        {error && (
          <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-xs font-medium">
            ❌ {error}
          </div>
        )}
      </div>

      {/* 4. 조회 버튼 */}
      <button
        onClick={handlePerformQuery}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-md text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50 shadow-md shrink-0"
      >
        <Search size={16} />
        {loading ? "조회 중..." : "기록 조회하기"}
      </button>
    </div>
  );
}
