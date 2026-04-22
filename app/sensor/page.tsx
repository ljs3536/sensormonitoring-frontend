"use client";

import { useState, useEffect } from "react";
// API 모듈 경로 (프로젝트 구조에 맞게 '@' 나 상대경로로 맞춰주세요)
import { API } from "@/lib/api";

// 백엔드의 Pydantic 스키마와 동일한 타입 정의
interface Sensor {
  id: string;
  name: string;
  type: string;
  sampling_rate: number;
  location?: string;
  threshold_min: number;
  threshold_max: number;
  physics_k: number;
  physics_c: number;
  physics_m: number;
  ambient_temp: number;
  recommended_k: number;
  recommended_c: number;
  recommended_threshold: number;
  last_calibrated_at: Date;
  is_active: boolean;
}

export default function SensorManagementPage() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const initialFormState: Partial<Sensor> = {
    type: "piezo",
    sampling_rate: 1000,
    is_active: true,
  };
  const [formData, setFormData] = useState<Partial<Sensor>>(initialFormState);

  // 센서 목록 불러오기
  const fetchSensors = async () => {
    try {
      const res = await fetch(API.SENSOR_LIST);
      const data = await res.json();
      console.log(data);
      setSensors(data);
    } catch (error) {
      console.error("센서 데이터를 불러오는 중 오류 발생:", error);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, []);

  // 폼 입력 핸들러
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;

    if (type === "checkbox") {
      parsedValue = (e.target as HTMLInputElement).checked;
    } else if (type === "number") {
      parsedValue = value === "" ? "" : Number(value);
    }

    setFormData({
      ...formData,
      [name]: parsedValue,
    });
  };

  // 등록 및 수정 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = isEditing ? API.SENSOR_DETAIL(formData.id!) : API.SENSOR_LIST;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(`센서가 성공적으로 ${isEditing ? "수정" : "등록"}되었습니다.`);
        setFormData(initialFormState);
        fetchSensors();
      } else {
        alert("처리에 실패했습니다. 입력값을 확인해주세요.");
      }
    } catch (error) {
      console.error("저장 중 오류 발생:", error);
    }
  };

  // 삭제 처리
  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 센서를 삭제하시겠습니까?")) return;
    try {
      await fetch(API.SENSOR_DETAIL(id), { method: "DELETE" });
      fetchSensors();
    } catch (error) {
      console.error("삭제 중 오류 발생:", error);
    }
  };

  // 최적화(Auto-tune) 처리
  const AutotuneSensor = async (sensor: Sensor) => {
    if (
      !confirm(
        `[${sensor.name}] 센서의 데이터를 기반으로 최적의 K, C 값을 찾으시겠습니까?\n(데이터량에 따라 1~2분 소요될 수 있습니다)`,
      )
    )
      return;

    try {
      const res = await fetch(API.AI_AUTOTUNE(sensor.id, sensor.type), {
        method: "POST",
      });
      const result = await res.json();

      if (res.ok && result.status === "success") {
        alert(
          ` AI 분석 완료!\n추천 값이 센서 정보에 저장되었습니다. 수정 버튼을 눌러 확인하세요.`,
        );
        fetchSensors(); // 목록을 새로고침하여 DB에 저장된 추천값을 갱신합니다.
      } else {
        alert(`최적화 실패: ${result.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("최적화 중 오류 발생:", error);
      alert("서버와 통신하는 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">센서 메타데이터 관리</h1>

      {/* 등록/수정 폼 */}
      <form
        onSubmit={handleSubmit}
        className="bg-white text-black p-6 rounded-lg shadow-md mb-8 grid grid-cols-2 gap-4"
      >
        {/* AI 튜닝 리포트 배너 (수정 모드 & 추천값이 있을 때만 표시) */}
        {isEditing && formData.recommended_k != null && (
          <div className="col-span-2 bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-lg mb-2 flex justify-between items-center shadow-sm">
            <div>
              <h4 className="font-bold text-blue-800 flex items-center gap-2">
                💡 AI 튜닝 리포트
                <span className="text-xs font-normal text-blue-600">
                  (마지막 분석:{" "}
                  {formData.last_calibrated_at
                    ? new Date(formData.last_calibrated_at).toLocaleString()
                    : "최근"}
                  )
                </span>
              </h4>
              <p className="text-sm mt-1">
                AI가 데이터를 분석한 결과, 이 배관에 적합한 물리 특성은{" "}
                <strong>
                  K: {formData.recommended_k}, C: {formData.recommended_c},
                  THRESHOLD: {formData.recommended_threshold}
                </strong>{" "}
                로 예측되었습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  physics_k: formData.recommended_k,
                  physics_c: formData.recommended_c,
                  threshold_max: formData.recommended_threshold,
                });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 shadow transition-colors"
            >
              추천 값으로 덮어쓰기
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">센서 ID</label>
          <input
            type="text"
            name="id"
            value={formData.id || ""}
            onChange={handleInputChange}
            disabled={isEditing}
            className="w-full border p-2 rounded bg-gray-50 disabled:text-gray-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">센서 이름</label>
          <input
            type="text"
            name="name"
            value={formData.name || ""}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">센서 타입</label>
          <select
            name="type"
            value={formData.type || "piezo"}
            onChange={handleInputChange}
            disabled={isEditing}
            className="w-full border p-2 rounded bg-gray-50 disabled:text-gray-500"
          >
            <option value="piezo">Piezo (진동)</option>
            <option value="adxl">ADXL (가속도)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            샘플링 주기 (Hz)
          </label>
          <input
            type="number"
            name="sampling_rate"
            value={formData.sampling_rate || 1000}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            THRESHOLD_MIN
          </label>
          <input
            type="number"
            name="threshold_min"
            value={formData.threshold_min || 0}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            THRESHOLD_MAX
          </label>
          <input
            type="number"
            name="threshold_max"
            value={formData.threshold_max || 2.0}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">강성 (K)</label>
          <input
            type="number"
            step="0.0001"
            name="physics_k"
            value={formData.physics_k || 0.5}
            onChange={handleInputChange}
            className="w-full border p-2 rounded focus:ring-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">감쇠 (C)</label>
          <input
            type="number"
            step="0.0001"
            name="physics_c"
            value={formData.physics_c || 0.01}
            onChange={handleInputChange}
            className="w-full border p-2 rounded focus:ring-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">질량 (M)</label>
          <input
            type="number"
            step="0.1"
            name="physics_m"
            value={formData.physics_m || 1.0}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">온도</label>
          <input
            type="number"
            name="ambient_temp"
            value={formData.ambient_temp || 25}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div className="col-span-2 flex items-center mt-4">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active !== false}
            onChange={handleInputChange}
            className="mr-2 w-4 h-4 text-blue-600"
          />
          <label className="text-sm font-medium">활성화 여부</label>
        </div>
        <div className="col-span-2 mt-4 flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition-colors"
          >
            {isEditing ? "수정 완료" : "신규 등록"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormData(initialFormState);
              }}
              className="bg-gray-400 text-white px-6 py-2 rounded font-bold hover:bg-gray-500 transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </form>

      {/* 센서 목록 테이블 */}
      <div className="bg-white text-black rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">이름</th>
              <th className="p-4">타입</th>
              <th className="p-4">k</th>
              <th className="p-4">c</th>
              <th className="p-4">AI 추천 상태</th>
              <th className="p-4">상태</th>
              <th className="p-4 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {sensors.map((sensor) => (
              <tr key={sensor.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium">{sensor.id}</td>
                <td className="p-4">{sensor.name}</td>
                <td className="p-4 uppercase">{sensor.type}</td>
                <td className="p-4 font-mono">{sensor.physics_k}</td>
                <td className="p-4 font-mono">{sensor.physics_c}</td>
                <td className="p-4">
                  {sensor.recommended_k ? (
                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      분석 완료
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs text-white font-bold ${sensor.is_active ? "bg-green-500" : "bg-red-500"}`}
                  >
                    {sensor.is_active ? "ON" : "OFF"}
                  </span>
                </td>
                <td className="p-4 flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(sensor);
                      setIsEditing(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700 transition"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(sensor.id)}
                    className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600 transition"
                  >
                    삭제
                  </button>
                  <button
                    type="button"
                    onClick={() => AutotuneSensor(sensor)}
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700 font-bold transition flex items-center gap-1 shadow-sm"
                  >
                    AI 튜닝
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
