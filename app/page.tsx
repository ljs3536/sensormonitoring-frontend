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
        <ControlSidebar type={activeTab} />

        {activeTab === "piezo" ? (
          <SensorView
            title="Piezo 센서"
            rawData={piezoData}
            fftData={piezoFftData}
            rawKey="value"
            color="#4f46e5"
            unit="V"
            // 👇 사이드바에서 바꾼 값을 View로 넘겨줌!
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
            // 👇 사이드바에서 바꾼 값을 View로 넘겨줌!
            yMode={uiSettings.adxl.yAxisMode}
            yMin={uiSettings.adxl.yAxisMin}
            yMax={uiSettings.adxl.yAxisMax}
          />
        )}
      </div>
    </div>
  );
}
