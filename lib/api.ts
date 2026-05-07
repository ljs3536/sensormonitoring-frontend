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

  // [추가] AI 서비스 관련 API
  AI_STATUS: `${BASE_URL}/api/ai/status`,
  AI_MODELS: `${BASE_URL}/api/ai/models`, // 추가됨
  AI_TRAIN: (sensorType: string, modelType: string, sensorId?: string) =>
    `${BASE_URL}/api/ai/train/${sensorType}?model_type=${modelType}${sensorId ? `&sensor_id=${sensorId}` : ""}`,
  AI_PREDICT: (sensorType: string, modelId: number, sensorId?: string) =>
    `${BASE_URL}/api/ai/predict/${sensorType}?model_id=${modelId}${sensorId ? `&sensor_id=${sensorId}` : ""}`,
  AI_MODEL_DELETE: (modelId: number) => `${BASE_URL}/api/ai/models/${modelId}`,
  AI_AUTOTUNE: (id: string, type: string) =>
    `${BASE_URL}/api/ai/${id}/auto_tune?sensor_type=${type}`,
  // [추가] 센서 메타데이터 관리 API
  SENSOR_LIST: `${BASE_URL}/api/sensors/`, // GET (목록 조회), POST (신규 등록)

  // 기존 SNNSOR_DELETE를 SENSOR_DETAIL로 변경하여 수정(PUT)/삭제(DELETE)에 공용으로 사용
  SENSOR_DETAIL: (id: string) => `${BASE_URL}/api/sensors/${id}`,

  SENSOR_PROTO_LIST: (
    mac: string,
    leakYn: string,
    start: string,
    end: string,
  ) =>
    `${BASE_URL}/api/proto/list?mac_addr=${mac}&leak_yn=${leakYn}&start_dt=${start}&end_dt=${end}`,

  SENSOR_PROTO_DETAIL: (seq: number, mac: string) =>
    `${BASE_URL}/api/proto/${seq}?mac_addr=${mac}`,

  TRAIN_PROTO_MODEL: (sensorId: string) =>
    `${BASE_URL}/api/proto/train/${sensorId}`,
  PREDICT_PROTO_MODEL: (type: string) =>
    `${BASE_URL}/api/proto/predict/${type}`,
} as const;
