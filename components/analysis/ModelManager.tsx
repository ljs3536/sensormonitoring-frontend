// src/components/analysis/ModelManager.tsx
"use client";

import { useState, useEffect } from "react";
import { PlayCircle, RefreshCw } from "lucide-react";
import { API } from "@/lib/api"; // API 임포트

export function ModelManager() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("AutoEncoder");

  const fetchStatus = async () => {
    try {
      const res = await fetch(API.AI_STATUS);
      if (res.ok) setStatus(await res.json());
    } catch (e) {
      console.error("상태 조회 실패", e);
    }
  };

  const handleTrain = async (sensorType: string) => {
    setLoading(true);
    try {
      await fetch(API.AI_TRAIN(sensorType, selectedModel), { method: "POST" });
      alert(`${sensorType} (${selectedModel}) 학습이 시작되었습니다!`);
      fetchStatus();
    } catch (e) {
      alert("학습 요청 실패");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <RefreshCw
            className={status?.status === "training" ? "animate-spin" : ""}
            size={20}
          />
          현재 모델 상태:{" "}
          <span className="text-indigo-500 uppercase">
            {status?.status || "Unknown"}
          </span>
        </h3>
        <p className="text-sm text-muted-foreground">
          마지막 학습 시간: {status?.last_trained || "기록 없음"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {["piezo", "adxl"].map((type) => (
          <div
            key={type}
            className="bg-card border border-border rounded-xl p-6 space-y-4"
          >
            <h4 className="font-bold uppercase text-primary">
              {type} 분석 모델
            </h4>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase font-semibold">
                알고리즘
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-muted p-2 rounded text-sm outline-none"
              >
                <option value="AutoEncoder">
                  AutoEncoder (Anomaly Detection)
                </option>
                <option value="LSTM" disabled>
                  LSTM (Future Prediction) - 준비중
                </option>
              </select>
            </div>
            <button
              onClick={() => handleTrain(type)}
              disabled={loading || status?.status === "training"}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <PlayCircle size={18} /> 새 모델 학습 시작
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
