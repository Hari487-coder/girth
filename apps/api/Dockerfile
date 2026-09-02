# Girth API. Build from the repository root:
#   docker build -f apps/api/Dockerfile -t girth-api .
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/domain/package.json packages/domain/
COPY apps/api/package.json apps/api/
RUN npm ci -w packages/domain -w apps/api --no-audit --no-fund
COPY packages/domain packages/domain
COPY apps/api apps/api
RUN npm run build -w packages/domain && npm run build -w apps/api

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/domain/package.json packages/domain/
COPY apps/api/package.json apps/api/
RUN npm ci -w packages/domain -w apps/api --omit=dev --no-audit --no-fund
COPY --from=build /app/packages/domain/dist packages/domain/dist
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY --from=build /app/node_modules/.prisma node_modules/.prisma
COPY apps/api/docker-entrypoint.sh /usr/local/bin/girth-entrypoint
RUN chmod +x /usr/local/bin/girth-entrypoint && mkdir -p /app/apps/api/storage && chown -R node:node /app
USER node
WORKDIR /app/apps/api
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1
ENTRYPOINT ["girth-entrypoint"]
CMD ["node", "dist/src/index.js"]
