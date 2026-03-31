// src/context/SensorStreamingContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";

interface StreamingContextValue {
  piezoStreamingData: any[];
  adxlStreamingData: any[];
  piezoFftData: any[];
  adxlFftData: any[];
  isConnected: boolean;
  activeType: "piezo" | "adxl";
  setActiveType: (type: "piezo" | "adxl") => void;
}

const StreamingContext = createContext<StreamingContextValue | null>(null);

export function SensorStreamingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [piezoStreamingData, setPiezoStreamingData] = useState<any[]>([]);
  const [adxlStreamingData, setAdxlStreamingData] = useState<any[]>([]);
  const [piezoFftData, setPiezoFftData] = useState<any[]>([]);
  const [adxlFftData, setAdxlFftData] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeType, setActiveType] = useState<"piezo" | "adxl">("piezo");

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 🌟 백엔드 웹소켓 엔드포인트 연결 (타입별로 연결하거나 통합 연결)
    const socket = new WebSocket(`ws://localhost:8001/ws/sensor/${activeType}`);

    socket.onopen = () => {
      console.log(`✅ WebSocket Connected to ${activeType}`);
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      if (activeType === "piezo") {
        setPiezoStreamingData(payload.history);
        setPiezoFftData(payload.fft);
      } else {
        setAdxlStreamingData(payload.history);
        setAdxlFftData(payload.fft);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      console.log("❌ WebSocket Disconnected");
    };

    ws.current = socket;

    return () => {
      socket.close();
    };
  }, [activeType]); // activeType이 바뀔 때마다 소켓을 새로 연결

  return (
    <StreamingContext.Provider
      value={{
        piezoStreamingData,
        adxlStreamingData,
        piezoFftData,
        adxlFftData,
        isConnected,
        activeType,
        setActiveType,
      }}
    >
      {children}
    </StreamingContext.Provider>
  );
}

export const useSensorStreaming = () => {
  const ctx = useContext(StreamingContext);
  if (!ctx) throw new Error("useSensorStreaming must be used within Provider");
  return ctx;
};
