"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function ModelDetailPage() {
  const { id } = useParams(); // URL에서 모델 ID 가져오기
  const router = useRouter();
  const [model, setModel] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchModelDetail(Number(id));
      fetchModelStats(Number(id));
    }
  }, [id]);

  const fetchModelDetail = async (modelId: number) => {
    try {
      const res = await fetch(API.MODEL_DETAIL(modelId));
      if (res.ok) setModel(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchModelStats = async (modelId: number) => {
    try {
      const res = await fetch(API.MODEL_STATS(modelId));
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  if (!model) return <div className="p-10 text-center">로딩 중...</div>;

  const metrics = model.eval_metrics || {};
  const hist = metrics.train_dist_hist || { counts: [], bins: [] };

  // 1. 학습 데이터 분포 차트 (EVAL_METRICS)
  const trainChartData = {
    // 소수점 4자리까지만 잘라서 라벨 만들기
    labels: hist.bins.slice(0, -1).map((b: number) => b.toFixed(4)),
    datasets: [
      {
        label: "학습 데이터 분포 (개수)",
        data: hist.counts,
        backgroundColor: "rgba(59, 130, 246, 0.6)", // 파란색
      },
    ],
  };

  // 2. 실전 예측 통계 차트 (Prediction Log)
  const statsChartData = {
    labels: stats
      ? Object.keys(stats.stats).map((k) => `${k}~${Number(k) + 10}%`)
      : [],
    datasets: [
      {
        label: "실전 예측 확률 분포 (건수)",
        data: stats ? Object.values(stats.stats) : [],
        backgroundColor: "rgba(16, 185, 129, 0.6)", // 초록색
      },
    ],
  };

  // [NEW] 차트 데이터: PCA 2D 잠재 공간 시각화
  const points2d = metrics.pca_2d_points || []; // [[x,y], [x,y]...]
  const center2d = metrics.pca_2d_center || [0, 0]; // [x,y]

  const pcaChartData = {
    datasets: [
      {
        label:
          model?.model_type === "few"
            ? "전체 검증 데이터 (5개 기준점 평가용)"
            : "전체 학습 데이터",
        // [[x,y]] 배열을 [{x, y}] 형태로 변환
        data: points2d.map((p: number[]) => ({ x: p[0], y: p[1] })),
        backgroundColor: "rgba(59, 130, 246, 0.5)", // 파란색 반투명 점
        pointRadius: 3,
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
      {
        label: "Prototype 중심점",
        data: [{ x: center2d[0], y: center2d[1] }],
        backgroundColor: "#ef4444", // 빨간색
        pointRadius: 10,
        pointStyle: "crossRot", // 십자가/별 모양
        borderColor: "#ef4444",
        borderWidth: 2,
      },
    ],
  };

  // Scatter 차트 옵션 (중심점에 십자가 그리기 위함)
  const pcaChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: "PCA Component 1", color: "#666" },
        grid: { color: "#444" },
      },
      y: {
        title: { display: true, text: "PCA Component 2", color: "#666" },
        grid: { color: "#444" },
      },
    },
    plugins: {
      legend: { position: "top" as const, labels: { color: "#ccc" } },
      title: { display: false },
    },
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-black">
      <button
        onClick={() => router.back()}
        className="mb-4 bg-gray-200 px-4 py-2 rounded"
      >
        ← 목록으로 돌아가기
      </button>

      <h1 className="text-3xl font-bold mb-6 text-white">
        모델 상세 정보: {model.mac_addr} (v{model.version})
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 요약 정보 카드 */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-bold mb-4">기본 스펙</h2>
          <ul className="space-y-2">
            <li>
              <strong>타입:</strong> {model.model_type.toUpperCase()}-Shot
            </li>
            <li>
              <strong>상태:</strong> {model.status}
            </li>
            <li>
              <strong>생성일시:</strong> {model.reg_dt}
            </li>
            <li>
              <strong>학습 샘플 수:</strong> {metrics.train_samples} 개
            </li>
            <li>
              <strong>밀집도 점수:</strong>{" "}
              {metrics.tightness_score?.toFixed(2)}
            </li>
            <li>
              <strong>3-Sigma 한계선:</strong>{" "}
              {metrics.anomaly_limit_3sigma?.toFixed(5)}
            </li>
          </ul>
        </div>
      </div>

      {/* 차트 영역 (3개 카드로 구성) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/*  [NEW] 차트 0: PCA 2D 잠재 공간 시각화  */}
        <div className="bg-white p-6 rounded-lg shadow-lg border col-span-1 md:col-span-2 lg:col-span-1 h-[400px]">
          <h2 className="text-lg font-bold mb-2 text-gray-800 flex items-center gap-2">
            🌐 0. 2D 잠재 공간 시각화 (PCA)
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            320차원의 데이터를 2차원으로 꾹 눌러 점들의 밀집도를 눈으로
            확인합니다.
          </p>
          <div className="h-[300px]">
            <Scatter data={pcaChartData} options={pcaChartOptions} />
          </div>
        </div>

        {/* 차트 1: 학습 분포 (기존) */}
        <div className="bg-white p-6 rounded-lg shadow-lg border h-[400px]">
          <h2 className="text-lg font-bold mb-2 text-blue-700 flex items-center gap-2">
            📊 1. 학습 시 정상 데이터 거리 분포
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            모델이 생각하는 고차원에서의 '정상' 밀집도입니다.
          </p>
          <div className="h-[300px]">
            <Bar
              data={trainChartData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>

        {/* 차트 2: 실전 통계 (기존) */}
        <div className="bg-white p-6 rounded-lg shadow-lg border h-[400px]">
          <h2 className="text-lg font-bold mb-2 text-green-700 flex items-center gap-2">
            📈 2. 실전 예측 확률 분포
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            v6 모델의 모의고사 성적입니다. (백테스팅 결과)
          </p>
          <div className="h-[300px]">
            <Bar
              data={statsChartData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
