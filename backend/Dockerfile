FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./

# Install dependencies (generating package-lock.json)
RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Copy prisma schema if needed for runtime (though client is compiled)
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
