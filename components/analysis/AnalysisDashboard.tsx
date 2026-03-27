// src/components/analysis/AnalysisDashboard.tsx
"use client";

import { useState } from "react";
import { Play, Activity } from "lucide-react";
import { API } from "@/lib/api"; // API 임포트

export function AnalysisDashboard() {
  const [sensorType, setSensorType] = useState("piezo");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    if (!inputText) return alert("데이터를 입력하거나 생성해주세요.");

    // 콤마 단위로 파싱하여 배열 생성
    const dataArray = inputText
      .split(",")
      .map((v) => parseFloat(v.trim()))
      .filter((v) => !isNaN(v));

    setLoading(true);
    try {
      // api.ts를 활용하여 POST 요청에 데이터 바디 포함
      const res = await fetch(API.AI_ANALYZE(sensorType, "AutoEncoder"), {
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="text-indigo-500" /> 수동 데이터 AI 예측
            (Predict)
          </h2>
          <select
            value={sensorType}
            onChange={(e) => setSensorType(e.target.value)}
            className="bg-background border p-2 rounded-lg text-sm font-bold outline-none"
          >
            <option value="piezo">PIEZO 센서 예측</option>
            <option value="adxl">ADXL 센서 예측</option>
          </select>
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
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          {loading ? (
            "분석 중..."
          ) : (
            <>
              <Play size={18} fill="currentColor" /> AI 예측 실행하기
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
