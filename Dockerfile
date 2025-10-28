
FROM node:latest
WORKDIR /app
COPY package*.json ./

RUN npm install
RUN apt-get update && apt-get install -y rsync
COPY tsconfig.json ./
COPY . .

RUN npm run build
EXPOSE 5000
ENV NODE_ENV=production
CMD ["npm", "start"]

