"use client";

import { useState, useEffect } from "react";
import { API } from "@/lib/api"; // api.ts 연동[cite: 2]

// 부모 컴포넌트(page.tsx)에서 받을 props 정의
interface LeakFilterBarProps {
  onSearch: (data: any[]) => void;
  onPredict: () => void; // 🌟 추가
  selectedModelType: "all" | "few"; // 🌟 추가
  onModelTypeChange: (type: "all" | "few") => void;
}

export function ProtoFilterBar({
  onSearch,
  onPredict,
  selectedModelType,
  onModelTypeChange,
}: LeakFilterBarProps) {
  const getTodayWithTime = (timeString: string) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // 월은 0부터 시작하므로 +1, 두자리수 맞춤
    const day = String(today.getDate()).padStart(2, "0"); // 두자리수 맞춤

    return `${year}-${month}-${day}T${timeString}`;
  };

  // 필터 상태 관리
  const [macAddr, setMacAddr] = useState("누출테스트");
  const [leakStatus, setLeakStatus] = useState("전체");
  const [probMin, setProbMin] = useState("0");
  const [probMax, setProbMax] = useState("500");
  const [startDate, setStartDate] = useState(getTodayWithTime("09:00"));
  const [endDate, setEndDate] = useState(getTodayWithTime("18:00"));
  const [sensorType, setSensorType] = useState("normal");
  const [sensors, setSensors] = useState<any[]>([]);

  const [updateMode, setUpdateMode] = useState<"replace" | "ema">("replace"); // 🌟 NEW

  const fetchSensors = async () => {
    try {
      const res = await fetch(API.SENSOR_LIST);
      const data = await res.json();
      // 현재 선택된 타입(piezo/adxl)에 맞는 센서만 필터링
      // 1. 현재 선택된 타입(piezo/adxl 등)에 맞는 센서만 필터링
      const filteredSensors = data.filter(
        (s: any) => s.type === sensorType && s.is_active,
      );

      // 2. 상태에 저장
      setSensors(filteredSensors);

      if (filteredSensors.length > 0) {
        setMacAddr(filteredSensors[0].id);
      } else {
        // 만약 조건에 맞는 센서가 아예 없다면 초기화
        setMacAddr("");
      }
    } catch (e) {
      console.error("센서 로드 실패", e);
    }
  };
  // 모델 갱신 API 호출 핸들러
  const handleTrainModel = async () => {
    try {
      // sensor_id는 현재 선택된 센서 ID (예: "piezo_01")
      const res = await fetch(
        API.TRAIN_PROTO_MODEL(macAddr, selectedModelType, updateMode),
        {
          method: "POST", // 🚨 반드시 POST로 설정해야 합니다!
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
      } else {
        console.error("훈련 요청 실패:", res.status);
      }
    } catch (error) {
      console.error("네트워크 에러:", error);
    }
  };

  // [수정됨] 검색 API 호출 후 결과 전달
  const searchSensors = async () => {
    try {
      // API.SENSOR_LEAK_LIST는 api.ts에 정의되어 있어야 합니다.
      const res = await fetch(
        API.SENSOR_PROTO_LIST(macAddr, leakStatus, startDate, endDate),
        { method: "GET" },
      );
      if (res.ok) {
        const data = await res.json();
        console.log(data);
        onSearch(data); // 검색된 배열을 부모 컴포넌트로 전달!
      } else {
        alert("데이터를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("검색 에러:", error);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, [sensorType]);
  return (
    <div className="flex flex-col gap-4 text-sm">
      {/* 1. 상단 필터 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 border rounded text-black">
        {/* 맥주소 & 누출여부 */}
        <div className="flex items-center gap-2">
          <label className="font-bold w-20 text-right">맥주소</label>
          <select
            className="border p-1 flex-1"
            value={macAddr}
            onChange={(e) => setMacAddr(e.target.value)}
          >
            {sensors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>

          <label className="font-bold w-20 text-right">누출여부</label>
          <select
            className="border p-1 flex-1"
            value={leakStatus}
            onChange={(e) => setLeakStatus(e.target.value)}
          >
            <option value="전체">--전체--</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>

        {/* 누출확률(%) */}
        <div className="flex items-center gap-2">
          <label className="font-bold w-28 text-right">누출확률(%)</label>
          <input
            type="number"
            className="border p-1 w-20 text-right"
            value={probMin}
            onChange={(e) => setProbMin(e.target.value)}
          />
          <span>~</span>
          <input
            type="number"
            className="border p-1 w-20 text-right"
            value={probMax}
            onChange={(e) => setProbMax(e.target.value)}
          />
          <span>%</span>
        </div>

        {/* 기간 */}
        <div className="flex items-center gap-2 col-span-1 md:col-span-3">
          <label className="font-bold w-20 text-right">기간</label>
          <input
            type="datetime-local"
            className="border p-1"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span>~</span>
          <input
            type="datetime-local"
            className="border p-1"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* 2. 하단 버튼 영역 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {/* 🌟 예측 버튼 추가 */}
          <button
            onClick={onPredict}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded shadow"
          >
            선택 데이터 AI 예측
          </button>
          <button className="bg-red-500 text-white px-4 py-1 rounded">
            누출처리
          </button>
          <button className="bg-teal-500 text-white px-4 py-1 rounded">
            미누출처리
          </button>
        </div>

        <div className="flex gap-2">
          <button className="bg-gray-600 text-white px-3 py-1 rounded">
            갱신/비갱신 처리
          </button>
          <button className="bg-gray-600 text-white px-3 py-1 rounded">
            데이터 처리 테스트
          </button>
          <button className="bg-gray-600 text-white px-3 py-1 rounded">
            db접속테스트
          </button>
          <button
            onClick={searchSensors}
            className="bg-gray-800 text-white px-4 py-1 rounded font-bold"
          >
            검색
          </button>
          <button className="bg-gray-600 text-white px-3 py-1 rounded">
            초기화
          </button>
          <button className="bg-gray-600 text-white px-3 py-1 rounded">
            이벤트이력 다운로드
          </button>
        </div>
      </div>

      {/* 3. 모델 갱신 버튼 (우측 정렬) */}
      <div className="flex justify-end mt-4 items-stretch gap-2">
        {/* 🌟 모델 선택 드롭다운 */}
        <select
          value={selectedModelType}
          onChange={(e) => onModelTypeChange(e.target.value as "all" | "few")}
          className="border border-gray-300 rounded px-2 py-1 text-black bg-white"
        >
          <option value="all">All-Shot 모델 (전체평균)</option>
          <option value="few">Few-Shot 모델 (5개추출)</option>
        </select>
        {/* 🌟 2. [NEW] 업데이트 모드 선택 (완전교체 / 미세조정) */}
        <select
          value={updateMode}
          onChange={(e) => setUpdateMode(e.target.value as "replace" | "ema")}
          className="border border-indigo-300 rounded px-3 py-2 text-indigo-900 bg-indigo-50 font-semibold"
        >
          <option value="replace">새 모델로 완전 교체 (Replace)</option>
          <option value="ema">기존 모델 10% 미세조정 (EMA)</option>
        </select>
        <button
          onClick={handleTrainModel}
          className="bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-2 rounded shadow"
        >
          누출확률계산모델갱신
        </button>
      </div>
    </div>
  );
}
