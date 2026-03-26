// src/components/Header.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // 현재 어떤 페이지에 있는지 확인
  const isHistory = pathname.startsWith("/history");

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 shrink-0">
      <h1 className="text-xl font-bold text-primary tracking-tighter">
        SENSOR MASTER
      </h1>

      {/* 네비게이션 탭 (Realtime vs History 페이지 전환) */}
      <div className="flex bg-muted p-1 rounded-lg">
        <button
          onClick={() => router.push("/")}
          className={`px-6 py-1.5 text-sm font-medium rounded-md transition-all ${!isHistory ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          📡 REALTIME 모니터링
        </button>
        <button
          onClick={() => router.push("/history")}
          className={`px-6 py-1.5 text-sm font-medium rounded-md transition-all ${isHistory ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          📚 HISTORY 기록 조회
        </button>
      </div>
      <div className="w-20" />
    </header>
  );
}
