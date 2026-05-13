"use client";

interface LogTableProps {
  data: any[];
  total: number;
  page: number;
  size: number;
  onPageChange: (page: number) => void;
}

export function LogTable({
  data,
  total,
  page,
  size,
  onPageChange,
}: LogTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / size));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="sticky top-0 bg-gray-800 text-white z-10">
            <tr>
              <th className="p-3 border-r border-gray-700">ID</th>
              <th className="p-3 border-r border-gray-700">발생 일시</th>
              <th className="p-3 border-r border-gray-700">센서 MAC</th>
              <th className="p-3 border-r border-gray-700">사용 모델</th>
              <th className="p-3 border-r border-gray-700 text-right">
                누출 확률
              </th>
              <th className="p-3 text-center">AI 판정</th>
            </tr>
          </thead>
          <tbody className="text-black">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-400">
                  조회된 로그가 없습니다.
                </td>
              </tr>
            ) : (
              data.map((log) => (
                <tr
                  key={log.LOG_ID}
                  className="border-b hover:bg-indigo-50 transition-colors"
                >
                  <td className="p-3 text-gray-500">{log.LOG_ID}</td>
                  <td className="p-3">{log.REG_DT}</td>
                  <td className="p-3 font-mono font-bold">{log.MAC_ADDR}</td>
                  <td className="p-3 text-blue-600 underline cursor-pointer">
                    Model #{log.MODEL_ID}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {log.PROBABILITY.toFixed(2)}%
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        log.RESULT === "Y"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {log.RESULT === "Y" ? "누출 의심" : "정상"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이징 컨트롤 */}
      <div className="p-4 bg-gray-50 border-t flex justify-center items-center gap-4">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="px-4 py-1 bg-white border rounded shadow-sm disabled:opacity-30 font-bold text-black"
        >
          이전
        </button>
        <span className="font-bold text-gray-600">
          {page} / {totalPages} (총 {total}건)
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-4 py-1 bg-white border rounded shadow-sm disabled:opacity-30 font-bold text-black"
        >
          다음
        </button>
      </div>
    </div>
  );
}
