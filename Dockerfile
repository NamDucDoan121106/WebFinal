# ==========================================
# STAGE 1: BUILD REACT FRONTEND
# ==========================================

FROM node:22-bookworm-slim AS frontend-builder

WORKDIR /app/client

COPY client/package.json client/package-lock.json ./

RUN npm ci --include=dev

COPY client/ ./

RUN npm run build


# ==========================================
# STAGE 2: PREPARE NODE.JS BACKEND
# ==========================================

FROM node:22-bookworm-slim AS backend-builder

WORKDIR /app/server

COPY server/package.json server/package-lock.json ./

RUN npm ci --include=dev

COPY server/ ./

# Dummy URL used only for Prisma generation.
# No database connection is required.
# Generate Prisma Client without connecting to a database.
# These placeholder values are only used during the build.

RUN DB_TARGET=local \
    DB_HOST=127.0.0.1 \
    DB_PORT=3306 \
    MYSQL_USER=build \
    MYSQL_PASSWORD=build \
    MYSQL_DATABASE=build \
    MYSQL_SHADOW_DATABASE=build_shadow \
    DATABASE_URL="mysql://build:build@127.0.0.1:3306/build" \
    npx prisma generate


# ==========================================
# STAGE 3: APPLICATION RUNTIME
# ==========================================

FROM node:22-bookworm-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend-builder /app/server ./server

COPY --from=frontend-builder /app/client/dist ./client/dist

WORKDIR /app/server

RUN chown -R node:node /app

USER node

ENV NODE_ENV=production

ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]