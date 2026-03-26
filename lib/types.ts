// src/lib/types.ts

// 백엔드에서 수신하는 원본 데이터 타입
export interface PiezoRawPayload {
  voltage: number;
  timestamp: number;
}

export interface AdxlRawPayload {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

// Context에서 사용할 전역 상태 및 함수 타입
export interface SensorContextValue {
  // Piezo State
  piezoRunning: boolean;
  piezoData: PiezoRawPayload[];
  startPiezo: () => Promise<void>;
  stopPiezo: () => Promise<void>;

  // ADXL State
  adxlRunning: boolean;
  adxlData: AdxlRawPayload[];
  startAdxl: () => Promise<void>;
  stopAdxl: () => Promise<void>;
}
