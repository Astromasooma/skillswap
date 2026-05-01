# Stage 1: Build the Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Setup the Express Backend
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./
# Copy built static files from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./dist

# Set port for Google Cloud Run
ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]
