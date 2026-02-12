FROM node:18-alpine

WORKDIR /app

RUN npm install ws

COPY server.js ./

EXPOSE 9093

CMD ["node", "server.js"]