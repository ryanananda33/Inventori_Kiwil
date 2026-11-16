# --- Tahap 1: Build Frontend (React + Vite) ---
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# --- Tahap 2: Setup Backend & Gabungkan Hasil Build ---
FROM node:20-alpine
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./

# Salin hasil build React (dari Tahap 1) ke folder public server
COPY --from=client-build /app/client/dist /app/server/public

# Environment variables bawaan
ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "src/app.js"]