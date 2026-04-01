# 1. 베이스 이미지 설정
FROM node:18-alpine

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 의존성 설치 (package.json 먼저 복사해서 캐시 활용)
COPY package*.json ./
RUN npm install

# 4. 소스 복사 및 빌드
COPY . .
RUN npm run build

# 5. 포트 설정 (Next.js 기본 3000)
EXPOSE 3000

# 6. 실행 명령
CMD ["npm", "start"]