# Girth web. Build from the repository root:
#   docker build -f apps/web/Dockerfile -t girth-web .
FROM node:22-alpine AS build
ARG VITE_API_URL=/api
ARG VITE_APP_ENV=staging
ENV VITE_API_URL=$VITE_API_URL VITE_APP_ENV=$VITE_APP_ENV
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/domain/package.json packages/domain/
COPY apps/web/package.json apps/web/
RUN npm ci -w packages/domain -w apps/web --no-audit --no-fund
COPY packages/domain packages/domain
COPY apps/web apps/web
RUN npm run build -w packages/domain && npm run build -w apps/web

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
