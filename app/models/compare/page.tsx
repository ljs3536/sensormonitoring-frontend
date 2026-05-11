"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API } from "@/lib/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Scatter } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin,
);

export default function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idsParam = searchParams.get("ids");

  const [modelA, setModelA] = useState<any>(null);
  const [modelB, setModelB] = useState<any>(null);
  const [statsA, setStatsA] = useState<any>(null);
  const [statsB, setStatsB] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (idsParam) {
      const ids = idsParam.split(",").map(Number);
      if (ids.length === 2) {
        fetchAllData(ids[0], ids[1]);
      }
    }
  }, [idsParam]);

  const fetchAllData = async (id1: number, id2: number) => {
    setLoading(true);
    try {
      const [resA, resB, resStatsA, resStatsB] = await Promise.all([
        fetch(API.MODEL_DETAIL(id1)),
        fetch(API.MODEL_DETAIL(id2)),
        fetch(API.MODEL_STATS(id1)),
        fetch(API.MODEL_STATS(id2)),
      ]);

      setModelA(await resA.json());
      setModelB(await resB.json());
      setStatsA(await resStatsA.json());
      setStatsB(await resStatsB.json());
    } catch (e) {
      console.error("비교 데이터 로드 실패", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-white">
        데이터를 불러오는 중입니다...
      </div>
    );
  if (!modelA || !modelB)
    return (
      <div className="p-10 text-center text-white">
        모델을 찾을 수 없습니다.
      </div>
    );

  // 실전 예측 비교 차트 데이터 (Grouped Bar Chart)
  const compareChartData = {
    labels: statsA
      ? Object.keys(statsA.stats).map((k) => `${k}~${Number(k) + 10}%`)
      : [],
    datasets: [
      {
        label: `Model A (v${modelA.version} - ${modelA.model_type})`,
        data: statsA ? Object.values(statsA.stats) : [],
        backgroundColor: "rgba(59, 130, 246, 0.7)", // 파란색
      },
      {
        label: `Model B (v${modelB.version} - ${modelB.model_type})`,
        data: statsB ? Object.values(statsB.stats) : [],
        backgroundColor: "rgba(239, 68, 68, 0.7)", // 빨간색
      },
    ],
  };
  // PCA 차트 데이터 세팅
  const getPcaData = (model: any, color: string) => {
    const points2d = model?.eval_metrics?.pca_2d_points || [];
    const center2d = model?.eval_metrics?.pca_2d_center || [0, 0];

    return {
      datasets: [
        {
          label: "학습 데이터",
          data: points2d.map((p: number[]) => ({ x: p[0], y: p[1] })),
          backgroundColor: color,
          pointRadius: 3,
        },
        {
          label: "중심점",
          data: [{ x: center2d[0], y: center2d[1] }],
          backgroundColor: "#ef4444",
          pointRadius: 8,
          pointStyle: "crossRot",
          borderColor: "#ef4444",
          borderWidth: 2,
        },
      ],
    };
  };

  const pcaOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { color: "#e5e7eb" } },
      y: { grid: { color: "#e5e7eb" } },
    },
    plugins: { legend: { position: "top" as const } },
  };

  return (
    <div className="p-8 max-w-7xl mx-auto text-black">
      <button
        onClick={() => router.back()}
        className="mb-4 bg-gray-200 px-4 py-2 rounded font-bold"
      >
        ← 목록으로 돌아가기
      </button>

      <h1 className="text-3xl font-bold mb-6 text-white">
        A/B 모델 성능 비교 분석
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Model A 카드 */}
        <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-blue-500">
          <h2 className="text-xl font-bold mb-4 text-blue-600">
            Model A: {modelA.mac_addr} (v{modelA.version})
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>학습 타입:</strong> {modelA.model_type.toUpperCase()}
            </li>
            <li>
              <strong>상태:</strong> {modelA.status}
            </li>
            <li>
              <strong>밀집도 점수 (Tightness):</strong>{" "}
              {modelA.eval_metrics?.tightness_score?.toFixed(2)}
            </li>
            <li>
              <strong>3-Sigma 한계선:</strong>{" "}
              {modelA.eval_metrics?.anomaly_limit_3sigma?.toFixed(5)}
            </li>
          </ul>
        </div>

        {/* Model B 카드 */}
        <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-red-500">
          <h2 className="text-xl font-bold mb-4 text-red-600">
            Model B: {modelB.mac_addr} (v{modelB.version})
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>학습 타입:</strong> {modelB.model_type.toUpperCase()}
            </li>
            <li>
              <strong>상태:</strong> {modelB.status}
            </li>
            <li>
              <strong>밀집도 점수 (Tightness):</strong>{" "}
              {modelB.eval_metrics?.tightness_score?.toFixed(2)}
            </li>
            <li>
              <strong>3-Sigma 한계선:</strong>{" "}
              {modelB.eval_metrics?.anomaly_limit_3sigma?.toFixed(5)}
            </li>
          </ul>
        </div>
      </div>

      {/* PCA 2D 산점도 나란히 비교 영역  */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <h2 className="text-lg font-bold mb-2 text-blue-600">
            🌐 Model A 잠재 공간 (PCA)
          </h2>
          <div style={{ height: "300px" }}>
            <Scatter
              data={getPcaData(modelA, "rgba(59, 130, 246, 0.5)")}
              options={pcaOptions}
            />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <h2 className="text-lg font-bold mb-2 text-red-600">
            🌐 Model B 잠재 공간 (PCA)
          </h2>
          <div style={{ height: "300px" }}>
            <Scatter
              data={getPcaData(modelB, "rgba(239, 68, 68, 0.5)")}
              options={pcaOptions}
            />
          </div>
        </div>
      </div>

      {/* 실전 예측 분포 겹쳐보기 차트 */}
      <div className="bg-white p-6 rounded-lg shadow-lg border">
        <h2 className="text-xl font-bold mb-2">
          📈 실전 예측 확률 분포 대조 (Data Drift 확인)
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          두 모델이 동일한 환경에서 어떻게 다르게 예측했는지 비교합니다. 40~60%
          대역의 막대가 낮은 모델이 더 우수한 모델입니다.
        </p>
        <div style={{ height: "400px" }}>
          <Bar
            data={compareChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: "index", intersect: false },
            }}
          />
        </div>
      </div>
    </div>
  );
}
