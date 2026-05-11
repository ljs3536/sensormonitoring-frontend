"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API } from "@/lib/api";

interface ModelData {
  model_id: number;
  mac_addr: string;
  model_type: string;
  version: number;
  train_samples: number;
  threshold_mean: number;
  status: string;
  reg_dt: string;
}

export default function ModelRegistryPage() {
  const [models, setModels] = useState<ModelData[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  //선택된 모델 ID들을 저장할 상태 추가
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  //체크박스 토글 함수 (최대 2개까지만 선택 가능하게 제한)
  const handleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      if (selectedIds.length >= 2) {
        alert("비교는 최대 2개의 모델만 가능합니다.");
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const fetchModels = async () => {
    try {
      setLoading(true);
      const res = await fetch(API.PROTO_MODEL_LIST);
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (e) {
      console.error("모델 목록 로드 실패", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleActivate = async (
    modelId: number,
    macAddr: string,
    version: number,
  ) => {
    if (
      !confirm(
        `[${macAddr}] 센서의 예측 모델을 v${version}으로 교체하시겠습니까?\n이 작업은 실시간 예측에 즉시 반영됩니다.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(API.ACTIVATE_MODEL(modelId), { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchModels(); // 상태 변경 후 목록 새로고침
      } else {
        alert("모델 교체 중 오류가 발생했습니다.");
      }
    } catch (e) {
      console.error("모델 교체 에러:", e);
    }
  };

  // 상세 페이지로 이동하는 함수 생성
  const goToDetailPage = (modelId: number) => {
    // router.push()를 쓰면 브라우저 주소창이 '/models/5' 이런 식으로 바뀝니다!
    router.push(`/models/${modelId}`);
  };

  //비교 페이지로 이동하는 함수
  const goToComparePage = () => {
    if (selectedIds.length !== 2) {
      alert("비교할 모델을 정확히 2개 선택해 주세요.");
      return;
    }
    // URL에 ?ids=1,2 형태로 달아서 보냅니다.
    router.push(`/models/compare?ids=${selectedIds.join(",")}`);
  };
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          🧠 AI 모델 관리 (Model Registry)
        </h1>
        <div className="flex gap-2">
          {/* 🌟 4. 비교하기 버튼 추가 */}
          <button
            onClick={goToComparePage}
            className={`px-4 py-2 rounded shadow font-bold ${
              selectedIds.length === 2
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            📊 선택한 2개 모델 비교
          </button>
          <button
            onClick={fetchModels}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded shadow font-bold"
          >
            🔄 새로고침
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            데이터를 불러오는 중입니다...
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-bold uppercase border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-center">선택</th>
                <th className="px-6 py-4">센서 ID</th>
                <th className="px-6 py-4">학습 타입</th>
                <th className="px-6 py-4">버전</th>
                <th className="px-6 py-4">학습 데이터</th>
                <th className="px-6 py-4">임계값 (평균거리)</th>
                <th className="px-6 py-4">상태</th>
                <th className="px-6 py-4">생성 일시</th>
                <th className="px-6 py-4 text-center">관리 액션</th>
              </tr>
            </thead>
            <tbody>
              {models.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    생성된 모델이 없습니다. 먼저 모델을 학습시켜 주세요.
                  </td>
                </tr>
              ) : (
                models.map((m) => (
                  <tr
                    key={m.model_id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(m.model_id)}
                        onChange={(e) => {
                          e.stopPropagation(); // 상세페이지 이동 방지
                          handleSelect(m.model_id);
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td
                      className="px-6 py-4 font-bold text-gray-800"
                      onClick={() => goToDetailPage(m.model_id)}
                    >
                      {m.mac_addr}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs text-white font-bold ${m.model_type === "all" ? "bg-blue-500" : "bg-purple-500"}`}
                      >
                        {m.model_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-black">
                      v{m.version}
                    </td>
                    <td className="px-6 py-4 text-black">
                      {m.train_samples.toLocaleString()} 개
                    </td>
                    <td className="px-6 py-4 text-black">{m.threshold_mean}</td>
                    <td className="px-6 py-4">
                      {m.status === "ACTIVE" && (
                        <span className="text-green-600 font-bold flex items-center gap-1">
                          🟢 실전 적용 중
                        </span>
                      )}
                      {m.status === "CANDIDATE" && (
                        <span className="text-orange-500 font-bold flex items-center gap-1">
                          🟡 검토 대기
                        </span>
                      )}
                      {m.status === "INACTIVE" && (
                        <span className="text-gray-400 flex items-center gap-1">
                          ⚪ 과거 모델
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{m.reg_dt}</td>
                    <td className="px-6 py-4 text-center">
                      {m.status !== "ACTIVE" ? (
                        <button
                          onClick={() =>
                            handleActivate(m.model_id, m.mac_addr, m.version)
                          }
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition-colors"
                        >
                          이 모델로 교체
                        </button>
                      ) : (
                        <span className="text-gray-400 font-semibold">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
