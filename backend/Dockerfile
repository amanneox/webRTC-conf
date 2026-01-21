FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and config for build
COPY package.json package-lock.json ./
COPY nest-cli.json tsconfig.json tsconfig.build.json ./

# Install dependencies
RUN npm ci

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
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
