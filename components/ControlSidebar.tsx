// src/components/ControlSidebar.tsx
"use client";

import { useState } from "react";
import { Play, Square, Settings } from "lucide-react";
import { useSensorData } from "@/context/SensorDataContext";

interface ControlSidebarProps {
  type: "piezo" | "adxl";
}

export function ControlSidebar({ type }: ControlSidebarProps) {
  const {
    uiSettings,
    updatePiezoSettings,
    updateAdxlSettings,
    piezoRunning,
    startPiezo,
    stopPiezo,
    adxlRunning,
    startAdxl,
    stopAdxl,
  } = useSensorData();

  const isRunning = type === "piezo" ? piezoRunning : adxlRunning;
  const onStart = type === "piezo" ? startPiezo : startAdxl;
  const onStop = type === "piezo" ? stopPiezo : stopAdxl;

  // 사이드바 임시 설정 상태 (Apply 누르기 전까지)
  const [tempSr, setTempSr] = useState(String(uiSettings[type].sampleRate));
  const [tempAxis, setTempAxis] = useState(
    type === "adxl"
      ? uiSettings.adxl.visibleAxis.x
        ? "x"
        : uiSettings.adxl.visibleAxis.y
          ? "y"
          : "z"
      : "x",
  );

  // 설정 적용 (Context 업데이트)
  const handleApply = () => {
    const sr = parseInt(tempSr) || 1000;
    if (type === "piezo") {
      updatePiezoSettings({ sampleRate: sr });
    } else {
      updateAdxlSettings({
        sampleRate: sr,
        visibleAxis: {
          x: tempAxis === "x",
          y: tempAxis === "y",
          z: tempAxis === "z",
        },
      });
    }
  };

  return (
    <div className="w-80 border-r border-border bg-card p-6 flex flex-col h-full space-y-6 overflow-y-auto">
      {/* 상태 및 제어 */}
      <div>
        <h2 className="text-lg font-bold mb-4">제어 패널</h2>
        <div
          className={`p-4 rounded-lg border flex items-center justify-between mb-4 ${isRunning ? "bg-green-500/10 border-green-500/50" : "bg-muted border-border"}`}
        >
          <span className="text-sm font-medium">상태</span>
          <span
            className={
              isRunning ? "text-green-600 font-bold" : "text-muted-foreground"
            }
          >
            {isRunning ? "수집 중" : "정지됨"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onStart}
            disabled={isRunning}
            className="flex-1 flex justify-center items-center gap-2 bg-primary text-primary-foreground py-2 rounded-md hover:opacity-90 disabled:opacity-50"
          >
            <Play size={16} /> Start
          </button>
          <button
            onClick={onStop}
            disabled={!isRunning}
            className="flex-1 flex justify-center items-center gap-2 bg-destructive text-destructive-foreground py-2 rounded-md hover:opacity-90 disabled:opacity-50"
          >
            <Square size={16} /> Stop
          </button>
        </div>
      </div>

      <hr className="border-border" />

      {/* 화면 설정 (API 연동 안함) */}
      <div className="space-y-4 flex-1">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-md font-semibold">화면 설정</h3>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Sample Rate (Hz)
          </label>
          <select
            value={tempSr}
            onChange={(e) => setTempSr(e.target.value)}
            className="w-full bg-background p-2 rounded border border-border text-sm"
          >
            <option value="1000">1000 Hz</option>
            <option value="2000">2000 Hz</option>
            <option value="4000">4000 Hz</option>
          </select>
        </div>

        {type === "adxl" && (
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              표출 축 (Axis)
            </label>
            <select
              value={tempAxis}
              onChange={(e) => setTempAxis(e.target.value)}
              className="w-full bg-background p-2 rounded border border-border text-sm"
            >
              <option value="x">X 축</option>
              <option value="y">Y 축</option>
              <option value="z">Z 축</option>
            </select>
          </div>
        )}

        <button
          onClick={handleApply}
          className="w-full bg-secondary text-secondary-foreground py-2 rounded-md text-sm font-medium hover:opacity-90 mt-4"
        >
          Apply Settings
        </button>
      </div>
    </div>
  );
}
