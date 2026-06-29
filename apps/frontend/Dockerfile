# Build stage for shared package
FROM node:20-alpine AS shared-builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
RUN npm ci
WORKDIR /app/packages/shared
RUN npm run build

# Build stage for frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Build args for env variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

# Copy built shared package
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist

RUN npm ci

WORKDIR /app/apps/frontend
RUN npm run build

# Production stage - Nginx
FROM nginx:alpine
COPY --from=frontend-builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
