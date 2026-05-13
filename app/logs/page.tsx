"use client";

import { useState, useEffect, useCallback } from "react";
import { LogFilterBar } from "@/components/logs/LogFilterBar";
import { LogTable } from "@/components/logs/LogTable";
import { API } from "@/lib/api";

export default function PredictionLogPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    macAddr: "전체",
    modelId: "전체",
    result: "전체",
  });
  const size = 50;

  // API 호출 로직 (부모가 관리)
  const fetchLogs = useCallback(
    async (targetPage: number) => {
      try {
        const { macAddr, modelId, result } = filters;
        const url = `${API.PROTO_LOG_LIST}?mac_addr=${macAddr}&model_id=${modelId}&result=${result}&page=${targetPage}&size=${size}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.items);
          setTotal(data.total);
        }
      } catch (e) {
        console.error("로그 로드 실패:", e);
      }
    },
    [filters, size],
  );

  // 페이지가 바뀌면 자동으로 데이터 호출
  useEffect(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);

  // 검색 버튼 눌렀을 때 (1페이지로 리셋)
  const handleSearch = (newFilters: {
    macAddr: string;
    modelId: string;
    result: string;
  }) => {
    setFilters(newFilters);
    if (page === 1) fetchLogs(1);
    else setPage(1);
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-background gap-4">
      <h1 className="text-xl font-bold text-black px-2">AI 예측 이력 관제</h1>

      {/* 검색 바 (눈) */}
      <section className="bg-white p-4 rounded shadow-sm border">
        <LogFilterBar onSearch={handleSearch} />
      </section>

      {/* 테이블 (몸) */}
      <section className="flex-1 bg-white border rounded shadow-sm overflow-hidden flex flex-col">
        <LogTable
          data={logs}
          total={total}
          page={page}
          size={size}
          onPageChange={setPage}
        />
      </section>
    </div>
  );
}
