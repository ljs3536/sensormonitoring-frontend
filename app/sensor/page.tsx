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
  physics_k: number;
  physics_c: number;
  physics_m: number;
  ambient_temp: number;
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

    // 타입에 맞춰 안전하게 데이터 변환
    if (type === "checkbox") {
      parsedValue = (e.target as HTMLInputElement).checked;
    } else if (type === "number") {
      parsedValue = value === "" ? "" : Number(value); // 빈 값 처리 및 숫자 변환
    }

    setFormData({
      ...formData,
      [name]: parsedValue,
    });
  };

  // 등록 및 수정 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // API 객체를 활용하여 URL 결정
    const url = isEditing
      ? API.SENSOR_DETAIL(formData.id!) // 수정 시
      : API.SENSOR_LIST; // 신규 등록 시

    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(`센서가 성공적으로 ${isEditing ? "수정" : "등록"}되었습니다.`);
        setFormData(initialFormState); // 수정: 성공 후 다시 기본값으로 리셋
        setIsEditing(false);
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
      // API 객체를 활용하여 URL 결정
      await fetch(API.SENSOR_DETAIL(id), { method: "DELETE" });
      fetchSensors();
    } catch (error) {
      console.error("삭제 중 오류 발생:", error);
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
        <div>
          <label className="block text-sm font-medium mb-1">센서 ID</label>
          <input
            type="text"
            name="id"
            value={formData.id || ""}
            onChange={handleInputChange}
            disabled={isEditing}
            className="w-full border p-2 rounded"
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
            className="w-full border p-2 rounded"
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
          <label className="block text-sm font-medium mb-1">K</label>
          <input
            type="number"
            name="physics_k"
            value={formData.physics_k || 0.5}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">C</label>
          <input
            type="number"
            name="physics_c"
            value={formData.physics_c || 0.01}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">M</label>
          <input
            type="number"
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
            className="mr-2"
          />
          <label className="text-sm font-medium">활성화 여부</label>
        </div>
        <div className="col-span-2 mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {isEditing ? "수정 완료" : "신규 등록"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormData({});
              }}
              className="ml-2 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
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
              <th className="p-4">Hz</th>
              <th className="p-4">k</th>
              <th className="p-4">c</th>
              <th className="p-4">m</th>
              <th className="p-4">temp</th>
              <th className="p-4">상태</th>
              <th className="p-4">관리</th>
            </tr>
          </thead>
          <tbody>
            {sensors.map((sensor) => (
              <tr key={sensor.id} className="border-t">
                <td className="p-4 font-medium">{sensor.id}</td>
                <td className="p-4">{sensor.name}</td>
                <td className="p-4 uppercase">{sensor.type}</td>
                <td className="p-4">{sensor.sampling_rate}</td>
                <td className="p-4">{sensor.physics_k}</td>
                <td className="p-4">{sensor.physics_c}</td>
                <td className="p-4">{sensor.physics_m}</td>
                <td className="p-4">{sensor.ambient_temp}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs text-white ${sensor.is_active ? "bg-green-500" : "bg-red-500"}`}
                  >
                    {sensor.is_active ? "ON" : "OFF"}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(sensor);
                      setIsEditing(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(sensor.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    삭제
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
