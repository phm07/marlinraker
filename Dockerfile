# Copy source files and build distributable
FROM node:16-alpine AS build
RUN apk add --update python3 make g++

WORKDIR /marlinraker_build
COPY ./ /marlinraker_build
RUN npm ci && npm run build -- --fast

# Copy build output and install dependencies
FROM node:16-alpine AS prepare
RUN apk add --update python3 make gcc g++ linux-headers udev

WORKDIR /marlinraker
COPY --from=build /marlinraker_build/dist .
RUN npm install --unsafe-perm --build-from-source

# Copy files, create user and start program
FROM node:16-alpine

RUN apk add --update sudo eudev \
    && adduser -h /marlinraker -G dialout -u 1001 -D marlinraker \
    && mkdir /marlinraker_files  \
    && chown marlinraker /marlinraker_files

WORKDIR /marlinraker
USER marlinraker
COPY --from=prepare /marlinraker .

EXPOSE 7125
VOLUME ["/marlinraker_files"]
CMD ["npm", "run", "start"]