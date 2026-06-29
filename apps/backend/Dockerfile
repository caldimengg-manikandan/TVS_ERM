# Build stage for shared package
FROM node:20-alpine AS shared-builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
# Need root package lock to install workspace dependencies
RUN npm ci
WORKDIR /app/packages/shared
RUN npm run build

# Build stage for backend
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Copy built shared package from shared-builder
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist

RUN npm ci

WORKDIR /app/apps/backend
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Install PM2 globally
RUN npm install -g pm2

# Copy production dependencies (or run npm ci --production)
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
RUN npm ci --omit=dev

# Copy built outputs
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=backend-builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=backend-builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=backend-builder /app/apps/backend/ecosystem.config.js ./apps/backend/

# Prisma engine needs to be installed in the production container
WORKDIR /app/apps/backend
RUN npx prisma generate

EXPOSE 5000

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
