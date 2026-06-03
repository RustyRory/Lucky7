# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

ARG NEXT_BASE_PATH="/Lucky7"
ARG NEXT_PUBLIC_BACKEND_URL="http://78.138.58.95/Lucky7-api"
ENV NEXT_BASE_PATH=$NEXT_BASE_PATH
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

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
