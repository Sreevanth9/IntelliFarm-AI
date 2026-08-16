# Multi-Stage Dockerfile for IntelliFarm AI on AWS App Runner / ECS / EC2

# Stage 1: Build React Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --legacy-peer-deps
COPY client/ ./
RUN npm run build

# Stage 2: Production Server Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

# Copy server package dependencies and install production modules
COPY server/package*.json ./server/
RUN npm ci --prefix server --omit=dev

# Copy server source files
COPY server/ ./server/

# Copy built React frontend to static serve directory
COPY --from=client-builder /app/client/build ./client/build

EXPOSE 5001

# Start the Node.js API server
CMD ["node", "server/server.js"]
