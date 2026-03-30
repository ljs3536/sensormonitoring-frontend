// src/components/analysis/AnalysisDashboard.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Play, Activity } from "lucide-react";
import { API } from "@/lib/api"; // API 임포트
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
} from "recharts";

export function AnalysisDashboard() {
  const [sensorType, setSensorType] = useState("piezo");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 🌟 새롭게 추가된 상태 (해당 페이지에서만 독립적으로 관리)
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");

  // 1. 페이지 로드 시 DB에서 전체 모델 목록 가져오기
  const fetchAiModels = async () => {
    try {
      const res = await fetch(API.AI_MODELS); // api.ts에 AI_MODELS가 추가되어 있어야 합니다!
      if (res.ok) setAiModels(await res.json());
    } catch (e) {
      console.error("Model fetch error:", e);
    }
  };

  useEffect(() => {
    fetchAiModels();
  }, []);

  // 2. 현재 선택된 센서에 맞는 'READY' 상태의 모델들만 필터링
  const availableModels = aiModels.filter(
    (m) => m.sensor_type === sensorType && m.status === "READY",
  );

  // 3. 센서 타입이 바뀌면, 선택된 모델을 자동으로 첫 번째 모델로 세팅
  useEffect(() => {
    if (availableModels.length > 0) {
      setSelectedModelId(String(availableModels[0].id));
    } else {
      setSelectedModelId("");
    }
  }, [sensorType, aiModels]); // aiModels나 sensorType이 변경될 때마다 재계산

  // 더미 데이터 생성 기능 (진짜 센서처럼 사인파 기반으로 변경)
  const generateDummyData = (isNormal: boolean) => {
    const data = [];

    for (let i = 0; i < 128; i++) {
      // 1. 정상 패턴: 일정한 주기를 가진 사인파(Sine Wave) + 미세한 진동(노이즈)
      let val = Math.sin(i * 0.2) + (Math.random() * 0.2 - 0.1);

      // 2. 비정상 패턴: 특정 구간에서 파형이 완전히 망가지게 만듦
      if (!isNormal) {
        // 이상 케이스 A: 장비에 '쿵' 하는 큰 충격이 발생했을 때 (인덱스 50~60 구간)
        if (i >= 50 && i <= 60) {
          val += Math.random() * 5 + 3; // 갑자기 값이 위로 크게 솟구침
        }

        // 이상 케이스 B: 베어링 등이 마모되어 미세하고 빠른 떨림이 추가됐을 때 (인덱스 90 이후)
        if (i > 90) {
          val += Math.sin(i * 1.5) * 2; // 주파수가 갑자기 요동침
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

    // 콤마 단위로 파싱하여 배열 생성
    const dataArray = inputText
      .split(",")
      .map((v) => parseFloat(v.trim()))
      .filter((v) => !isNaN(v));

    if (dataArray.length < 128)
      return alert("데이터가 최소 128개 이상이어야 합니다.");

    setLoading(true);
    try {
      // 🌟 api.ts의 AI_PREDICT에 선택된 modelId를 넘겨서 호출
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
  // 차트에 그릴 수 있도록 데이터를 변환하는 로직 (useMemo로 최적화)
  const chartData = useMemo(() => {
    if (!result || !result.chart_data) return [];

    return result.chart_data.original.map((val: number, idx: number) => ({
      index: idx,
      original: val,
      reconstructed: result.chart_data.reconstructed[idx],
      error: result.chart_data.errors[idx],
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

          {/* 센서 및 모델 선택 영역 */}
          <div className="flex gap-4">
            <select
              value={sensorType}
              onChange={(e) => setSensorType(e.target.value)}
              className="w-1/3 bg-background border p-3 rounded-lg text-sm font-bold outline-none"
            >
              <option value="piezo">PIEZO 센서</option>
              <option value="adxl">ADXL 센서</option>
            </select>

            {/* 🔥 모델 선택 드롭다운 */}
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

        {/* 데이터 입력 영역 */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <label className="text-sm font-semibold text-muted-foreground uppercase">
              분석할 센서 데이터 (배열)
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
            placeholder="수치를 콤마(,)로 구분하여 입력하세요. (예: 0.1, -0.2, 1.5)"
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
              <Play size={18} fill="currentColor" /> ID {selectedModelId || "?"}{" "}
              모델로 예측 실행
            </>
          )}
        </button>
      </div>

      {/* 분석 결과 출력 영역 */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
          {/* 1. 메인 판독 결과 배너 */}
          <div
            className={`p-6 rounded-xl border-2 flex items-center justify-between ${
              result.severity === "CRITICAL"
                ? "border-red-200"
                : result.severity === "WARNING"
                  ? "border-yellow-200"
                  : "border-green-200"
            }`}
          >
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase mb-1">
                AI 종합 판독 결과
              </h3>
              <p
                className={`font-black text-3xl ${
                  result.severity === "CRITICAL"
                    ? "text-red-600"
                    : result.severity === "WARNING"
                      ? "text-yellow-600"
                      : "text-green-600"
                }`}
              >
                {result.severity === "CRITICAL"
                  ? "⚠️ 위험 (CRITICAL)"
                  : result.severity === "WARNING"
                    ? "⚡ 주의 (WARNING)"
                    : "✅ 정상 (SAFE)"}
              </p>
              <p className="text-sm font-semibold mt-2 text-muted-foreground">
                {result.message ||
                  (result.prediction === "abnormal"
                    ? "이상 징후가 감지되었습니다."
                    : "정상적인 패턴입니다.")}
              </p>
            </div>

            <div className="text-right">
              <span className="text-sm font-bold text-muted-foreground uppercase block mb-1">
                Anomaly Score
              </span>
              <div className="flex items-end gap-1">
                <span
                  className={`text-5xl font-black font-mono tracking-tighter ${
                    result.severity === "CRITICAL"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {(result.anomaly_score * 100).toFixed(1)}
                </span>
                <span className="text-2xl font-bold text-muted-foreground pb-1">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* 2. 상세 지표 (Metrics) 대시보드 */}
          {result.raw_mse !== undefined && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border border-border p-4 rounded-xl flex flex-col justify-center items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase mb-1">
                  원시 복원 오차 (Raw MSE)
                </span>
                <span className="text-xl font-mono font-black">
                  {result.raw_mse.toFixed(5)}
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
              <div className="bg-card border border-border p-4 rounded-xl flex flex-col justify-center items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase mb-1">
                  판단 알고리즘
                </span>
                <span className="text-xl font-black text-indigo-600">
                  AutoEncoder
                </span>
              </div>
            </div>
          )}
          {/* 3. 새롭게 추가된 데이터 재구성(Reconstruction) 차트 */}
          {chartData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-bold">
                  파장 복원 분석 (Reconstruction Analysis)
                </h3>
                <p className="text-sm text-muted-foreground">
                  AI가 학습한 정상 패턴(빨간색)과 실제 입력된 데이터(파란색)의
                  차이를 보여줍니다. 차이가 클수록(회색 음영) 이상 징후일 확률이
                  높습니다.
                </p>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="index" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      }}
                      labelStyle={{ fontWeight: "bold", color: "#666" }}
                    />
                    <Legend verticalAlign="top" height={36} />

                    {/* 에러 발생 구간을 회색 음영으로 표시 */}
                    <Area
                      type="monotone"
                      dataKey="error"
                      fill="#e5e7eb"
                      stroke="none"
                      name="복원 오차(Error)"
                      opacity={0.5}
                    />

                    {/* 실제 데이터 */}
                    <Line
                      type="monotone"
                      dataKey="original"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      name="실제 센서 데이터"
                      dot={false}
                    />

                    {/* AI가 복원한(기대하는) 데이터 */}
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
        </div>
      )}
    </div>
  );
}
