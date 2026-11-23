FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev --no-audit --no-fund
COPY scripts scripts
COPY src src
COPY patterns patterns
COPY migrations migrations
COPY entities.yaml tsconfig.json ./
USER node
CMD ["npm","run","process"]
