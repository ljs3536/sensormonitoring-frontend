// src/app/streaming/page.tsx
"use client";

import {
  useSensorStreaming,
  SensorStreamingProvider,
} from "@/context/SensorStreamingContext";
import { useSensorData } from "@/context/SensorDataContext"; // UI 설정값 재사용
import { ControlSidebar } from "@/components/streaming/ControlSidebar";
import { SensorView } from "@/components/streaming/SensorView";
import { Wifi, WifiOff } from "lucide-react";

function StreamingContent() {
  const {
    activeType,
    setActiveType,
    piezoStreamingData,
    piezoFftData,
    adxlStreamingData,
    adxlFftData,
    isConnected,
  } = useSensorStreaming();
  const { uiSettings, updatePiezoSettings, updateAdxlSettings } =
    useSensorData(); // 기존 설정(Y축 범위 등)은 그대로 활용

  const adxlSelectedAxis = uiSettings.adxl.visibleAxis.x
    ? "x"
    : uiSettings.adxl.visibleAxis.y
      ? "y"
      : "z";

  return (
    <div className="flex flex-1 overflow-hidden h-full bg-background relative">
      {/* 상단 연결 상태 인디케이터 (WebSocket 특화 UI) */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-card px-3 py-1.5 rounded-full border shadow-sm">
        {isConnected ? (
          <>
            <Wifi size={14} className="text-green-500 animate-pulse" />{" "}
            <span className="text-xs font-bold text-green-600">LIVE</span>
          </>
        ) : (
          <>
            <WifiOff size={14} className="text-red-500" />{" "}
            <span className="text-xs font-bold text-red-600">DISCONNECTED</span>
          </>
        )}
      </div>

      {/* 좌측: 기존 사이드바 재사용 */}
      <ControlSidebar
        activeTab={activeType}
        onTabChange={(tab) => setActiveType(tab as any)}
      />

      {/* 우측: 그래프 화면 (SensorView 재사용) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activeType === "piezo" ? (
          <SensorView
            title="Piezo 실시간 스트림"
            rawData={piezoStreamingData}
            fftData={piezoFftData} // 실시간 스트리밍에서는 FFT를 일단 비워두거나 백엔드 연동
            rawKey="value"
            color="#4f46e5"
            unit="V"
            yMode={uiSettings.piezo.yAxisMode}
            yMin={uiSettings.piezo.yAxisMin}
            yMax={uiSettings.piezo.yAxisMax}
          />
        ) : (
          <SensorView
            title={`ADXL 실시간 스트림 (${adxlSelectedAxis.toUpperCase()}축)`}
            rawData={adxlStreamingData}
            fftData={adxlFftData ? adxlFftData[adxlSelectedAxis] : []}
            rawKey={adxlSelectedAxis}
            color="#ef4444"
            unit="g"
            yMode={uiSettings.adxl.yAxisMode}
            yMin={uiSettings.adxl.yAxisMin}
            yMax={uiSettings.adxl.yAxisMax}
          />
        )}
      </div>
    </div>
  );
}

// Context Provider로 감싸서 내보냄
export default function StreamingPage() {
  return (
    <SensorStreamingProvider>
      <StreamingContent />
    </SensorStreamingProvider>
  );
}
