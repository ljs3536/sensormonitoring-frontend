# Sensor Frontend
센서 데이터의 실시간 시각화 및 AI 분석 결과 대시보드

이 프로젝트는 센서에서 수집된 고속 데이터를 사용자에게 직관적으로 전달하기 위한 Next.js 기반의 웹 대시보드입니다. 
Recharts를 활용한 고성능 차트 렌더링과 WebSocket/Polling 하이브리드 통신을 통해 끊김 없는 모니터링 환경을 제공합니다.

## 🛠 Tech Stack
Framework: Next.js 14+ (App Router)

Styling: Tailwind CSS, Lucide React (Icons)

Visualization: Recharts

State Management: React Context API

Communication: WebSocket (Real-time Stream), HTTP Fetch (Polling/History)

## 🚀 Getting Started
### 1. Installation & Running
```
# 의존성 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```
브라우저에서 http://localhost:3000으로 접속하여 결과를 확인합니다.

## 📂 Key Pages & Features

🏠 Real-time Monitoring (Polling): 1초 주기로 백엔드 데이터를 가져와 현재 센서의 상태와 FFT 연산 결과를 시각화합니다.

📡 Live Streaming (WebSocket): /streaming 페이지. 백엔드에서 푸시되는 고속 데이터를 지연 없이 즉시 렌더링하여 실시간 파형을 보여줍니다.

📅 History Analysis: /history 페이지. InfluxDB에 저장된 과거 데이터를 시간 범위별로 조회하고 정밀 분석합니다.

🤖 AI Model Management: /analysis 페이지. 학습된 AI 모델의 목록을 확인하고, 수동 데이터를 입력하여 즉각적인 고장 판별(Inference)을 수행합니다.

## 🏗 State Architecture (Context)

효율적인 데이터 흐름을 위해 두 개의 전역 컨텍스트를 분리하여 운영합니다.

SensorDataContext: UI 설정값(Y축 범위, 샘플 레이트 등)과 일반적인 Polling 데이터를 관리합니다.

SensorStreamingContext: 고속으로 쏟아지는 WebSocket 스트림 데이터만을 독립적으로 관리하여 렌더링 성능을 최적화합니다.
