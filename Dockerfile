FROM node:26-alpine AS base
RUN apk add --no-cache eudev

FROM base AS dev
RUN apk add --no-cache python3 make g++ linux-headers
WORKDIR /app
RUN mkdir node_modules /home/node/.npm \
    && chown node:node /app /app/node_modules /home/node/.npm
USER node

FROM dev AS deps
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM dev AS build
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY --chown=node:node . .
RUN npm run build -- --fast

FROM base AS runtime
RUN adduser -h /marlinraker -G dialout -u 1001 -D marlinraker \
    && mkdir /marlinraker_files \
    && chown marlinraker /marlinraker_files
WORKDIR /marlinraker
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./
USER marlinraker
ENV MARLINRAKER_DIR=/marlinraker_files
EXPOSE 7125
VOLUME ["/marlinraker_files"]
CMD ["node", "--enable-source-maps", "index.js"]
