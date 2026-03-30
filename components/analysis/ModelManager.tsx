// src/components/analysis/ModelManager.tsx
"use client";

import { useState, useEffect } from "react";
import { PlayCircle, RefreshCw, Trash2, CheckSquare } from "lucide-react";
import { API } from "@/lib/api";

export function ModelManager() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("AutoEncoder");

  // 🌟 추가된 상태: 모델 목록 및 선택된 모델 ID 관리
  const [models, setModels] = useState<any[]>([]);
  const [checkedIds, setCheckedIds] = useState<number[]>([]);

  // 시스템 전반적인 상태 조회
  const fetchStatus = async () => {
    try {
      const res = await fetch(API.AI_STATUS);
      if (res.ok) setStatus(await res.json());
    } catch (e) {
      console.error("상태 조회 실패", e);
    }
  };

  // 🌟 추가됨: 등록된 모델 목록 조회
  const fetchModels = async () => {
    try {
      const res = await fetch(API.AI_MODELS);
      if (res.ok) setModels(await res.json());
    } catch (e) {
      console.error("모델 목록 조회 실패", e);
    }
  };

  const handleTrain = async (sensorType: string) => {
    setLoading(true);
    try {
      await fetch(API.AI_TRAIN(sensorType, selectedModel), { method: "POST" });
      alert(`${sensorType} (${selectedModel}) 학습이 시작되었습니다!`);
      fetchStatus();
      fetchModels(); // 학습 시작 후 목록 즉시 갱신
    } catch (e) {
      alert("학습 요청 실패");
    }
    setLoading(false);
  };

  // 🌟 추가됨: 체크박스 토글 핸들러
  const handleToggleCheck = (id: number) => {
    setCheckedIds((prev) =>
      prev.includes(id)
        ? prev.filter((checkedId) => checkedId !== id)
        : [...prev, id],
    );
  };

  // 🌟 추가됨: 선택된 모델 일괄 삭제 핸들러
  const handleDeleteSelected = async () => {
    if (checkedIds.length === 0) return alert("삭제할 모델을 선택해주세요.");
    if (
      !confirm(`선택한 ${checkedIds.length}개의 모델을 정말 삭제하시겠습니까?`)
    )
      return;

    setLoading(true);
    try {
      // 선택된 ID 배열을 순회하며 삭제 API 호출 (Promise.all로 병렬 처리)
      await Promise.all(
        checkedIds.map((id) =>
          fetch(API.AI_MODEL_DELETE(id), { method: "DELETE" }),
        ),
      );

      alert("선택한 모델이 삭제되었습니다.");
      setCheckedIds([]); // 체크박스 초기화
      fetchModels(); // 목록 새로고침
    } catch (e) {
      console.error("모델 삭제 에러:", e);
      alert("일부 모델 삭제에 실패했습니다.");
    }
    setLoading(false);
  };

  // 주기적으로 상태와 목록을 갱신합니다.
  useEffect(() => {
    fetchStatus();
    fetchModels();

    // 학습 중일 때는 상태가 변할 수 있으므로 5초마다 갱신 (선택 사항)
    const timer = setInterval(() => {
      fetchStatus();
      fetchModels();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* --- 상단: 시스템 상태 --- */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <RefreshCw
            className={
              status?.status === "training"
                ? "animate-spin text-yellow-500"
                : "text-green-500"
            }
            size={20}
          />
          현재 AI 엔진 상태:{" "}
          <span className="text-indigo-500 uppercase">
            {status?.status || "Unknown"}
          </span>
        </h3>
        <p className="text-sm text-muted-foreground">
          마지막 학습 시간: {status?.last_trained || "기록 없음"}
        </p>
      </div>

      {/* --- 중단: 새 모델 생성 폼 --- */}
      <div className="grid grid-cols-2 gap-6">
        {["piezo", "adxl"].map((type) => (
          <div
            key={type}
            className="bg-card border border-border rounded-xl p-6 space-y-4"
          >
            <h4 className="font-bold uppercase text-primary text-lg">
              {type} 센서 학습
            </h4>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase font-semibold">
                알고리즘
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-muted p-3 rounded-lg text-sm font-bold outline-none"
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
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <PlayCircle size={20} /> 새 모델 데이터 학습 시작
            </button>
          </div>
        ))}
      </div>

      {/* --- 하단: 생성된 모델 관리 리스트 --- */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CheckSquare className="text-indigo-500" /> 등록된 모델 관리
            레지스트리
          </h3>
          <button
            onClick={handleDeleteSelected}
            disabled={checkedIds.length === 0 || loading}
            className="px-4 py-2 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm"
          >
            <Trash2 size={16} /> 선택 삭제 ({checkedIds.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-xs font-bold">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg w-10">
                  {/* 전체 선택 체크박스를 넣을 수도 있는 자리 */}
                </th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">센서 타입</th>
                <th className="px-4 py-3">알고리즘</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3 rounded-tr-lg">생성일시</th>
              </tr>
            </thead>
            <tbody>
              {models.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    등록된 모델이 없습니다.
                  </td>
                </tr>
              ) : (
                models.map((model) => (
                  <tr
                    key={model.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={checkedIds.includes(model.id)}
                        onChange={() => handleToggleCheck(model.id)}
                        className="w-4 h-4 cursor-pointer accent-indigo-600"
                      />
                    </td>
                    <td className="px-4 py-3 font-bold">{model.id}</td>
                    <td className="px-4 py-3 uppercase font-semibold text-indigo-600">
                      {model.sensor_type}
                    </td>
                    <td className="px-4 py-3">{model.model_type}</td>
                    <td className="px-4 py-3">
                      {/* 상태별 뱃지 컬러링 */}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-black
                        ${
                          model.status === "READY"
                            ? "bg-green-100 text-green-700"
                            : model.status === "TRAINING"
                              ? "bg-yellow-100 text-yellow-700 animate-pulse"
                              : "bg-red-100 text-red-700"
                        }
                      `}
                      >
                        {model.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(model.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
