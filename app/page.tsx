// src/app/page.tsx
"use client";

import { useState } from "react";
import { useSensorData } from "@/context/SensorDataContext";
import { ControlSidebar } from "@/components/ControlSidebar";
import { SensorView } from "@/components/SensorView";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"piezo" | "adxl">("piezo");

  const { piezoData, piezoFftData, adxlData, adxlFftData, uiSettings } =
    useSensorData();

  const adxlSelectedAxis = uiSettings.adxl.visibleAxis.x
    ? "x"
    : uiSettings.adxl.visibleAxis.y
      ? "y"
      : "z";

  return (
    <div className="flex flex-1 overflow-hidden h-full bg-background">
      {/* 좌측: 제어판 (여기에 탭 상태와 변경 함수를 넘겨줍니다) */}
      <ControlSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 우측: 그래프 화면 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activeTab === "piezo" ? (
          <SensorView
            title="Piezo 센서"
            rawData={piezoData}
            fftData={piezoFftData}
            rawKey="value"
            color="#4f46e5"
            unit="V"
            yMode={uiSettings.piezo.yAxisMode}
            yMin={uiSettings.piezo.yAxisMin}
            yMax={uiSettings.piezo.yAxisMax}
          />
        ) : (
          <SensorView
            title={`ADXL 가속도 센서 (${adxlSelectedAxis.toUpperCase()}축)`}
            rawData={adxlData}
            fftData={adxlFftData}
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
