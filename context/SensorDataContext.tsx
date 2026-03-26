// src/context/SensorDataContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { API } from "@/lib/api";

// --- [추가] UI 설정값 타입 정의 ---
export interface UiSettings {
  piezo: {
    sampleRate: number;
    windowType: string; // 'hann', 'hamming', 'none' 등
    yAxisMode: "auto" | "fixed";
    yAxisMin: number;
    yAxisMax: number;
  };
  adxl: {
    sampleRate: number;
    windowType: string;
    gRange: string;
    visibleAxis: { x: boolean; y: boolean; z: boolean };
    yAxisMode: "auto" | "fixed";
    yAxisMin: number;
    yAxisMax: number;
  };
}

// --- Context에서 사용할 값들의 타입 정의 ---
export interface SensorContextValue {
  uiSettings: UiSettings;
  updatePiezoSettings: (settings: Partial<UiSettings["piezo"]>) => void;
  updateAdxlSettings: (settings: Partial<UiSettings["adxl"]>) => void;

  piezoRunning: boolean;
  piezoData: any[];
  piezoFftData: any[]; // FFT 데이터 추가
  startPiezo: () => Promise<void>;
  stopPiezo: () => Promise<void>;

  adxlRunning: boolean;
  adxlData: any[];
  adxlFftData: any[]; // FFT 데이터 추가
  startAdxl: () => Promise<void>;
  stopAdxl: () => Promise<void>;
}

const SensorContext = createContext<SensorContextValue | null>(null);

export function useSensorData() {
  const ctx = useContext(SensorContext);
  if (!ctx)
    throw new Error("useSensorData must be used within a SensorDataProvider");
  return ctx;
}

export function SensorDataProvider({ children }: { children: ReactNode }) {
  // 1. 화면 상태 관리
  const [piezoRunning, setPiezoRunning] = useState(false);
  const [adxlRunning, setAdxlRunning] = useState(false);

  // 2. 그래프에 그릴 데이터 배열 (RAW)
  const [piezoData, setPiezoData] = useState<any[]>([]);
  const [adxlData, setAdxlData] = useState<any[]>([]);

  // 3. 그래프에 그릴 데이터 배열 (FFT)
  const [piezoFftData, setPiezoFftData] = useState<any[]>([]);
  const [adxlFftData, setAdxlFftData] = useState<any[]>([]);

  // 4. 화면 제어용 UI 설정값 상태 (API 전송 X, 오직 프론트엔드용)
  const [uiSettings, setUiSettings] = useState<UiSettings>({
    piezo: {
      sampleRate: 1000,
      windowType: "hann",
      yAxisMode: "auto",
      yAxisMin: 0,
      yAxisMax: 5,
    },
    adxl: {
      sampleRate: 1000,
      windowType: "hann",
      gRange: "2g",
      visibleAxis: { x: true, y: true, z: true },
      yAxisMode: "auto",
      yAxisMin: -2,
      yAxisMax: 2,
    },
  });

  // UI 설정값 업데이트 함수
  const updatePiezoSettings = (settings: Partial<UiSettings["piezo"]>) => {
    setUiSettings((prev) => ({
      ...prev,
      piezo: { ...prev.piezo, ...settings },
    }));
  };
  const updateAdxlSettings = (settings: Partial<UiSettings["adxl"]>) => {
    setUiSettings((prev) => ({ ...prev, adxl: { ...prev.adxl, ...settings } }));
  };

  // 5. 동작 제어 함수 (화면 UI 렌더링 상태만 변경)
  const startPiezo = async () => {
    setPiezoRunning(true);
    setAdxlRunning(false);
  };
  const stopPiezo = async () => setPiezoRunning(false);

  const startAdxl = async () => {
    setAdxlRunning(true);
    setPiezoRunning(false);
  };
  const stopAdxl = async () => setAdxlRunning(false);

  // 6. 백엔드 통신 로직 (변경된 백엔드 API 적용)
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        // --- Piezo가 켜져 있을 때 ---
        if (piezoRunning) {
          // RAW 데이터
          const rawRes = await fetch(API.LATEST_PIEZO);
          if (rawRes.ok) {
            const rawData = await rawRes.json();
            if (rawData.history) setPiezoData(rawData.history);
          }
          // FFT 데이터 (사이드바의 sampleRate 설정값을 쿼리로 보냄)
          const sr = uiSettings.piezo.sampleRate;
          const win = uiSettings.piezo.windowType;
          const fftRes = await fetch(API.FFT_PIEZO(sr, win));
          if (fftRes.ok) setPiezoFftData(await fftRes.json());
        }

        // --- ADXL이 켜져 있을 때 ---
        if (adxlRunning) {
          // RAW 데이터
          const rawRes = await fetch(API.LATEST_ADXL);
          if (rawRes.ok) {
            const rawData = await rawRes.json();
            if (rawData.history) setAdxlData(rawData.history);
          }
          // FFT 데이터
          const sr = uiSettings.adxl.sampleRate;
          const win = uiSettings.adxl.windowType;
          // FFT는 단일 배열이므로, 화면에 켜져 있는 축(x, y, z 중 첫번째)을 기준으로 요청합니다.
          const axis = uiSettings.adxl.visibleAxis.x
            ? "x"
            : uiSettings.adxl.visibleAxis.y
              ? "y"
              : "z";
          const fftRes = await fetch(API.FFT_ADXL(sr, axis, win));
          if (fftRes.ok) setAdxlFftData(await fftRes.json());
        }
      } catch (error) {
        console.error("백엔드 통신 에러:", error);
      }
    };

    let intervalId: NodeJS.Timeout;

    // 둘 중 하나라도 켜져 있을 때만 1초 주기로 실행
    if (piezoRunning || adxlRunning) {
      fetchSensorData(); // 즉시 1회 호출
      intervalId = setInterval(fetchSensorData, 1000);
    }

    // 컴포넌트 정리 시 인터벌 해제 (중복 실행 방지)
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [piezoRunning, adxlRunning, uiSettings]); // 설정값이 변경되어도 다시 호출

  // 7. 모든 컴포넌트에 상태 제공
  return (
    <SensorContext.Provider
      value={{
        uiSettings,
        updatePiezoSettings,
        updateAdxlSettings,

        piezoRunning,
        piezoData,
        piezoFftData, // 하위 컴포넌트로 전달!
        startPiezo,
        stopPiezo,

        adxlRunning,
        adxlData,
        adxlFftData, // 하위 컴포넌트로 전달!
        startAdxl,
        stopAdxl,
      }}
    >
      {children}
    </SensorContext.Provider>
  );
}
