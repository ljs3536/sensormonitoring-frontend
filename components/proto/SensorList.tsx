"use client";

import { Check } from "lucide-react";
import React from "react";

export interface LeakRecord {
  seq: number;
  mac_addr: string;
  receptionDate: string;
  analysis: string;
  leakageFirst: string;
  leakProbability: string;
  sensorDataStr: string;
}

interface SensorListProps {
  data?: LeakRecord[]; // 부모에서 안 넘겨줄 수도 있으므로 ? 처리 (선택)
  selectedIds?: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  // 페이징 Props 추가
  page: number;
  total: number;
  size: number;
  onPageChange: (page: number) => void;
}

export function SensorList({
  data = [], // ✨ 핵심: undefined가 들어오면 빈 배열로 초기화
  selectedIds = [], // ✨ 핵심: undefined가 들어오면 빈 배열로 초기화
  onSelectionChange,
  page,
  total,
  size,
  onPageChange,
}: SensorListProps) {
  // 단일 체크박스 토글
  const handleToggle = (seq: number) => {
    if (selectedIds.includes(seq)) {
      onSelectionChange(selectedIds.filter((id) => id !== seq));
    } else {
      onSelectionChange([...selectedIds, seq]);
    }
  };

  // 전체 선택/해제 토글
  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectionChange(data.map((item) => item.seq));
    } else {
      onSelectionChange([]);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="flex flex-col h-full bg-white">
      {/* 데이터 건수 표시 */}
      <div className="p-2 text-sm font-bold bg-gray-100 text-gray-700 border-b flex justify-between">
        <span>센서 수집 데이터</span>
        <span className="text-blue-600">총 {total.toLocaleString()}건</span>
      </div>

      {/* 테이블 영역 (스크롤 설정: flex-1 overflow-y-auto) */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm text-left border-collapse text-black">
          <thead className="bg-gray-100 border-b sticky top-0 z-10">
            <tr>
              <th className="p-2 w-10">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === data.length && data.length > 0
                  }
                  onChange={handleToggleAll}
                />
              </th>
              <th className="p-2">macAddr</th>
              <th className="p-2">Reception date</th>
              <th className="p-2 w-20">Analysis</th>
              <th className="p-2 w-20">
                Leakage
                <br />
                (first)
              </th>
              <th className="p-2 w-24">
                Leak
                <br />
                probability
              </th>
            </tr>
          </thead>
          <tbody>
            {/* data가 무조건 배열이므로 삼항 연산자 없이 바로 length 체크 후 map 사용 가능 */}
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-black">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const isSelected = selectedIds.includes(row.seq);
                return (
                  <tr
                    key={row.seq}
                    className={`border-b cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleToggle(row.seq)}
                  >
                    <td className="p-2 text-black">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(row.seq)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="p-2 text-black">{row.mac_addr}</td>
                    <td className="p-2 text-black">{row.receptionDate}</td>
                    <td className="p-2 text-black">
                      <span
                        className={`px-2 text-black py-1 rounded text-xs  ${
                          row.analysis === "분석완료"
                            ? "bg-cyan-400"
                            : "bg-gray-400"
                        }`}
                      >
                        {row.analysis}
                      </span>
                    </td>
                    <td className="p-2 font-bold text-black">
                      {row.leakageFirst}
                    </td>
                    <td className="p-2 text-black">{row.leakProbability}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* 하단 페이징 컨트롤러 영역 */}
      {total > 0 && (
        <div className="flex justify-center items-center gap-4 p-3 bg-gray-50 border-t">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 font-bold text-black"
          >
            이전
          </button>

          <span className="text-sm font-bold text-gray-600">
            {page} <span className="text-gray-400">/</span> {totalPages}
          </span>

          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 font-bold text-black"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
