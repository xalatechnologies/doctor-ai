# Build stage
FROM node:18-alpine AS builder

# Build arguments
ARG NODE_ENV=production
ARG NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Build arguments
ARG NODE_ENV=production
ARG NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"

# Environment variables
ENV NODE_ENV=${NODE_ENV}
ENV NODE_OPTIONS=${NODE_OPTIONS}

WORKDIR /app

# Install necessary tools for health checks and security
RUN apk add --no-cache curl dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN if [ "$NODE_ENV" = "production" ]; then \
        npm ci --only=production; \
    else \
        npm ci; \
    fi

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy environment file based on NODE_ENV
COPY .env.template .env.template
RUN if [ "$NODE_ENV" = "production" ]; then \
        cp .env.template .env; \
    else \
        cp .env.template .env; \
    fi

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init as entrypoint for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start command based on environment
CMD if [ "$NODE_ENV" = "production" ]; then \
        npm run start:prod; \
    else \
        npm run start:dev; \
    fi 