// src/lib/api.ts

// 1. Base URL 가져오기 (.env 파일이 없으면 기본값으로 8001 포트 사용)
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001";

// 2. API 엔드포인트 객체 생성
export const API = {
  // RAW 데이터 조회
  LATEST_PIEZO: `${BASE_URL}/api/data/latest/piezo`,
  LATEST_ADXL: `${BASE_URL}/api/data/latest/adxl`,

  // FFT 데이터 조회 (파라미터를 받아 완성된 URL을 반환하는 함수 형태로 작성)
  FFT_PIEZO: (sampleRate: number, window: string) =>
    `${BASE_URL}/api/data/fft/piezo?sample_rate=${sampleRate}&window=${window}`,

  FFT_ADXL: (sampleRate: number, axis: string, window: string) =>
    `${BASE_URL}/api/data/fft/adxl?sample_rate=${sampleRate}&axis=${axis}&window=${window}`,

  // DB 조회 API
  DB_HISTORY: (
    sensorType: string,
    startIso: string,
    endIso: string,
    axis: string,
  ) =>
    `${BASE_URL}/api/db/history/${sensorType}?start_iso=${startIso}&end_iso=${endIso}&axis=${axis}`,

  CONTROL_START: `${BASE_URL}/api/control/start`,
  CONTROL_STOP: `${BASE_URL}/api/control/stop`,
} as const;
