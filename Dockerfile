##############################
# DEPENDENCIES INSTALL STAGE
##############################
FROM node:22-alpine AS deps

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml* ./

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies (production + dev for build)
RUN pnpm install

##############################
# BUILD / PREP STAGE
##############################
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules

COPY . .

# No build step (JS), but if we switch to TypeScript:
# RUN pnpm run build

##############################
# RUNTIME STAGE
##############################
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules

COPY --from=builder /usr/src/app/src ./src
COPY package.json ./
COPY .env ./

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "src/server.js"]
