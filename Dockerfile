# 1단계: 빌드 스테이지
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: 실행 스테이지 (빌드 결과물만 쏙 빼오기)
FROM node:20-alpine
WORKDIR /app
# 빌드에 필요했던 node_modules와 소스코드는 버리고, 결과물인 .next와 public만 가져옵니다.
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]