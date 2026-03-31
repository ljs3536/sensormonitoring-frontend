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
} from "recharts";

export function AnalysisDashboard() {
  const [sensorType, setSensorType] = useState("piezo");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [aiModels, setAiModels] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");

  const fetchAiModels = async () => {
    try {
      const res = await fetch(API.AI_MODELS);
      if (res.ok) setAiModels(await res.json());
    } catch (e) {
      console.error("Model fetch error:", e);
    }
  };

  useEffect(() => {
    fetchAiModels();
  }, []);

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

  const generateDummyData = (isNormal: boolean) => {
    const data = [];
    for (let i = 0; i < 128; i++) {
      let val = Math.sin(i * 0.1) * 2.0 + (Math.random() * 0.2 - 0.1);
      if (!isNormal) {
        if (i >= 50 && i <= 60) {
          val += Math.random() * 5 + 3;
        }
        if (i > 90) {
          val += Math.sin(i * 1.5) * 2;
        }
      }
      data.push(val.toFixed(3));
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

    if (dataArray.length < 128)
      return alert("데이터가 최소 128개 이상이어야 합니다.");

    setLoading(true);
    try {
      const res = await fetch(API.AI_PREDICT(Number(selectedModelId)), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataArray),
      });

      if (res.ok) {
        setResult(await res.json());
      } else {
        alert("분석 요청 실패");
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-card border border-border rounded-xl p-8 shadow-sm space-y-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="text-indigo-500" /> 수동 데이터 AI 예측
            (Predict)
          </h2>

          <div className="flex gap-4">
            <select
              value={sensorType}
              onChange={(e) => setSensorType(e.target.value)}
              className="w-1/3 bg-background border p-3 rounded-lg text-sm font-bold outline-none"
            >
              <option value="piezo">PIEZO 센서</option>
              <option value="adxl">ADXL 센서</option>
            </select>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-2/3 bg-background border border-border p-3 rounded-lg text-sm outline-none"
              disabled={availableModels.length === 0}
            >
              {availableModels.length === 0 ? (
                <option value="">적용 가능한 READY 모델이 없습니다.</option>
              ) : (
                availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    ID: {model.id} - {model.model_type} (
                    {new Date(model.created_at).toLocaleDateString()})
                  </option>
                ))
              )}
            </select>
          </div>
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
                  : "이상 점수 (Anomaly Score)"}
              </span>
              <div className="flex items-end gap-1">
                <span
                  className={`text-5xl font-black font-mono tracking-tighter ${result.severity === "CRITICAL" ? "text-red-600" : "text-green-600"}`}
                >
                  {result.learning_type === "supervised"
                    ? (result.confidence * 100).toFixed(1)
                    : (result.anomaly_score * 100).toFixed(1)}
                </span>
                <span className="text-2xl font-bold text-muted-foreground pb-1">
                  %
                </span>
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
                {result.learning_type === "supervised"
                  ? "CNN-LSTM Classifier"
                  : "AutoEncoder"}
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

          {/* 4. [지도 학습] 확률 분포 막대그래프 & 원본 파장 */}
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
