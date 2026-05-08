"use client";

import { useState } from "react";
import { ProtoFilterBar } from "@/components/proto/ProtoFilterBar";
import { SensorList, LeakRecord } from "@/components/proto/SensorList";
import { SensorView } from "@/components/proto/SensorView";
import { API } from "@/lib/api";

export default function LeakDashboard() {
  // 1. 검색된 전체 리스트 데이터
  const [leakData, setLeakData] = useState<LeakRecord[]>([]);

  // 2. 체크박스로 선택된 seq(ID) 배열
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 3. SensorView(그래프)에 넘겨줄 상세 데이터(sensorDataStr 포함) 배열
  const [selectedRecords, setSelectedRecords] = useState<LeakRecord[]>([]);

  const [selectedModelType, setSelectedModelType] = useState<"all" | "few">(
    "all",
  );
  // 검색 버튼을 눌렀을 때 실행되는 함수
  const handleSearch = (data: any[]) => {
    // 백엔드 데이터 포맷을 프론트엔드 인터페이스(LeakRecord)에 맞게 매핑
    const mappedData = data.map((item: any) => ({
      seq: item.SEQ,
      mac_addr: item.MAC_ADDR,
      receptionDate: item.REG_DT,
      analysis: item.LEAK_YN === "Y" ? "분석완료" : "대기", // 예시 매핑
      leakageFirst: item.LEAK_YN,
      leakProbability: item.LEAK_PRBBLT || "0",
      sensorDataStr: item.SENSOR_DATA || "", // 리스트에 데이터가 없으면 빈 문자열
    }));
    setLeakData(mappedData);
    setSelectedIds([]); // 검색 시 선택 초기화
    setSelectedRecords([]);
  };
  // 🌟 AI 예측 실행 함수
  const handlePredict = async () => {
    if (selectedIds.length === 0) {
      alert("예측할 데이터를 좌측 리스트에서 선택해주세요.");
      return;
    }

    // 선택된 데이터 중 첫 번째 레코드의 맥주소를 가져옵니다. (단일 맥주소 검색을 가정)
    // 참고: LeakRecord 인터페이스에 mac_addr이 없다면 추가해주셔야 합니다.
    const targetRecord = leakData.find((r) => r.seq === selectedIds[0]);
    if (!targetRecord) return;

    try {
      const res = await fetch(API.PREDICT_PROTO_MODEL(selectedModelType), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seq_list: selectedIds,
          mac_addr: targetRecord.mac_addr || "piezo_01", // DB 조회용 맥주소
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedResults = data.updated_data; // 백엔드에서 보내준 업데이트된 배열

        // 🌟 화면 새로고침 없이, 현재 leakData 상태에서 예측된 항목들만 값 변경
        const newData = leakData.map((item) => {
          const updated = updatedResults.find((u: any) => u.seq === item.seq);
          if (updated) {
            return {
              ...item,
              leakProbability: updated.leakProbability, // 0.00 -> 85.50 변경
              leakageFirst: updated.leakageFirst, // N -> Y 변경
              analysis: "분석완료", // 대기 -> 분석완료 변경
            };
          }
          return item;
        });

        setLeakData(newData);
        alert("AI 예측이 완료되었습니다!");
      } else {
        alert("예측 요청 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("예측 에러:", error);
    }
  };
  // 💡 [핵심] 체크박스 선택이 변경되었을 때 Detail 호출하기
  const handleSelectionChange = async (newSelectedIds: number[]) => {
    setSelectedIds(newSelectedIds);

    const newSelectedRecords: LeakRecord[] = [];

    // 새로 선택된 ID들을 순회하면서 상세 데이터 준비
    for (const seq of newSelectedIds) {
      // 이미 이전에 상세 데이터를 가져온 적이 있다면 재활용 (캐싱 효과)
      const existingRecord = selectedRecords.find((r) => r.seq === seq);

      if (existingRecord && existingRecord.sensorDataStr) {
        newSelectedRecords.push(existingRecord);
      } else {
        // 아직 상세 데이터(통문자열)가 없다면 Detail API 호출!
        const basicInfo = leakData.find((r) => r.seq === seq);
        if (basicInfo) {
          try {
            // seq와 mac_addr를 넘겨서 상세 조회
            const res = await fetch(
              API.SENSOR_PROTO_DETAIL(seq, basicInfo.mac_addr),
            );
            if (res.ok) {
              const detailData = await res.json();
              // 기본 정보에 백엔드에서 가져온 통문자열을 합쳐서 저장
              newSelectedRecords.push({
                ...basicInfo,
                sensorDataStr: detailData.SENSOR_DATA,
              });
            }
          } catch (error) {
            console.error(`${seq} 상세 데이터 호출 실패:`, error);
          }
        }
      }
    }

    // 그래프 컴포넌트에 넘겨줄 상태 업데이트
    setSelectedRecords(newSelectedRecords);
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-background gap-4">
      <section className="flex-none bg-white p-4 rounded shadow-sm">
        {/* 검색 컴포넌트에 onSearch 함수 전달 */}
        <ProtoFilterBar
          onSearch={handleSearch}
          onPredict={handlePredict}
          selectedModelType={selectedModelType}
          onModelTypeChange={setSelectedModelType}
        />
      </section>

      <section className="flex flex-1 gap-4 overflow-hidden">
        <div className="w-1/3 bg-white border rounded shadow-sm overflow-auto">
          {/* 리스트 컴포넌트 */}
          <SensorList
            data={leakData}
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
          />
        </div>

        <div className="w-2/3 bg-white border rounded shadow-sm p-4">
          {/* 그래프 컴포넌트 (상세 데이터를 포함한 selectedRecords 전달) */}
          <SensorView selectedRecords={selectedRecords} />
        </div>
      </section>
    </div>
  );
}
