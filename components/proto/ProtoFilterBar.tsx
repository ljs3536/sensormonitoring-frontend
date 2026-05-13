"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { API } from "@/lib/api"; // api.ts 연동[cite: 2]

// 부모 컴포넌트(page.tsx)에서 받을 props 정의
interface LeakFilterBarProps {
  onSearch: (data: any[], totalCount: number) => void;
  onPredict: () => void;
  selectedModelType: "all" | "few";
  onModelTypeChange: (type: "all" | "few") => void;
  //페이징 Props 추가
  page: number;
  setPage: (page: number) => void;
  size: number;
}

export function ProtoFilterBar({
  onSearch,
  onPredict,
  selectedModelType,
  onModelTypeChange,
  page,
  setPage,
  size,
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

  const [updateMode, setUpdateMode] = useState<"replace" | "ema">("replace"); //NEW
  // 처음 마운트되었는지 확인하는 ref
  const isFirstRender = useRef(true);

  const fetchSensors = async () => {
    try {
      // URL에 쿼리 파라미터를 추가하여 필요한 데이터만 요청합니다.
      const url = `${API.SENSOR_LIST}?sensor_type=${sensorType}&is_active=true`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();

        // 🌟 백엔드에서 이미 필터링된 데이터를 주므로 바로 저장합니다.
        setSensors(data);

        if (data.length > 0) {
          setMacAddr(data[0].id);
        } else {
          setMacAddr("");
        }
      }
    } catch (e) {
      console.error("센서 로드 실패", e);
    }
  };
  // 모델 갱신 API 호출 핸들러
  const handleTrainModel = async () => {
    const memo = window.prompt(
      "이번 모델 학습에 대한 메모를 입력해주세요.\n(예: 센서 위치 조정 후 재학습, 노이즈 데이터 제외 등)",
    );

    // 취소 버튼을 눌렀을 경우 함수 종료
    if (memo === null) return;

    try {
      // 2. API 호출 시 memo 전달 (URL 파라미터에 추가)
      const url = API.TRAIN_PROTO_MODEL(macAddr, selectedModelType, updateMode);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // JSON 형식임을 명시
        },
        body: JSON.stringify({
          memo: memo, // 메모 내용을 JSON 바디에 담기
        }),
      });

      if (res.ok) {
        alert("학습 요청이 완료되었습니다. 메모가 함께 저장됩니다.");
      }
    } catch (error) {
      console.error("학습 요청 실패:", error);
    }
  };

  // [핵심] 검색 로직을 useCallback으로 분리 (targetPage 인자 추가)
  const searchSensors = useCallback(
    async (targetPage: number) => {
      try {
        const baseUrl = API.SENSOR_PROTO_LIST(
          macAddr,
          leakStatus,
          startDate,
          endDate,
        );

        // 1. baseUrl에 이미 '?' 파라미터가 있는지 확인하여 안전하게 연결자 선택
        const separator = baseUrl.includes("?") ? "&" : "?";

        // 2. 파라미터 결합
        const rawUrl = `${baseUrl}${separator}page=${targetPage}&size=${size}`;

        // 3. 한글("누출테스트")이나 특수문자(T 등)로 인한 fetch 파싱 에러를 막기 위해 인코딩 처리
        const finalUrl = encodeURI(rawUrl);

        const res = await fetch(finalUrl, { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          // 백엔드에서 준 items와 total을 부모(page.tsx)의 handleSearch로 보냅니다.
          onSearch(data.items || [], data.total || 0);
        } else {
          alert("데이터를 불러오는데 실패했습니다.");
        }
      } catch (error) {
        console.error("검색 에러 상세:", error);
      }
    },
    [macAddr, leakStatus, startDate, endDate, size, onSearch],
  );

  // 🌟 [검색] 버튼 클릭 시: 무조건 1페이지부터 검색하도록 설정
  const onSearchClick = () => {
    if (page === 1) {
      searchSensors(1);
    } else {
      setPage(1); // page 상태가 바뀌면 아래 useEffect가 작동하여 searchSensors(1)이 실행됩니다.
    }
  };

  // 페이지 번호(page)가 외부(SensorList 등)에서 바뀔 때마다 자동으로 검색 실행
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    searchSensors(page);
  }, [page]);

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
            onClick={onSearchClick}
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
