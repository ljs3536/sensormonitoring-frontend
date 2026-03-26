// src/app/page.tsx
"use client";

import { useState } from "react";
import { useSensorData } from "@/context/SensorDataContext";
import { ControlSidebar } from "@/components/ControlSidebar";
import { SensorView } from "@/components/SensorView";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"piezo" | "adxl">("piezo");

  // Context에서 모든 데이터(RAW, FFT, UI설정)를 꺼내옵니다.
  const { piezoData, piezoFftData, adxlData, adxlFftData, uiSettings } =
    useSensorData();

  // ADXL의 경우 사용자가 사이드바에서 선택한 축('x', 'y', 'z')을 알아냅니다.
  const adxlSelectedAxis = uiSettings.adxl.visibleAxis.x
    ? "x"
    : uiSettings.adxl.visibleAxis.y
      ? "y"
      : "z";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 shrink-0">
        <h1 className="text-xl font-bold text-primary tracking-tighter">
          SENSOR MASTER
        </h1>
        <div className="flex bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("piezo")}
            className={`px-6 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "piezo" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            PIEZO
          </button>
          <button
            onClick={() => setActiveTab("adxl")}
            className={`px-6 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "adxl" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            ADXL
          </button>
        </div>
        <div className="w-20" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 좌측: 제어판 */}
        <ControlSidebar type={activeTab} />

        {/* 우측: 그래프 화면 */}
        {activeTab === "piezo" ? (
          <SensorView
            title="Piezo 센서"
            rawData={piezoData}
            fftData={piezoFftData}
            rawKey="value" // Piezo는 값이 'value'에 담겨 있습니다.
            color="#4f46e5"
            unit="V"
          />
        ) : (
          <SensorView
            title={`ADXL 가속도 센서 (${adxlSelectedAxis.toUpperCase()}축)`}
            rawData={adxlData}
            fftData={adxlFftData}
            rawKey={adxlSelectedAxis} // 사용자가 선택한 축(x, y, z)을 Key로 사용합니다.
            color="#ef4444"
            unit="g"
          />
        )}
      </div>
    </div>
  );
}
