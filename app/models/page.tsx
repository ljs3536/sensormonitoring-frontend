"use client";

import { useState, useEffect, useCallback } from "react";
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
  memo?: string;
}

export default function ModelRegistryPage() {
  const router = useRouter();

  // -- 상태 관리 --
  const [models, setModels] = useState<ModelData[]>([]);
  const [loading, setLoading] = useState(true);
  //선택된 모델 ID들을 저장할 상태 추가
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // -- 페이징 --
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [size] = useState(10);

  // 1. fetchModels를 useCallback으로 감싸서 불필요한 재생성을 막습니다.
  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      // API 호출 시 현재 page와 size를 파라미터로 보냅니다.
      const res = await fetch(
        `${API.PROTO_MODEL_LIST}?page=${page}&size=${size}`,
      );

      if (res.ok) {
        const data = await res.json();

        // [데이터 정문화] 대문자로 들어오는 데이터를 소문자로 변환하여 UI 코드와의 호환성을 맞춥니다.
        const normalizedItems = (data.items || []).map((m: any) => ({
          model_id: m.MODEL_ID,
          mac_addr: m.MAC_ADDR,
          model_type: m.MODEL_TYPE,
          version: m.VERSION,
          train_samples: m.TRAIN_SAMPLES,
          threshold_mean: m.THRESHOLD_MEAN,
          status: m.STATUS,
          reg_dt: m.REG_DT,
          memo: m.MEMO,
          eval_metrics: m.EVAL_METRICS,
        }));

        setModels(normalizedItems);
        setTotal(data.total || 0); // 전체 개수 업데이트 (페이징 버튼 계산용)
      }
    } catch (e) {
      console.error("모델 목록 로드 실패", e);
    } finally {
      setLoading(false);
    }
  }, [page, size]); // page나 size가 바뀔 때만 이 함수가 새로 정의됩니다.

  useEffect(() => {
    fetchModels();
  }, [fetchModels]); // fetchModels가 바뀌었을 때(즉, page가 바뀌었을 때)만 실행됩니다.

  // 체크박스 선택 (삭제는 여러 개 가능하므로 제한 해제, 비교 버튼에서만 2개 체크)
  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;

    if (
      !window.confirm(
        `선택한 ${selectedIds.length}개의 모델을 삭제하시겠습니까?\n(파일은 새벽 스케줄러를 통해 정리됩니다)`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(API.PROTO_MODEL_LIST, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedIds),
      });

      if (res.ok) {
        alert("삭제 요청이 완료되었습니다.");
        setSelectedIds([]);
        fetchModels();
      }
    } catch (e) {
      alert("삭제 처리 중 오류가 발생했습니다.");
    }
  };

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

  const totalPages = Math.ceil(total / size);
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          🧠 AI 모델 관리 (Model Registry)
        </h1>
        <div className="flex gap-2">
          {/* 삭제 버튼1개 이상 선택 시 활성화 */}
          <button
            onClick={handleDelete}
            disabled={selectedIds.length === 0}
            className={`px-4 py-2 rounded shadow font-bold transition-all ${
              selectedIds.length > 0
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            선택 삭제 ({selectedIds.length})
          </button>
          {/* 비교하기 버튼 */}
          <button
            onClick={goToComparePage}
            className={`px-4 py-2 rounded shadow font-bold ${
              selectedIds.length === 2
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            선택한 2개 모델 비교
          </button>
          <button
            onClick={fetchModels}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded shadow font-bold"
          >
            새로고침
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
                models.map((m, i) => (
                  <tr
                    key={m.model_id || `model-${i}`}
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
                        {m.model_type?.toUpperCase() || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-black">
                      v{m.version}
                    </td>
                    <td className="px-6 py-4 text-black">
                      {m.train_samples?.toLocaleString()} 개
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
      {/* ---  페이징 UI --- */}
      <div className="flex items-center justify-between mt-6 px-2">
        <div className="text-sm text-gray-400">
          총 <span className="font-bold text-white">{total}</span>개의 모델
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-30"
          >
            이전
          </button>
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded text-sm font-bold ${page === i + 1 ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-30"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
