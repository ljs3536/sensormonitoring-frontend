// src/components/analysis/ModelManager.tsx
"use client";

import { useState, useEffect } from "react";
import { PlayCircle, RefreshCw, Trash2, CheckSquare } from "lucide-react";
import { API } from "@/lib/api";

export function ModelManager() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("AutoEncoder");
  const [sensorType, setSensorType] = useState("piezo");

  // 🌟 추가된 상태: 모델 목록 및 선택된 모델 ID 관리
  const [models, setModels] = useState<any[]>([]);
  const [checkedIds, setCheckedIds] = useState<number[]>([]);

  // 🌟 추가: 센서 목록 및 선택된 센서 상태
  const [sensors, setSensors] = useState<any[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState<string>("");

  // 센서 목록 가져오기
  const fetchSensors = async () => {
    try {
      const res = await fetch(API.SENSOR_LIST);
      const data = await res.json();
      // 현재 선택된 타입(piezo/adxl)에 맞는 센서만 필터링
      setSensors(data.filter((s: any) => s.type === sensorType && s.is_active));
    } catch (e) {
      console.error("센서 로드 실패", e);
    }
  };

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

  const handleTrain = async () => {
    setLoading(true);
    try {
      await fetch(API.AI_TRAIN(sensorType, selectedModel, selectedSensorId), {
        method: "POST",
      });
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
    fetchSensors();
    // 학습 중일 때는 상태가 변할 수 있으므로 5초마다 갱신 (선택 사항)
    const timer = setInterval(() => {
      fetchStatus();
      fetchModels();
    }, 5000);
    return () => clearInterval(timer);
  }, [sensorType]);

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-xl border shadow-sm">
        <h3 className="text-lg font-bold mb-4">신규 모델 학습 요청</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* 타입 선택 */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              데이터 타입
            </label>
            <select
              value={sensorType}
              onChange={(e) => setSensorType(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="piezo">Piezo (진동)</option>
              <option value="adxl">ADXL (가속도)</option>
            </select>
          </div>

          {/* 🌟 센서 선택 추가 */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              학습 타겟 센서 (Optional)
            </label>
            <select
              value={selectedSensorId}
              onChange={(e) => setSelectedSensorId(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="">전체 데이터 학습</option>
              {sensors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">알고리즘</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="AutoEncoder">AutoEncoder</option>
              <option value="CNNLSTM_Classifier">CNN-LSTM Classifier</option>
              <option value="PINN_CNNLSTMAutoEncoder">
                PINN_CNNLSTMAutoEncoder
              </option>
            </select>
          </div>

          <button
            onClick={handleTrain}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <PlayCircle size={18} />
            {loading ? "요청 중..." : "학습 시작"}
          </button>
        </div>
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
