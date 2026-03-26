// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SensorDataProvider } from "@/context/SensorDataContext";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

// 서버 컴포넌트이므로 metadata가 정상적으로 작동합니다.
export const metadata: Metadata = {
  title: "Sensor Dashboard",
  description: "MQTT Sensor Data Monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <SensorDataProvider>
          <div className="flex flex-col h-screen overflow-hidden">
            <Header />
            <div className="flex-1 overflow-hidden">{children}</div>
          </div>
        </SensorDataProvider>
      </body>
    </html>
  );
}
