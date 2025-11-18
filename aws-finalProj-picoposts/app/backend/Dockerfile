FROM node:18-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY src/ ./src/

EXPOSE 3000

CMD ["node", "src/index.js"]
