// src/components/analysis/AnalysisDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { Play, Activity } from "lucide-react";
import { API } from "@/lib/api"; // API 임포트

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

  // 더미 데이터 생성 기능
  const generateDummyData = (isNormal: boolean) => {
    const data = [];
    for (let i = 0; i < 128; i++) {
      const val = isNormal
        ? Math.random() * 0.5 - 0.25
        : Math.random() * 5 - 2.5;
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
              className="w-2/3 bg-muted border border-border p-3 rounded-lg text-sm outline-none"
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
        <div
          className={`p-8 rounded-xl border-2 flex items-center justify-between animate-in fade-in duration-500 ${result.anomaly_score > 0.7 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}
        >
          <div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase mb-1">
              AI 판독 결과
            </h3>
            <p
              className={`font-black text-3xl ${result.anomaly_score > 0.7 ? "text-red-600" : "text-green-600"}`}
            >
              {result.prediction === "abnormal"
                ? "⚠️ 이상(Abnormal) 감지!"
                : "✅ 정상(Normal) 상태"}
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-muted-foreground uppercase block">
              Anomaly Score
            </span>
            <span className="text-4xl font-black font-mono">
              {(result.anomaly_score * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
