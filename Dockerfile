FROM node:20-bullseye
RUN apt-get update && apt-get install -y \
    libc6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm config set registry https://registry.npmjs.org/ \
  && npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm install --legacy-peer-deps --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000
COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]

