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

FROM base AS mainsail
ARG MAINSAIL_VERSION=v2.19.0
ARG MAINSAIL_SHA256=c4d9d96f89851c6ae0709c2f20725447f3fe8c57cf193869b0083441bd93378a
ADD --checksum=sha256:${MAINSAIL_SHA256} \
    https://github.com/mainsail-crew/mainsail/releases/download/${MAINSAIL_VERSION}/mainsail.zip /tmp/mainsail.zip
RUN mkdir /mainsail && unzip -q /tmp/mainsail.zip -d /mainsail

FROM base AS runtime
RUN adduser -h /marlinraker -G dialout -u 1001 -D marlinraker \
    && mkdir /marlinraker_files \
    && chown marlinraker /marlinraker_files
WORKDIR /marlinraker
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./
COPY --from=mainsail /mainsail ./www
USER marlinraker
ENV MARLINRAKER_DIR=/marlinraker_files
ENV MARLINRAKER_WWW_DIR=/marlinraker/www
ENV MARLINRAKER_CONTAINER=true
EXPOSE 7125
VOLUME ["/marlinraker_files"]
CMD ["node", "--enable-source-maps", "index.js", "--serve-static"]
