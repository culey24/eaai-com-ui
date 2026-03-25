FROM node:22-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --omit=dev

COPY src ./src/
COPY scripts/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

RUN mkdir -p uploads/journals

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
