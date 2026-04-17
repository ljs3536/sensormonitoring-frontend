// src/components/analysis/AnalysisDashboard.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Play, Activity } from "lucide-react";
import { API } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  BarChart, // 🌟 막대그래프용 추가
  Bar,
  Cell,
  AreaChart,
} from "recharts";

export function AnalysisDashboard() {
  const [sensorType, setSensorType] = useState("piezo");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [aiModels, setAiModels] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [selectedSensorId, setSelectedSensorId] = useState("");
  const [sensors, setSensors] = useState<any[]>([]);

  const fetchAiModels = async () => {
    try {
      const res = await fetch(API.AI_MODELS);
      if (res.ok) setAiModels(await res.json());
    } catch (e) {
      console.error("Model fetch error:", e);
    }
  };
  const fetchSensors = async () => {
    const res = await fetch(API.SENSOR_LIST);
    const data = await res.json();
    const filtered = data.filter(
      (s: any) => s.type === sensorType && s.is_active,
    );
    setSensors(filtered);
    if (filtered.length > 0) setSelectedSensorId(filtered[0].id);
  };

  useEffect(() => {
    fetchAiModels();
    fetchSensors();
  }, [sensorType]);

  const availableModels = aiModels.filter(
    (m) => m.sensor_type === sensorType && m.status === "READY",
  );

  useEffect(() => {
    if (availableModels.length > 0) {
      setSelectedModelId(String(availableModels[0].id));
    } else {
      setSelectedModelId("");
    }
  }, [sensorType, aiModels]);

  //더미 데이터 생성 로직 수정
  const generateDummyData = (isNormal: boolean) => {
    const data: number[] = [];
    const sampleCount = 128;

    const offset = 2048;
    const amplitude = 800;

    for (let i = 0; i < sampleCount; i++) {
      let x = offset + Math.sin(i * 0.1) * amplitude;
      let y = offset + Math.cos(i * 0.1) * (amplitude * 0.8);
      let z = offset + Math.sin(i * 0.05 + 1.0) * (amplitude * 0.6);

      // 미세한 노이즈 추가 (에뮬레이터의 randint(-10, 10)과 유사하게)
      x += (Math.random() - 0.5) * 20;
      y += (Math.random() - 0.5) * 20;
      z += (Math.random() - 0.5) * 20;
      if (!isNormal) {
        // 1. 단순 스파이크 대신 "완전한 패턴 붕괴" 주입
        if (i >= 50 && i <= 80) {
          // 사인파 대신 고주파 노이즈 + 무작위 스파이크
          x =
            offset + Math.sin(i * 1.5) * amplitude * 1.5 + Math.random() * 1000;
        }
        // 2. 전체적인 진동수 변화 (정상은 0.1인데 이상은 0.5로)
        if (i > 100) {
          x = offset + Math.sin(i * 0.5) * amplitude;
        }
      }

      // 🌟 핵심: 백엔드와 동일하게 1000으로 나누고 소수점 4자리까지!
      const processVal = (val: number) =>
        parseFloat(Math.max(0, Math.min(4095, val / 1000.0)).toFixed(4));

      if (sensorType === "adxl") {
        data.push(processVal(x), processVal(y), processVal(z));
      } else {
        data.push(processVal(x));
      }
    }
    setInputText(data.join(", "));
  };

  const handlePredict = async () => {
    if (!selectedModelId)
      return alert(
        "학습이 완료된(READY) 모델이 없습니다. 먼저 모델을 학습시켜주세요.",
      );
    if (!inputText) return alert("데이터를 입력하거나 생성해주세요.");

    const dataArray = inputText
      .split(",")
      .map((v) => parseFloat(v.trim()))
      .filter((v) => !isNaN(v));

    const requiredLength = sensorType === "adxl" ? 384 : 128;

    if (dataArray.length < requiredLength) {
      return alert(
        `${sensorType.toUpperCase()} 분석을 위해서는 최소 ${requiredLength}개의 데이터가 필요합니다. (현재: ${dataArray.length}개)`,
      );
    }

    setLoading(true);
    try {
      const res = await fetch(
        API.AI_PREDICT(
          String(sensorType),
          Number(selectedModelId),
          String(selectedSensorId),
        ),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataArray),
        },
      );

      if (res.ok) {
        setResult(await res.json());
      } else {
        // 백엔드에서 온 에러 메시지가 있다면 출력
        const errorData = await res.json();
        alert(`분석 요청 실패: ${errorData.detail || "서버 오류"}`);
      }
    } catch (e) {
      console.error("예측 오류:", e);
    }
    setLoading(false);
  };

  // 🌟 [비지도 학습용] 복원 차트 데이터
  const reconChartData = useMemo(() => {
    if (
      !result ||
      result.learning_type !== "unsupervised" ||
      !result.chart_data?.reconstructed
    )
      return [];
    return result.chart_data.original.map((val: number, idx: number) => ({
      index: idx,
      original: val,
      reconstructed: result.chart_data.reconstructed[idx],
      error: result.chart_data.errors[idx],
    }));
  }, [result]);

  // 🌟 [지도 학습용] 확률 막대그래프 데이터 변환
  const probChartData = useMemo(() => {
    if (
      !result ||
      result.learning_type !== "supervised" ||
      !result.probabilities
    )
      return [];
    // 객체를 배열 형태로 변환 [{ name: "normal", value: 98.5 }, ...]
    return Object.entries(result.probabilities).map(([key, value]) => ({
      name: key.toUpperCase(),
      value: (Number(value) * 100).toFixed(2), // %로 변환
    }));
  }, [result]);

  // 🌟 [지도 학습용] 입력 원본 데이터 단순 출력용
  const originalChartData = useMemo(() => {
    if (!result || !result.chart_data?.original) return [];
    return result.chart_data.original.map((val: number, idx: number) => ({
      index: idx,
      original: val,
    }));
  }, [result]);

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-6 rounded-xl border shadow-sm items-end">
        {/* 타입 선택 */}
        <div>
          <label className="text-sm font-medium mb-1 block">센서 타입</label>
          <div className="flex bg-muted p-1 rounded-lg">
            <button
              onClick={() => setSensorType("piezo")}
              className={`flex-1 py-1.5 text-sm rounded-md transition ${sensorType === "piezo" ? "bg-white text-black shadow-sm font-bold" : ""}`}
            >
              Piezo
            </button>
            <button
              onClick={() => setSensorType("adxl")}
              className={`flex-1 py-1.5 text-sm rounded-md transition ${sensorType === "adxl" ? "bg-white text-black shadow-sm font-bold" : ""}`}
            >
              ADXL
            </button>
          </div>
        </div>

        {/* 🌟 센서 선택 추가 */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            대상 센서 (물리 정보 주입)
          </label>
          <select
            value={selectedSensorId}
            onChange={(e) => setSelectedSensorId(e.target.value)}
            className="w-full p-2 border rounded-md bg-background"
          >
            {sensors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        </div>

        {/* 모델 선택 */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            사용할 AI 모델
          </label>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="w-full p-2 border rounded-md bg-background"
          >
            <option value="">모델 선택</option>
            {aiModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.model_type} (ID: {m.id})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <label className="text-sm font-semibold text-muted-foreground uppercase">
              분석할 센서 데이터
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => generateDummyData(true)}
                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                정상 데이터 생성
              </button>
              <button
                onClick={() => generateDummyData(false)}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                이상 데이터 생성
              </button>
            </div>
          </div>
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="수치를 콤마(,)로 구분하여 입력하세요."
            className="w-full bg-muted border border-border rounded-lg p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={handlePredict}
          disabled={loading || !selectedModelId}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          {loading ? (
            "분석 중..."
          ) : (
            <>
              <Play size={18} fill="currentColor" /> 예측 실행
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
          {/* 1. 메인 판독 결과 배너 */}
          <div
            className={`p-6 rounded-xl border-2 flex items-center justify-between ${result.severity === "CRITICAL" ? "border-red-200" : result.severity === "WARNING" ? "border-yellow-200" : "border-green-200"}`}
          >
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase mb-1">
                AI 종합 판독 결과 (
                {result.learning_type === "supervised"
                  ? "지도학습/분류"
                  : result.learning_type === "pinn"
                    ? "물리기반/이상탐지"
                    : "비지도학습/이상탐지"}
                )
              </h3>
              <p
                className={`font-black text-3xl ${result.severity === "CRITICAL" ? "text-red-600" : result.severity === "WARNING" ? "text-yellow-600" : "text-green-600"}`}
              >
                {result.severity === "CRITICAL"
                  ? "⚠️ 위험 (CRITICAL)"
                  : result.severity === "WARNING"
                    ? "⚡ 주의 (WARNING)"
                    : "✅ 정상 (SAFE)"}
              </p>
              <p className="text-sm font-semibold mt-2 text-muted-foreground">
                {result.message}
              </p>
            </div>

            <div className="text-right">
              <span className="text-sm font-bold text-muted-foreground uppercase block mb-1">
                {result.learning_type === "supervised"
                  ? "AI 확신도 (Confidence)"
                  : result.learning_type === "pinn"
                    ? "물리 손실 (Physics Loss)"
                    : "이상 점수 (Anomaly Score)"}
              </span>
              <div className="flex items-end gap-1 justify-end">
                <span
                  className={`text-5xl font-black font-mono tracking-tighter ${result.severity === "CRITICAL" ? "text-red-600" : "text-green-600"}`}
                >
                  {result.learning_type === "supervised"
                    ? (result.confidence * 100).toFixed(1)
                    : result.learning_type === "pinn"
                      ? result.physics_loss?.toFixed(2)
                      : (result.anomaly_score * 100).toFixed(1)}
                </span>
                {/* 물리 손실은 %가 아니므로 숨김 처리 */}
                {result.learning_type !== "pinn" && (
                  <span className="text-2xl font-bold text-muted-foreground pb-1">
                    %
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. 상세 지표 (Metrics) 대시보드 */}
          <div className="grid grid-cols-3 gap-4">
            {result.learning_type === "unsupervised" ? (
              <>
                <div className="bg-card border border-border p-4 rounded-xl flex flex-col justify-center items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase mb-1">
                    원시 복원 오차 (Raw MSE)
                  </span>
                  <span className="text-xl font-mono font-black">
                    {result.raw_mse?.toFixed(5)}
                  </span>
                </div>
                <div className="bg-card border border-border p-4 rounded-xl flex flex-col justify-center items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase mb-1">
                    위험 임계치 (Threshold)
                  </span>
                  <span className="text-xl font-mono font-black">
                    {result.threshold}
                  </span>
                </div>
              </>
            ) : result.learning_type === "pinn" ? (
              <>
                <div className="bg-card border border-border p-4 rounded-xl flex flex-col justify-center items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase mb-1">
                    원시 복원 오차 (Raw MSE)
                  </span>
                  <span className="text-xl font-mono font-black">
                    {result.raw_mse?.toFixed(5)}
                  </span>
                </div>
                <div className="bg-card border border-border p-4 rounded-xl flex flex-col justify-center items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                    방정식 위반도 (Physics Loss)
                  </span>
                  <span className="text-xl font-mono font-black text-orange-600">
                    {result.physics_loss?.toFixed(5)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-card border border-border p-4 rounded-xl flex flex-col justify-center items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase mb-1">
                    최종 예측 라벨
                  </span>
                  <span className="text-xl font-black text-indigo-600">
                    {result.prediction?.toUpperCase()}
                  </span>
                </div>
                <div className="bg-card border border-border p-4 rounded-xl flex flex-col justify-center items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase mb-1">
                    예측 확신도
                  </span>
                  <span className="text-xl font-mono font-black">
                    {(result.confidence * 100).toFixed(2)}%
                  </span>
                </div>
              </>
            )}
            <div className="bg-card border border-border p-4 rounded-xl flex flex-col justify-center items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase mb-1">
                판단 알고리즘
              </span>
              <span className="text-xl font-black text-indigo-600">
                {result.model_type}
              </span>
            </div>
          </div>

          {/* 3. [비지도 학습] 재구성(Reconstruction) 차트 */}
          {result.learning_type === "unsupervised" &&
            reconChartData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-bold">
                    파장 복원 분석 (Reconstruction Analysis)
                  </h3>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={reconChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="index" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: "8px" }} />
                      <Legend verticalAlign="top" height={36} />
                      <Area
                        type="monotone"
                        dataKey="error"
                        fill="#e5e7eb"
                        stroke="none"
                        name="복원 오차(Error)"
                        opacity={0.5}
                      />
                      <Line
                        type="monotone"
                        dataKey="original"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        name="실제 센서 데이터"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="reconstructed"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="AI 정상 패턴 복원"
                        dot={false}
                        strokeDasharray="5 5"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          {/* 4. [PINN 학습] 복원 차트 + 물리 잔차 차트 분할 */}
          {result.learning_type === "pinn" &&
            result.chart_data &&
            (() => {
              // PINN 전용 차트 데이터 인라인 매핑
              const pinnChartData = result.chart_data.original.map(
                (val: number, idx: number) => ({
                  index: idx,
                  original: val,
                  reconstructed: result.chart_data.reconstructed[idx],
                  physics_error: result.chart_data.physics_errors[idx] || 0,
                }),
              );

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* 왼쪽: 데이터 복원 차트 */}
                  <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold">
                        파장 복원 (Data Recon)
                      </h3>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={pinnChartData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="index" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ borderRadius: "8px" }} />
                          <Legend verticalAlign="top" height={36} />
                          <Line
                            type="monotone"
                            dataKey="original"
                            stroke="#4f46e5"
                            strokeWidth={2}
                            name="실제 데이터"
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="reconstructed"
                            stroke="#ef4444"
                            strokeWidth={2}
                            name="PINN 복원"
                            dot={false}
                            strokeDasharray="5 5"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 오른쪽: 물리 잔차(방정식 위반) 차트 */}
                  <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-orange-600">
                        물리 잔차 (Physics Residuals)
                      </h3>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={pinnChartData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="index" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ borderRadius: "8px" }} />
                          <Legend verticalAlign="top" height={36} />
                          <Area
                            type="monotone"
                            dataKey="physics_error"
                            stroke="#ea580c"
                            fill="#fdba74"
                            name="방정식 위반도"
                            opacity={0.8}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* 5. [지도 학습] 확률 분포 막대그래프 & 원본 파장 */}
          {result.learning_type === "supervised" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-bold">
                    AI 라벨별 예측 확률 (Probabilities)
                  </h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={probChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        opacity={0.3}
                      />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        fontWeight="bold"
                      />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar
                        dataKey="value"
                        name="예측 확률(%)"
                        radius={[0, 4, 4, 0]}
                      >
                        {probChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.name === result.prediction.toUpperCase()
                                ? "#4f46e5"
                                : "#d1d5db"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-bold">
                    입력된 센서 파장 (Input Data)
                  </h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={originalChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="index" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: "8px" }} />
                      <Line
                        type="monotone"
                        dataKey="original"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        name="원본 데이터"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
