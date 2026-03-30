// src/app/analysis/page.tsx
"use client";

import { useState } from "react";
import { ModelManager } from "@/components/analysis/ModelManager";
import { AnalysisDashboard } from "@/components/analysis/AnalysisDashboard";

export default function AnalysisPage() {
  const [activeSubTab, setActiveSubTab] = useState<"management" | "result">(
    "management",
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* 서브 탭 메뉴 */}
      <div className="flex border-b border-border bg-card px-8 gap-8">
        <button
          onClick={() => setActiveSubTab("management")}
          className={`py-4 text-sm font-bold border-b-2 transition-all ${activeSubTab === "management" ? "border-indigo-500 text-indigo-500" : "border-transparent text-muted-foreground"}`}
        >
          ⚙️ 모델 관리 및 학습
        </button>
        <button
          onClick={() => setActiveSubTab("result")}
          className={`py-4 text-sm font-bold border-b-2 transition-all ${activeSubTab === "result" ? "border-indigo-500 text-indigo-500" : "border-transparent text-muted-foreground"}`}
        >
          📊 실시간 이상 탐지 결과
        </button>
        <button
          onClick={() => setActiveSubTab("result")}
          className={`py-4 text-sm font-bold border-b-2 transition-all ${activeSubTab === "result" ? "border-indigo-500 text-indigo-500" : "border-transparent text-muted-foreground"}`}
        >
          📊 실시간 이상 탐지 결과
        </button>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeSubTab === "management" ? (
          <ModelManager />
        ) : (
          <AnalysisDashboard />
        )}
      </div>
    </div>
  );
}
