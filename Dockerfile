
FROM node:22

WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY package*.json ./

RUN npm install --production=false
RUN if [ "$NODE_ENV" = "development" ]; then npm install --no-save sequelize-auto; fi

RUN apt-get update && apt-get install -y rsync && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY tsconfig.json ./
COPY . .

RUN if [ "$NODE_ENV" = "production" ]; then npm run build && npm prune --omit=dev; fi

EXPOSE 8080

CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"development\" ]; then npm run dev; else npm start; fi"]
