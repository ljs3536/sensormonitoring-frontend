// src/components/ControlSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { Play, Square, Settings } from "lucide-react";
import { useSensorData } from "@/context/SensorDataContext";

// 🌟 Props가 변경되었습니다.
interface ControlSidebarProps {
  activeTab: "piezo" | "adxl";
  onTabChange: (tab: "piezo" | "adxl") => void;
}

export function ControlSidebar({
  activeTab,
  onTabChange,
}: ControlSidebarProps) {
  const type = activeTab; // 코드 하단부 호환성을 위해 변수 할당

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

  const currentSettings = uiSettings[type];

  // 상태 변수들 (기존과 동일)
  const [tempSr, setTempSr] = useState(String(currentSettings.sampleRate));
  const [tempWindow, setTempWindow] = useState(
    currentSettings.windowType || "hann",
  );
  const [tempYMode, setTempYMode] = useState<"auto" | "fixed">(
    currentSettings.yAxisMode || "auto",
  );
  const [tempYMin, setTempYMin] = useState(
    String(currentSettings.yAxisMin || 0),
  );
  const [tempYMax, setTempYMax] = useState(
    String(currentSettings.yAxisMax || 5),
  );
  const [tempAxis, setTempAxis] = useState(
    type === "adxl" && "visibleAxis" in currentSettings
      ? currentSettings.visibleAxis.x
        ? "x"
        : currentSettings.visibleAxis.y
          ? "y"
          : "z"
      : "x",
  );

  // (DB 모드용 상태 - 아까 추가하신 부분 유지)
  const [dbSeconds, setDbSeconds] = useState("30");

  useEffect(() => {
    setTempSr(String(uiSettings[type].sampleRate));
    setTempWindow(uiSettings[type].windowType || "hann");
    setTempYMode(uiSettings[type].yAxisMode || "auto");
    setTempYMin(String(uiSettings[type].yAxisMin || 0));
    setTempYMax(String(uiSettings[type].yAxisMax || 5));
    if (type === "adxl" && "visibleAxis" in uiSettings.adxl) {
      setTempAxis(
        uiSettings.adxl.visibleAxis.x
          ? "x"
          : uiSettings.adxl.visibleAxis.y
            ? "y"
            : "z",
      );
    }
  }, [type, uiSettings]);

  const handleApply = () => {
    const sr = parseInt(tempSr) || 1000;
    const yMin = parseFloat(tempYMin) || 0;
    const yMax = parseFloat(tempYMax) || 5;

    if (type === "piezo") {
      updatePiezoSettings({
        sampleRate: sr,
        windowType: tempWindow,
        yAxisMode: tempYMode,
        yAxisMin: yMin,
        yAxisMax: yMax,
      });
    } else {
      updateAdxlSettings({
        sampleRate: sr,
        windowType: tempWindow,
        visibleAxis: {
          x: tempAxis === "x",
          y: tempAxis === "y",
          z: tempAxis === "z",
        },
        yAxisMode: tempYMode,
        yAxisMin: yMin,
        yAxisMax: yMax,
      });
    }
  };

  return (
    <div className="w-80 border-r border-border bg-card p-6 flex flex-col h-full space-y-6 overflow-y-auto shrink-0">
      {/* 🌟 1. 센서 종류 선택 탭 (페이지 상단에서 사이드바로 이사 옴!) */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase mb-2">
          센서 종류
        </h2>
        <div className="flex bg-muted p-1 rounded-lg">
          <button
            onClick={() => onTabChange("piezo")}
            className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "piezo" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            PIEZO
          </button>
          <button
            onClick={() => onTabChange("adxl")}
            className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "adxl" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            ADXL
          </button>
        </div>
      </div>

      <hr className="border-border" />

      {/* 2. 상태 및 제어 영역 */}
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

      {/* 3. 화면 설정 영역 */}
      <div className="space-y-5 flex-1">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-md font-semibold">화면 설정</h3>
        </div>

        {/* Sample Rate */}
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

        {/* Window Function */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Window Function
          </label>
          <select
            value={tempWindow}
            onChange={(e) => setTempWindow(e.target.value)}
            className="w-full bg-background p-2 rounded border border-border text-sm"
          >
            <option value="none">None</option>
            <option value="hann">Hann</option>
            <option value="hamming">Hamming</option>
            <option value="blackman">Blackman</option>
            <option value="flattop">FlatTop</option>
          </select>
        </div>

        {/* ADXL 전용 축 선택 */}
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

        {/* Y-Axis Scale */}
        <div className="space-y-2 pt-2 border-t border-border">
          <label className="text-sm text-muted-foreground">
            FFT Y-Axis Scale
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTempYMode("auto")}
              className={`flex-1 py-1.5 text-sm border rounded transition-colors ${tempYMode === "auto" ? "bg-muted font-bold" : "text-muted-foreground"}`}
            >
              Auto
            </button>
            <button
              onClick={() => setTempYMode("fixed")}
              className={`flex-1 py-1.5 text-sm border rounded transition-colors ${tempYMode === "fixed" ? "bg-muted font-bold" : "text-muted-foreground"}`}
            >
              Fixed
            </button>
          </div>
          {tempYMode === "fixed" && (
            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <span className="text-xs text-muted-foreground block mb-1">
                  Min
                </span>
                <input
                  type="number"
                  value={tempYMin}
                  onChange={(e) => setTempYMin(e.target.value)}
                  className="w-full p-1.5 text-sm border rounded bg-background"
                />
              </div>
              <div className="flex-1">
                <span className="text-xs text-muted-foreground block mb-1">
                  Max
                </span>
                <input
                  type="number"
                  value={tempYMax}
                  onChange={(e) => setTempYMax(e.target.value)}
                  className="w-full p-1.5 text-sm border rounded bg-background"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleApply}
          className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-md text-sm font-bold hover:opacity-90 mt-6 shadow-sm"
        >
          설정 적용 (Apply)
        </button>
      </div>
    </div>
  );
}
