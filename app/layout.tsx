// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SensorDataProvider } from "@/context/SensorDataContext";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={inter.className}>
        {/* 모든 하위 컴포넌트에서 센서 데이터를 꺼내 쓸 수 있도록 Provider로 감쌉니다. */}
        <SensorDataProvider>{children}</SensorDataProvider>
      </body>
    </html>
  );
}
