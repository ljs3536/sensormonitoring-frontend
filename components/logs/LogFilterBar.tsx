"use client";

import { useState, useEffect } from "react";
import { API } from "@/lib/api";

interface LogFilterBarProps {
  onSearch: (filters: {
    macAddr: string;
    modelId: string;
    result: string;
  }) => void;
}

export function LogFilterBar({ onSearch }: LogFilterBarProps) {
  const [macAddr, setMacAddr] = useState("전체");
  const [modelId, setModelId] = useState("전체");
  const [result, setResult] = useState("전체");
  const [sensorType, setSensorType] = useState("normal");
  const [sensors, setSensors] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const res = await fetch(
          `${API.SENSOR_LIST}?sensor_type=normal&is_active=true`,
        );
        if (res.ok) {
          const data = await res.json();
          setSensors(data);
          if (data.length > 0) setMacAddr(data[0].id);
        }
      } catch (e) {
        console.error("센서 로드 실패", e);
      }
    };
    fetchSensors();
  }, []);

  //2. 센서(macAddr)가 변경될 때마다 해당 센서의 모델 목록 로드
  useEffect(() => {
    if (!macAddr || macAddr === "전체") {
      setModels([]);
      setModelId("전체");
      return;
    }

    const fetchModels = async () => {
      try {
        // 백엔드에서 새로 만든 API 호출 (/api/proto/models/list/{mac_addr})
        const res = await fetch(`${API.PROTO_MODEL_LIST}/list/${macAddr}`);
        if (res.ok) {
          const data = await res.json();
          setModels(data);
          setModelId("전체"); // 센서가 바뀌면 모델 선택도 초기화
        }
      } catch (e) {
        console.error("모델 로드 실패", e);
      }
    };

    fetchModels();
  }, [macAddr]);

  return (
    <div className="flex items-center gap-4 text-sm bg-white p-3 rounded shadow-sm border">
      {/* 센서 선택 */}
      <div className="flex items-center gap-2">
        <label className="font-bold text-gray-700">센서</label>
        <select
          className="border p-1 rounded min-w-[120px] text-black"
          value={macAddr}
          onChange={(e) => setMacAddr(e.target.value)}
        >
          {sensors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* 모델 선택 (센서에 종속적) */}
      <div className="flex items-center gap-2">
        <label className="font-bold text-gray-700">모델 버전</label>
        <select
          className="border p-1 rounded min-w-[150px] text-black"
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
        >
          <option value="전체">모든 버전</option>
          {models.map((m) => (
            <option key={m.model_id} value={m.model_id}>
              v{m.version} ({m.model_type}) {m.status === "ACTIVE" ? "🟢" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* 판정 결과 */}
      <div className="flex items-center gap-2">
        <label className="font-bold text-gray-700">결과</label>
        <select
          className="border p-1 rounded text-black"
          value={result}
          onChange={(e) => setResult(e.target.value)}
        >
          <option value="전체">전체</option>
          <option value="Y">누출(Y)</option>
          <option value="N">정상(N)</option>
        </select>
      </div>

      <button
        onClick={() => onSearch({ macAddr, modelId, result })}
        className="ml-auto bg-blue-600 text-white px-5 py-1.5 rounded font-bold hover:bg-blue-700 transition-colors"
      >
        로그 조회
      </button>
    </div>
  );
}
