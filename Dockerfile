# Dockerfile for AdaL Workflow - Hackathon
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    tmux \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

RUN npm install -g @sylphai/adal-cli

COPY . .

CMD ["sh"]