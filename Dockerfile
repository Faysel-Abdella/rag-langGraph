# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npx tsc

# ---------- Runtime stage ----------
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist

ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
