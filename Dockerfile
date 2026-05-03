# Stage 1: Build the Vite Frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Setup the Express Backend
FROM node:20-alpine
WORKDIR /app

# Install backend dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy backend source
COPY server/ ./server/

# Copy built frontend from Stage 1
COPY --from=build /app/dist ./dist

# Production environment
ENV NODE_ENV=production
# Google Cloud Run provides the PORT environment variable
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "server/index.js"]
