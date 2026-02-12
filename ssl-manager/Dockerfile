FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install --production

COPY server.js ./

EXPOSE 9094

CMD ["node", "server.js"]