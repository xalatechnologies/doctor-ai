FROM node:18-alpine

WORKDIR /app

# Create logs directory and node_modules with proper permissions
RUN mkdir -p /app/logs /app/node_modules && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Copy package files
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm install

# Copy source code and config files
COPY --chown=node:node tsconfig*.json ./
COPY --chown=node:node src ./src

# Build the application
RUN npm run build

# Verify dist directory exists and contains main.js
RUN ls -la dist/ && \
    test -f dist/main.js

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"] 