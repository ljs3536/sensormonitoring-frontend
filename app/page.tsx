"use client"; // React Hooks를 사용하기 위해 클라이언트 컴포넌트로 명시

import { useState, useEffect } from "react";

export default function Home() {
  const [sensorData, setSensorData] = useState({
    piezo: null,
    adxl: null,
  });

  // Polling 방식: 1초마다 백엔드 API 호출
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8001/api/data/latest");
        if (response.ok) {
          const data = await response.json();
          setSensorData(data);
        }
      } catch (error) {
        console.error("데이터 통신 에러:", error);
      }
    };

    fetchData(); // 컴포넌트 마운트 시 최초 1회 즉시 실행
    const intervalId = setInterval(fetchData, 1000); // 1초(1000ms)마다 반복 실행

    // 컴포넌트 언마운트 시 인터벌 해제 (메모리 누수 방지)
    return () => clearInterval(intervalId);
  }, []);

  return (
    <main className="min-h-screen p-10 bg-gray-50 text-gray-800">
      <h1 className="text-3xl font-bold mb-8">
        센서 데이터 모니터링 (Polling)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ADXL 센서 카드 */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">
            ADXL Sensor
          </h2>
          {sensorData.adxl ? (
            <div className="space-y-2 text-lg">
              <p>
                <strong>X:</strong> {sensorData.adxl.x}
              </p>
              <p>
                <strong>Y:</strong> {sensorData.adxl.y}
              </p>
              <p>
                <strong>Z:</strong> {sensorData.adxl.z}
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Timestamp: {sensorData.adxl.timestamp}
              </p>
            </div>
          ) : (
            <p className="text-gray-400">수신된 데이터가 없습니다.</p>
          )}
        </div>

        {/* Piezo 센서 카드 */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-green-600">
            Piezo Sensor
          </h2>
          {sensorData.piezo ? (
            <div className="space-y-2 text-lg">
              <p>
                <strong>Voltage:</strong> {sensorData.piezo.voltage} V
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Timestamp: {sensorData.piezo.timestamp}
              </p>
            </div>
          ) : (
            <p className="text-gray-400">수신된 데이터가 없습니다.</p>
          )}
        </div>
      </div>
    </main>
  );
}
