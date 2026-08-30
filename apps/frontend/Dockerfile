# Stage 1: build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json nx.json tsconfig.base.json ./
COPY apps/frontend/package.json apps/frontend/
COPY packages/*/package.json packages/*/
COPY packages/shared/*/package.json packages/shared/*/
COPY packages/modules/*/package.json packages/modules/*/
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build:frontend

# Stage 2: nginx serving built assets
FROM nginx:1.27-alpine
COPY --from=frontend-builder /app/dist/apps/frontend/browser /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
