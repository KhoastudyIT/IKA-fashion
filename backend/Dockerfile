FROM node:20-alpine

WORKDIR /app

# Cài dependencies (tận dụng cache layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source (backend dùng in-memory store, không cần thư mục database)
COPY src ./src

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "src/server.js"]
