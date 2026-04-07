# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

ARG NEXT_BASE_PATH="/lucky7"
ENV NEXT_BASE_PATH=$NEXT_BASE_PATH

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=builder /usr/src/app/.next/standalone ./
COPY --from=builder /usr/src/app/.next/static ./.next/static
COPY --from=builder /usr/src/app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
