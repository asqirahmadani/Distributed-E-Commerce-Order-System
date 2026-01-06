FROM node:18-alpine

WORKDIR /app

# install dependencies for production
COPY package*.json ./
RUN npm ci --only=production

# copy application code
COPY . .

# create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "src/server.js"]