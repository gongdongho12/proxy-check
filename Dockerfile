FROM node:lts-buster-slim as builder
RUN mkdir /app
WORKDIR /app
ADD . /app
RUN npm install
RUN npm run build

FROM keymetrics/pm2
COPY --from=builder /app/dist /dist
COPY --from=builder /app/node_modules /node_modules
COPY --from=builder /app/ecosystem.config.js /ecosystem.config.js
CMD ["pm2-runtime", "start", "ecosystem.config.js"]