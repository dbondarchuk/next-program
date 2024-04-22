FROM node:lts-alpine as builder

WORKDIR /app

COPY . .

RUN yarn install \
  --prefer-offline \
  --frozen-lockfile \
  --non-interactive \
  --production=false

RUN yarn build

RUN rm -rf node_modules && \
  NODE_ENV=production yarn install \
  --prefer-offline \
  --pure-lockfile \
  --non-interactive \
  --production=true

FROM jrottenberg/ffmpeg:4.1-alpine AS ffmpeg
FROM node:lts-alpine
COPY --from=ffmpeg / /

WORKDIR /app

COPY --from=builder /app  .

CMD [ "yarn", "start", "./config.yaml" ]